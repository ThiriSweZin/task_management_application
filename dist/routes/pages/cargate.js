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
const jwtCredentialId = config_json_1.default.jwt.defCredentialId;
class CarGateRouter extends express_application_1.ExpressRouter {
    constructor() {
        super();
        this.route("/cargate").all(permission_1.Permission.onLoad).get(this.getList);
        this.route("/cargate/entry").all(permission_1.Permission.onLoad).get(this.getEntry).post(this.postEntry);
        this.route("/cargate/edit/:id").all(permission_1.Permission.onLoad).get(this.getEdit).post(this.postEdit);
        this.route("/cargate/delete/:id").all(permission_1.Permission.onLoad).post(this.postDelete);
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
                res.render("dashboard/cargate", params);
            })
                .catch((err) => {
                next(err);
            });
        }
        else {
            res.render("dashboard/cargate", params);
        }
    }
    getEntry(req, res, next) {
        let params = { title: config_json_1.default.appname, user: req.user.username, postUrl: "/cargate/entry", params: {}, listUrl: "/cargate" };
        params = permission_1.Permission.getMenuParams(params, req, res);
        if (typeof req.jwtToken == "function") {
            req.jwtToken(jwtCredentialId)
                .then((result) => {
                params.token = result;
                console.log("params ", params);
                res.render("dashboard/cargate-entry", params);
            })
                .catch((err) => {
                next(err);
            });
        }
        else {
            res.render("dashboard/cargate-entry", params);
        }
    }
    postEntry(req, res, next) {
        const data = comfunc.fillDefaultFields(req.body);
        data.id = uuid.v4();
        delete (data.cargates);
        const db = RestApi.getDb("car_gate");
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
        console.log("POST");
        const data = { id: req.params.id };
        console.log("id ", data.id);
        if (utils_1.Utils.isEmpty(data.id)) {
            return comfunc.sendForbidden(next);
        }
        const postUrl = `/cargate/edit/${data.id}`;
        console.log("postUrl >>", postUrl);
        let params = { title: config_json_1.default.appname, user: req.user.username, postUrl: postUrl, listUrl: "/cargate", params: data };
        // params.login = req.isAuthenticated();
        params = permission_1.Permission.getMenuParams(params, req, res);
        console.log("params ", params);
        RestApi.getDb("car_gate")
            .leftJoin("city", "car_gate.cityid", "city.id")
            .where({ "car_gate.id": data.id })
            .select("car_gate.*", "city.cityname")
            .then((result) => {
            console.log("reslt ", result);
            params.params = utils_1.Utils.mixin(data, result[0]);
            console.log("params 2", params.params);
            return RestApi.getDb("car_gate").whereNot("id", data.id).select();
        })
            .then((result) => {
            params.cargates = result;
            console.log("params 3", params.params);
            if (typeof req.jwtToken == "function") {
                return req.jwtToken(jwtCredentialId);
            }
            else {
                return Promise.resolve("");
            }
        })
            .then((result) => {
            params.token = result;
            console.log("params 4", params.params);
            res.render("dashboard/cargate-entry", params);
        })
            .catch((err) => {
            console.log(`${err}`);
            next({ "error": err });
        });
    }
    postEdit(req, res, next) {
        const data = comfunc.fillDefaultFields(req.body);
        delete (data.cargates);
        let db = RestApi.getDb("car_gate");
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
    postDelete(req, res, next) {
        const data = { id: req.params.id };
        if (utils_1.Utils.isEmpty(data.id)) {
            return comfunc.sendForbidden(res);
        }
        RestApi.getDb("car_gate").where({ id: data.id }).delete("id")
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
exports.default = new CarGateRouter();
//# sourceMappingURL=cargate.js.map