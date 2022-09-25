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
const utils_1 = require("../../lib/utils");
const config_json_1 = __importDefault(require("../../../data/config.json"));
const RestApi = __importStar(require("../../lib/restapi"));
const comfunc = __importStar(require("../../lib/comfunc"));
const passport = __importStar(require("../../config/passport-config"));
const uuid = __importStar(require("uuid"));
const permission_1 = require("../../lib/permission");
const jwtCredentialId = config_json_1.default.jwt.defCredentialId;
class UserRegisterRouter extends express_application_1.ExpressRouter {
    constructor() {
        super();
        this.route("/user-register").all(permission_1.Permission.onLoad).get(this.getList);
        this.route("/user-register/entry").all(permission_1.Permission.onLoad).get(this.getEntry).post(this.postEntry);
        this.route("/user-register/edit/:id").all(permission_1.Permission.onLoad).get(this.getEdit).post(this.postEdit);
        this.route("/user-register/unlock/:id").all(permission_1.Permission.onLoad).post(this.postUnlock);
        this.route("/user-register/delete/:id").all(permission_1.Permission.onLoad).post(this.postDelete);
    }
    onLoad(req, res, next) {
        if (req.isAuthenticated()) {
            next();
        }
        else {
            res.redirect(`/login?url=${req.url}`);
        }
    }
    getList(req, res, next) {
        let params = { title: config_json_1.default.appname, user: req.user.username };
        params = permission_1.Permission.getMenuParams(params, req, res);
        if (typeof req.jwtToken == "function") {
            req.jwtToken(jwtCredentialId)
                .then((result) => {
                params.token = result;
                res.render("dashboard/user-register", params);
            })
                .catch((err) => {
                next(err);
            });
        }
        else {
            res.render("dashboard/user-register", params);
        }
    }
    getEntry(req, res, next) {
        let params = { title: config_json_1.default.appname, user: req.user.username, postUrl: "/user-register/entry", params: {}, listUrl: "/user-register" };
        params = permission_1.Permission.getMenuParams(params, req, res);
        RestApi.getDb("user").select()
            .then((result) => {
            params.users = result;
            if (typeof req.jwtToken == "function") {
                return req.jwtToken(jwtCredentialId);
            }
            else {
                res.render("dashboard/user-register-entry", params);
            }
        })
            .then((result) => {
            params.token = result;
            res.render("dashboard/user-register-entry", params);
        })
            .catch((err) => {
            next(err);
        });
    }
    postEntry(req, res, next) {
        const data = comfunc.fillDefaultFields(req.body);
        data.id = uuid.v4();
        data.password = passport.md5(req.body.password || "");
        delete (data.confirm_password);
        delete (data.users);
        const db = RestApi.getDb("user");
        db.insert(data, "id")
            .then((result) => {
            res.json({ "success": result });
        })
            .catch((err) => {
            console.log(`${err}`);
            res.json({ "error": err });
        });
    }
    getEdit(req, res, next) {
        const data = { id: req.params.id };
        if (utils_1.Utils.isEmpty(data.id)) {
            return comfunc.sendForbidden(next);
        }
        const postUrl = `/user-register/edit/${data.id}`;
        let params = { title: config_json_1.default.appname, user: req.user.username, postUrl: postUrl, listUrl: "/user-register" };
        params = permission_1.Permission.getMenuParams(params, req, res);
        RestApi.getDb("user")
            .leftJoin("user_role", "user.roleid", "user_role.id")
            .where({ "user.id": data.id })
            .select("user.*", "user_role.role")
            .then((result) => {
            params.params = utils_1.Utils.mixin(data, result[0]);
            return RestApi.getDb("user").whereNot({ id: data.id }).select();
        })
            .then((result) => {
            params.users = result;
            if (typeof req.jwtToken == "function") {
                return req.jwtToken(jwtCredentialId);
            }
            else {
                return Promise.resolve("");
            }
        })
            .then((result) => {
            params.token = result;
            res.render("dashboard/user-register-entry", params);
        })
            .catch((err) => {
            console.log(`${err}`);
            next({ "error": err });
        });
    }
    postEdit(req, res, next) {
        const data = comfunc.fillDefaultFields(req.body);
        const password = req.body.password || "";
        if (password == "")
            delete (data.password);
        else
            data.password = passport.md5(password);
        delete (data.confirm_password);
        delete (data.users);
        let db = RestApi.getDb("user");
        if (utils_1.Utils.isEmpty(data.id)) {
            return comfunc.sendForbidden(res);
        }
        db = db.where({ id: data.id });
        delete (data.id);
        db.update(data, "id")
            .then((result) => {
            res.json({ "success": result });
        })
            .catch((err) => {
            console.log(`${err}`);
            res.json({ "error": err });
        });
    }
    postUnlock(req, res, next) {
        let data = comfunc.fillDefaultFields(req.body);
        data = { id: req.params.id };
        console.log("data1 ", data);
        data.status = 0;
        let db = RestApi.getDb("user");
        if (utils_1.Utils.isEmpty(data.id)) {
            return comfunc.sendForbidden(res);
        }
        db = db.where({ id: data.id });
        delete (data.id);
        console.log("data ", data);
        db.update(data, "id")
            .then((result) => {
            res.json({ "success": result });
        })
            .catch((err) => {
            console.log(`${err}`);
            res.json({ "error": err });
        });
    }
    postDelete(req, res, next) {
        const data = { id: req.params.id };
        if (utils_1.Utils.isEmpty(data.id)) {
            return comfunc.sendForbidden(res);
        }
        RestApi.getDb("user").where({ id: data.id }).delete("id")
            .then((result) => {
            res.json({ "success": result });
        })
            .catch((err) => {
            console.log(`${err}`);
            res.json({ "error": err });
        });
    }
}
exports.default = new UserRegisterRouter();
//# sourceMappingURL=user-register.js.map