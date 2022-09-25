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
class SubCategoryRouter extends express_application_1.ExpressRouter {
    constructor() {
        super();
        this.route("/sub-category").all(permission_1.Permission.onLoad).get(this.getList);
        this.route("/sub-category/entry").all(permission_1.Permission.onLoad).get(this.getEntry).post(this.postEntry);
        this.route("/sub-category/edit/:id").all(permission_1.Permission.onLoad).get(this.getEdit).post(this.postEdit);
        this.route("/sub-category/delete/:id").all(permission_1.Permission.onLoad).post(this.postDelete);
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
                res.render("dashboard/sub-category", params);
            })
                .catch((err) => {
                next(err);
            });
        }
        else {
            res.render("dashboard/sub-category", params);
        }
    }
    getEntry(req, res, next) {
        let params = { title: config_json_1.default.appname, user: req.user.username, postUrl: "/sub-category/entry", params: {}, listUrl: "/sub-category" };
        params = permission_1.Permission.getMenuParams(params, req, res);
        if (typeof req.jwtToken == "function") {
            req.jwtToken(jwtCredentialId)
                .then((result) => {
                params.token = result;
                console.log("params ", params);
                res.render("dashboard/sub-category-entry", params);
            })
                .catch((err) => {
                next(err);
            });
        }
        else {
            res.render("dashboard/sub-category-entry", params);
        }
    }
    postEntry(req, res, next) {
        const data = comfunc.fillDefaultFields(req.body);
        data.id = uuid.v4();
        delete (data.subcategories);
        const db = RestApi.getDb("sub_category");
        db.insert(data, "id")
            .then((result) => {
            console.log("post sub", result);
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
        const postUrl = `/sub-category/edit/${data.id}`;
        let params = { title: config_json_1.default.appname, user: req.user.username, postUrl: postUrl, listUrl: "/sub-category" };
        params = permission_1.Permission.getMenuParams(params, req, res);
        RestApi.getDb("sub_category").where({ id: data.id }).select()
            .then((result) => {
            params.params = utils_1.Utils.mixin(data, result[0]);
            console.log("ykm params ", params);
            return RestApi.getDb("sub_category").whereNot({ id: data.id }).select();
        })
            .then((result) => {
            params.subcategories = result;
            if (typeof req.jwtToken == "function") {
                return req.jwtToken(jwtCredentialId);
            }
            else {
                return Promise.resolve("");
            }
        })
            .then((result) => {
            params.token = result;
            res.render("dashboard/sub-category-entry", params);
        })
            .catch((err) => {
            console.log(`${err}`);
            next({ "error": err });
        });
    }
    postEdit(req, res, next) {
        const data = comfunc.fillDefaultFields(req.body);
        let db = RestApi.getDb("sub_category");
        if (utils_1.Utils.isEmpty(data.id)) {
            return comfunc.sendForbidden(res);
        }
        db = db.where({ id: data.id });
        delete (data.id);
        delete (data.subcategories);
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
        RestApi.getDb("product").where({ subcategoryid: data.id }).first()
            .then((result) => {
            console.log("product result ", result);
            if (result) {
                throw new Error("Cannot delete. Already Used!");
            }
            else {
                return RestApi.getDb("sub_category").where({ id: data.id }).delete("id");
            }
        })
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
exports.default = new SubCategoryRouter();
//# sourceMappingURL=sub-category.js.map