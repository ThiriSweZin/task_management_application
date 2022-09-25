"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_application_1 = require("../../lib/express-application");
const config_json_1 = __importDefault(require("../../../data/config.json"));
const permission_1 = require("../../lib/permission");
const jwtCredentialId = config_json_1.default.jwt.defCredentialId;
class DashboardRouter extends express_application_1.ExpressRouter {
    constructor() {
        super();
        this.route("/dashboard").all(permission_1.Permission.onLoad).get(this.getDashboard);
    }
    onLoad(req, res, next) {
        if (req.isAuthenticated()) {
            next();
        }
        else {
            res.redirect(`/login?url=${req.url}`);
        }
    }
    getDashboard(req, res, next) {
        let params = { title: config_json_1.default.appname, user: req.user.username };
        params = permission_1.Permission.getMenuParams(params, req, res);
        if (typeof req.jwtToken == "function") {
            req.jwtToken(jwtCredentialId)
                .then((result) => {
                params.token = result;
                res.render("dashboard/index", params);
            })
                .catch((err) => {
                next(err);
            });
        }
        else {
            res.render("dashboard/index", params);
        }
    }
}
exports.default = new DashboardRouter();
//# sourceMappingURL=dashboard.js.map