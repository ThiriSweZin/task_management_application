"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_application_1 = require("../../lib/express-application");
const config_json_1 = __importDefault(require("../../../data/config.json"));
const passport = __importStar(require("../../config/passport-config"));
const RestApi = __importStar(require("../../lib/restapi"));
const jwtCredentialId = config_json_1.default.jwt.defCredentialId;
class UserRouter extends express_application_1.ExpressRouter {
    constructor() {
        super();
        /* Login route. */
        this.route("/login").get(this.getLogin).post(this.postLogin);
        /* Log out route */
        this.route("/logout").all(this.logout);
        /* Register route */
        this.route("/register").get(this.doSomething);
        /* Change password route */
        // this.route("/changepwd").get(this.getChangePassword).post(this.postChangePassword);
        this.route("/changepassword").get(this.getChangePassword).post(this.postChangePassword);
    }
    static buildAlert(type, message) {
        const cssClass = (type == "error") ? "danger" : type;
        const title = type.toUpperCase();
        return `<div class='alert alert-${cssClass} alert-dismissible' role='alert'> ${message}
  <button class='close' type='button' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button>
  </div>`;
    }
    getLogin(req, res, next) {
        const params = { title: "Login" };
        params.url = req.query.url || "/";
        if (typeof req.csrfToken == "function") {
            params.csrfToken = req.csrfToken();
        }
        res.render("auth/login", params);
    }
    postLogin(req, res, next) {
        passport.default.authenticate("local", (err, user) => {
            console.log("user ", user);
            const params = { title: config_json_1.default.appname };
            console.log("params ", params);
            params.url = req.body.url || "/dashboard";
            if (typeof req.csrfToken == "function") {
                params.csrfToken = req.csrfToken();
            }
            if (err) {
                params.message = UserRouter.buildAlert("error", err.message);
                res.render("auth/login", params);
            }
            else if (!user) {
                params.message = UserRouter.buildAlert("error", "Invalid login user!");
                res.render("auth/login", params);
            }
            else if (user.status === 1) {
                params.message = UserRouter.buildAlert("error", "Already login on another device");
                res.render("auth/login", params);
            }
            else {
                req.logIn(user, { session: true }, (errLogin) => {
                    if (errLogin) {
                        return next(err);
                    }
                    else {
                        if (user.id === 0) {
                            return res.redirect("/dashboard");
                        }
                        else {
                            RestApi.getDb("user").update({ "status": 1 }, "id").where({ id: user.id })
                                .then((result) => {
                                console.log("update user ", result);
                                return res.redirect("/dashboard");
                            })
                                .catch((error) => {
                                console.log("user update error ", error);
                            });
                        }
                    }
                });
            }
        })(req, res, next);
    }
    logout(req, res, next) {
        console.log("req user ", req.user);
        RestApi.getDb("user").update({ "status": 0 }, "id").where({ id: req.user.id })
            .then((result) => {
            console.log("update user ", result);
            // return res.redirect("/");
        })
            .catch((error) => {
            console.log("user update error ", error);
        });
        req.logOut();
        res.redirect("/");
    }
    getChangePassword(req, res, next) {
        if (req.isAuthenticated() && req.user) {
            const params = { title: config_json_1.default.appname, user: req.user.username, params: req.user };
            params.url = req.query["url"] || "/dashboard";
            console.log("user called url >>", params);
            params.message = {
                status: "",
                title: "",
                msg: ""
            };
            if (typeof req.csrfToken == "function") {
                params.csrfToken = req.csrfToken();
            }
            console.log("called user !!");
            res.render("auth/changepassword", params);
        }
        else {
            res.redirect(`/login?url=${req.url}`);
        }
    }
    postChangePassword(req, res, next) {
        const redirectUrl = req.body.redirecturl || "/dashboard";
        const outFunc = (data, msgtype, msg) => {
            const params = { title: config_json_1.default.appname, user: req.user.username, params: data, url: redirectUrl };
            // params.message = UserRouter.buildAlert(msgtype, msg);
            params.message = {
                status: (msgtype == "error") ? "danger" : msgtype,
                title: msgtype.toUpperCase(),
                msg: msg
            };
            if (typeof req.csrfToken == "function") {
                params.csrfToken = req.csrfToken();
            }
            console.log("params pws >>", params);
            res.render("auth/changepassword", params);
        };
        if (req.isAuthenticated() && req.user) {
            const data = req.body;
            const user = req.user;
            const id = user.id || -1;
            const password = user.password || "";
            console.log("data >>", data + " user >>", user + "id >>", id + "pwd >>", password);
            if (data.id && data.id == id) {
                const oldpassword = passport.md5(data.oldpassword);
                console.log("oldpassword ", oldpassword);
                if (password != oldpassword) {
                    outFunc(data, "error", "Old Password does not match!");
                }
                else if (data.newpassword != data.confirmpassword) {
                    outFunc(data, "error", "Confirm Password does not match!");
                }
                else {
                    const saveData = {
                        id: id,
                        usertype: user.usertype,
                        username: user.username,
                        password: passport.md5(data.newpassword)
                    };
                    passport.default.updateSystemUser(saveData)
                        .then((result) => {
                        if (result) {
                            outFunc(data, "success", "Password has changed!");
                        }
                        else {
                            outFunc(data, "error", "Password can not changed!");
                        }
                    })
                        .catch((err) => {
                        outFunc(data, "error", "Password can not changed!");
                    });
                }
            }
            else {
                res.redirect(redirectUrl);
            }
        }
        else {
            res.redirect(redirectUrl);
        }
    }
    doSomething(req, res, next) {
        res.send("Hello world!");
    }
}
exports.default = new UserRouter();
//# sourceMappingURL=user.js.map