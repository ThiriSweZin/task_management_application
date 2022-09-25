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
const permission_1 = require("../../lib/permission");
const jwtCredentialId = config_json_1.default.jwt.defCredentialId;
class InfoTypeRouter extends express_application_1.ExpressRouter {
    constructor() {
        super();
        this.route("/privacy-and-terms").all(permission_1.Permission.onLoad).get(this.getPrivacyAndTerms).post(this.postPrivacyAndTerms);
        this.route("/privacy-and-terms-template").get(this.getPrivacyAndTermsTemplate);
        this.route("/usage").all(permission_1.Permission.onLoad).get(this.getUsage).post(this.postUsage);
        this.route("/usage-template").get(this.getUsageTemplate);
    }
    onLoad(req, res, next) {
        if (req.isAuthenticated()) {
            next();
        }
        else {
            res.redirect(`/login?url=${req.url}`);
        }
    }
    getPrivacyAndTerms(req, res, next) {
        const data = {};
        let params = { title: config_json_1.default.appname, user: req.user.username, postUrl: "/privacy-and-terms", params: {} };
        params = permission_1.Permission.getMenuParams(params, req, res);
        RestApi.getDb("privacy_terms").first()
            .then((result) => {
            params.params = utils_1.Utils.mixin(data, result);
            if (typeof req.jwtToken == "function") {
                return req.jwtToken(jwtCredentialId);
            }
            else {
                return Promise.resolve("");
            }
        })
            .then((result) => {
            params.token = result;
            res.render("dashboard/privacy-and-terms", params);
            // setTimeout(() => {
            //   res.render("dashboard/privacy-and-terms", params);
            // }, 1000);
        })
            .catch((err) => {
            console.log(`${err}`);
            next({ "error": err });
        });
    }
    postPrivacyAndTerms(req, res, next) {
        const data = comfunc.fillDefaultFields(req.body);
        let db = RestApi.getDb("privacy_terms");
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
    getPrivacyAndTermsTemplate(req, res, next) {
        const params = { params: {} };
        RestApi.getDb("privacy_terms")
            .select("template")
            .first()
            .then((result) => {
            params.params = result;
            console.log("result ", result);
            res.render("template/privacy-and-terms-layout", params);
        })
            .catch((err) => {
            console.log(`${err}`);
            next({ "error": err });
        });
    }
    getUsage(req, res, next) {
        const data = {};
        let params = { title: config_json_1.default.appname, user: req.user.username, postUrl: "/usage", params: {} };
        params = permission_1.Permission.getMenuParams(params, req, res);
        RestApi.getDb("usage").first()
            .then((result) => {
            params.params = utils_1.Utils.mixin(data, result);
            if (typeof req.jwtToken == "function") {
                return req.jwtToken(jwtCredentialId);
            }
            else {
                return Promise.resolve("");
            }
        })
            .then((result) => {
            params.token = result;
            res.render("dashboard/usage", params);
            // setTimeout(() => {
            //   res.render("dashboard/usage", params);
            // }, 1000);
        })
            .catch((err) => {
            console.log(`${err}`);
            next({ "error": err });
        });
    }
    postUsage(req, res, next) {
        console.log("post usage mobile");
        const data = comfunc.fillDefaultFields(req.body);
        console.log("data ", data);
        let db = RestApi.getDb("usage");
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
    getUsageTemplate(req, res, next) {
        const params = { params: {} };
        RestApi.getDb("usage")
            .select("template")
            .first()
            .then((result) => {
            params.params = result;
            console.log("result ", result);
            res.render("template/usage-layout", params);
        })
            .catch((err) => {
            console.log(`${err}`);
            next({ "error": err });
        });
    }
}
exports.default = new InfoTypeRouter();
//# sourceMappingURL=weburl.js.map