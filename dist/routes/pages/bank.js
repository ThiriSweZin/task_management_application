"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid = __importStar(require("uuid"));
const express_application_1 = require("../../lib/express-application");
const utils_1 = require("../../lib/utils");
const config_json_1 = __importDefault(require("../../../data/config.json"));
const RestApi = __importStar(require("../../lib/restapi"));
const comfunc = __importStar(require("../../lib/comfunc"));
const permission_1 = require("../../lib/permission");
const FileRouter = __importStar(require("../../routes/file"));
const jwtCredentialId = config_json_1.default.jwt.defCredentialId;
class BankRouter extends express_application_1.ExpressRouter {
    constructor() {
        super();
        this.route("/bank").all(permission_1.Permission.onLoad).get(this.getList);
        this.route("/bank/entry").all(permission_1.Permission.onLoad).get(this.getEntry).post(this.postEntry);
        this.route("/bank/edit/:id").all(permission_1.Permission.onLoad).get(this.getEdit).post(this.postEdit);
        this.route("/bank/delete/:id").all(permission_1.Permission.onLoad).post(this.postDelete);
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
                res.render("dashboard/bank", params);
            })
                .catch((err) => {
                next(err);
            });
        }
        else {
            res.render("dashboard/bank", params);
        }
    }
    getEntry(req, res, next) {
        let params = { title: config_json_1.default.appname, user: req.user.username, postUrl: "/bank/entry", params: {}, listUrl: "/bank" };
        params = permission_1.Permission.getMenuParams(params, req, res);
        RestApi.getDb("bank")
            .select()
            .then((result) => {
            params.banks = result;
            if (typeof req.jwtToken == "function") {
                return req.jwtToken(jwtCredentialId);
            }
            else {
                res.render("dashboard/bank-entry", params);
            }
        })
            .then((result) => {
            params.token = result;
            res.render("dashboard/bank-entry", params);
        })
            .catch((err) => {
            next(err);
        });
    }
    postEntry(req, res, next) {
        const data = comfunc.fillDefaultFields(req.body);
        data.id = uuid.v4();
        delete (data.banks);
        const db = RestApi.getDb("bank");
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
        const postUrl = `/bank/edit/${data.id}`;
        let params = { title: config_json_1.default.appname, user: req.user.username, postUrl: postUrl, listUrl: "/bank" };
        params = permission_1.Permission.getMenuParams(params, req, res);
        RestApi.getDb("bank").where({ id: data.id }).select()
            .then((result) => {
            params.params = utils_1.Utils.mixin(data, result[0]);
            return RestApi.getDb("bank").whereNot({ id: data.id }).select();
        })
            .then((result) => {
            params.banks = result;
            if (typeof req.jwtToken == "function") {
                return req.jwtToken(jwtCredentialId);
            }
            else {
                return Promise.resolve("");
            }
        })
            .then((result) => {
            params.token = result;
            res.render("dashboard/bank-entry", params);
        })
            .catch((err) => {
            console.log(`${err}`);
            next({ "error": err });
        });
    }
    postEdit(req, res, next) {
        const data = comfunc.fillDefaultFields(req.body);
        if (utils_1.Utils.isEmpty(data.id)) {
            return comfunc.sendForbidden(res);
        }
        const id = data.id;
        delete (data.id);
        delete (data.banks);
        RestApi.getDb("bank").where({ id: id }).first()
            .then((result) => {
            if (result.logo != "" && data.logo == "") {
                const file = FileRouter.default;
                file.init();
                file.delete(result.logo, (err, result) => {
                    if (err) {
                        res.json({ "error": result });
                    }
                });
            }
            return RestApi.getDb("bank").where({ id: id }).update(data, "id");
        })
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
        RestApi.getDb("bank").where({ id: data.id }).delete("id")
            .then((result) => {
            res.json({ "success": result });
        })
            .catch((err) => {
            console.log(`${err}`);
            res.json({
                "error": {
                    name: err.name,
                    message: err.message,
                    stack: err.stack
                }
            });
        });
    }
}
exports.default = new BankRouter();
//# sourceMappingURL=bank.js.map