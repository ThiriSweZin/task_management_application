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
class CustomerRouter extends express_application_1.ExpressRouter {
    constructor() {
        super();
        this.route("/customer").all(permission_1.Permission.onLoad).get(this.getList);
        this.route("/customer/entry").all(permission_1.Permission.onLoad).get(this.getEntry).post(this.postEntry);
        this.route("/customer/edit/:id").all(permission_1.Permission.onLoad).get(this.getEdit).post(this.postEdit);
        this.route("/customer/delete/:id").all(permission_1.Permission.onLoad).post(this.postDelete);
        this.route("/customer-remarks").all(permission_1.Permission.onLoad).get(this.getRemarks);
        this.route("/customer-remarks/entry").all(permission_1.Permission.onLoad).get(this.getRemarksEntry).post(this.postRemarksEntry);
        this.route("/customer-remarks/edit/:id").all(permission_1.Permission.onLoad).get(this.getRemarksEdit).post(this.postRemarksEdit);
        this.route("/customer-remarks/delete/:id").all(permission_1.Permission.onLoad).post(this.postRemarksDelete);
        this.route("/customer_favorite").all(permission_1.Permission.onLoad).get(this.getFavorite);
        this.route("/customer_favorite/detail/:id").all(permission_1.Permission.onLoad).get(this.getFavoriteDetail);
        this.route("/feedback").all(permission_1.Permission.onLoad).get(this.getFeedback);
        this.route("/feedback/detail/:id").all(permission_1.Permission.onLoad).get(this.getFeedbackDetail);
        this.route("/feedback/image/:id").all(permission_1.Permission.onLoad).get(this.getImages);
        this.route("/customer/active/:id").all(permission_1.Permission.onLoad).post(this.postActive);
        this.route("/customer/inactive/:id").all(permission_1.Permission.onLoad).post(this.postInactive);
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
                res.render("dashboard/customer", params);
            })
                .catch((err) => {
                next(err);
            });
        }
        else {
            res.render("dashboard/customer", params);
        }
    }
    getEntry(req, res, next) {
        let params = { title: config_json_1.default.appname, user: req.user.username, postUrl: "/customer/entry", params: {}, listUrl: "/customer" };
        params = permission_1.Permission.getMenuParams(params, req, res);
        RestApi.getDb("customer")
            .select()
            .then((result) => {
            console.log("params ", params);
            if (typeof req.jwtToken == "function") {
                return req.jwtToken(jwtCredentialId);
            }
            else {
                res.render("dashboard/customer-entry", params);
            }
        })
            .then((result) => {
            params.token = result;
            res.render("dashboard/customer-entry", params);
        })
            .catch((err) => {
            next(err);
        });
    }
    postEntry(req, res, next) {
        const data = comfunc.fillDefaultFields(req.body);
        data.id = uuid.v4();
        const db = RestApi.getDb("customer");
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
        const postUrl = `/customer/edit/${data.id}`;
        let params = { title: config_json_1.default.appname, user: req.user.username, postUrl: postUrl, listUrl: "/customer" };
        params = permission_1.Permission.getMenuParams(params, req, res);
        RestApi.getDb("customer").where({ id: data.id }).select()
            .then((result) => {
            params.params = utils_1.Utils.mixin(data, result[0]);
            if (typeof req.jwtToken == "function") {
                return req.jwtToken(jwtCredentialId);
            }
            else {
                return Promise.resolve("");
            }
        })
            .then((result) => {
            params.token = result;
            res.render("dashboard/customer-entry", params);
        })
            .catch((err) => {
            console.log(`${err}`);
            next({ "error": err });
        });
    }
    postEdit(req, res, next) {
        const data = comfunc.fillDefaultFields(req.body);
        let db = RestApi.getDb("customer");
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
        let ord_customer, fb_customer;
        RestApi.getDb("order").where({ customerid: data.id }).first()
            .then((result) => {
            ord_customer = result;
            return RestApi.getDb("feedback").where({ customerid: data.id }).first();
        })
            .then((result) => {
            fb_customer = result;
            return RestApi.getDb("customer_favorite").where({ customerid: data.id }).first();
        })
            .then((result) => {
            if (result || ord_customer || fb_customer) {
                throw new Error("Cannot delete. Already Used!");
            }
            else {
                return RestApi.getDb("customer").where({ id: data.id }).delete("id");
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
    getRemarks(req, res, next) {
        let params = { title: config_json_1.default.appname, user: req.user.username, postUrl: "/customer/remarks", params: {} };
        params = permission_1.Permission.getMenuParams(params, req, res);
        if (typeof req.jwtToken == "function") {
            req.jwtToken(jwtCredentialId)
                .then((result) => {
                params.token = result;
                res.render("dashboard/customer-remarks", params);
            })
                .catch((err) => {
                next(err);
            });
        }
        else {
            res.render("dashboard/customer-remarks", params);
        }
    }
    getRemarksEntry(req, res, next) {
        let params = { title: config_json_1.default.appname, user: req.user.username, postUrl: "/customer-remarks/entry", params: {}, listUrl: "/customer-remarks" };
        params = permission_1.Permission.getMenuParams(params, req, res);
        if (typeof req.jwtToken == "function") {
            req.jwtToken(jwtCredentialId)
                .then((result) => {
                params.token = result;
                res.render("dashboard/customer-remarks-entry", params);
            })
                .catch((err) => {
                next(err);
            });
        }
        else {
            res.render("dashboard/customer-remarks-entry", params);
        }
    }
    postRemarksEntry(req, res, next) {
        const data = comfunc.fillDefaultFields(req.body);
        data.date = utils_1.Utils.toSqlDate(data.date);
        data.id = uuid.v4();
        const db = RestApi.getDb("customer_remark");
        db.insert(data, "id")
            .then((result) => {
            res.json({ "success": result });
        })
            .catch((err) => {
            console.log(`${err}`);
            res.json({ "error": err });
        });
    }
    getRemarksEdit(req, res, next) {
        const data = { id: req.params.id };
        if (utils_1.Utils.isEmpty(data.id)) {
            return comfunc.sendForbidden(next);
        }
        const postUrl = `/customer-remarks/edit/${data.id}`;
        let params = { title: config_json_1.default.appname, user: req.user.username, postUrl: postUrl, listUrl: "/customer-remarks", params: data };
        params = permission_1.Permission.getMenuParams(params, req, res);
        RestApi.getDb("customer_remark")
            .select("customer_remark.*", "customer.name")
            .leftJoin("customer", "customer_remark.customerid", "customer.id")
            .where("customer_remark.id", data.id)
            .then((result) => {
            params.params = utils_1.Utils.mixin(data, result[0]);
            params.params.date = utils_1.Utils.toDisplayDate(params.params.date);
            if (typeof req.jwtToken == "function") {
                return req.jwtToken(jwtCredentialId);
            }
            else {
                return Promise.resolve("");
            }
        })
            .then((result) => {
            params.token = result;
            res.render("dashboard/customer-remarks-entry", params);
        })
            .catch((err) => {
            console.log(`${err}`);
            next({ "error": err });
        });
    }
    postRemarksEdit(req, res, next) {
        const data = comfunc.fillDefaultFields(req.body);
        data.date = utils_1.Utils.toSqlDate(data.date);
        let db = RestApi.getDb("customer_remark");
        if (utils_1.Utils.isEmpty(data.id)) {
            return comfunc.sendForbidden(res);
        }
        db = db.where({ id: data.id });
        delete (data.id);
        delete (data.name);
        delete (data.code);
        db.update(data, "id")
            .then((result) => {
            res.json({ "success": result });
        })
            .catch((err) => {
            console.log(`${err}`);
            res.json({ "error": err });
        });
    }
    postRemarksDelete(req, res, next) {
        const data = { id: req.params.id };
        if (utils_1.Utils.isEmpty(data.id)) {
            return comfunc.sendForbidden(res);
        }
        RestApi.getDb("customer_remark").where({ id: data.id }).delete("id")
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
    getFavorite(req, res, next) {
        const params = { title: config_json_1.default.appname, user: req.user.username };
        params.login = req.isAuthenticated();
        if (typeof req.jwtToken == "function") {
            req.jwtToken(jwtCredentialId)
                .then((result) => {
                params.token = result;
                console.log("params1 >>", params);
                res.render("dashboard/customer_favorite", params);
            })
                .catch((err) => {
                next(err);
            });
        }
        else {
            res.render("dashboard/customer_favorite", params);
            console.log("params2 >>", params);
        }
    }
    getFavoriteDetail(req, res, next) {
        const data = { id: req.params.id };
        if (utils_1.Utils.isEmpty(data.id)) {
            return comfunc.sendForbidden(next);
        }
        // const postUrl = `/customer_favorite/detail/${data.id}`;
        let params = { title: config_json_1.default.appname, user: req.user.username, listUrl: "/customer_favorite", params: data };
        params = permission_1.Permission.getMenuParams(params, req, res);
        RestApi.getDb("customer_favorite")
            .select("customer.name", "product.productname", "customer_favorite.date")
            .leftJoin("customer", "customer_favorite.customerid", "customer.id")
            .leftJoin("product", "customer_favorite.productid", "product.id")
            .where("customer_favorite.id", data.id)
            .then((result) => {
            params.params = utils_1.Utils.mixin(data, result[0]);
            params.params.date = utils_1.Utils.toDisplayDate(params.params.date);
            if (typeof req.jwtToken == "function") {
                return req.jwtToken(jwtCredentialId);
            }
            else {
                return Promise.resolve("");
            }
        })
            .then((result) => {
            params.token = result;
            res.render("dashboard/customer_favorite_detail", params);
            console.log("result >>", params);
        })
            .catch((err) => {
            console.log(`${err}`);
            next({ "error": err });
        });
    }
    getFeedback(req, res, next) {
        let params = { title: config_json_1.default.appname, user: req.user.username };
        params = permission_1.Permission.getMenuParams(params, req, res);
        if (typeof req.jwtToken == "function") {
            req.jwtToken(jwtCredentialId)
                .then((result) => {
                params.token = result;
                res.render("dashboard/feedback", params);
            })
                .catch((err) => {
                next(err);
            });
        }
        else {
            res.render("dashboard/feedback", params);
        }
    }
    getFeedbackDetail(req, res, next) {
        const data = { id: req.params.id };
        if (utils_1.Utils.isEmpty(data.id)) {
            return comfunc.sendForbidden(next);
        }
        // const postUrl = `/customer_favorite/detail/${data.id}`;
        let params = { title: config_json_1.default.appname, user: req.user.username, listUrl: "/feedback", params: data };
        params = permission_1.Permission.getMenuParams(params, req, res);
        RestApi.getDb("feedback")
            .leftJoin("customer", "feedback.customerid", "customer.id")
            .select("feedback.*", "customer.name", "customer.phone")
            .where("feedback.id", data.id)
            .then((result) => {
            result[0].createddate = utils_1.Utils.toDisplayDate(result[0].createddate);
            params.params = utils_1.Utils.mixin(data, result[0]);
            if (typeof req.jwtToken == "function") {
                return req.jwtToken(jwtCredentialId);
            }
            else {
                return Promise.resolve("");
            }
        })
            .then((result) => {
            params.token = result;
            res.render("dashboard/feedback-detail", params);
            console.log("result >>", params);
        })
            .catch((err) => {
            console.log(`${err}`);
            next({ "error": err });
        });
    }
    getImages(req, res, next) {
        const id = req.params.id;
        if (utils_1.Utils.isEmpty(id)) {
            return comfunc.sendForbidden(next);
        }
        const postUrl = `/feedback/image/${id}`;
        let params = { title: config_json_1.default.appname, user: req.user.username, postUrl: postUrl, listUrl: "/feedback" };
        params = permission_1.Permission.getMenuParams(params, req, res);
        RestApi.getDb("feedback").where({ id: id }).select("images")
            .then((result) => {
            console.log("result ", result);
            let images_string = result[0].images;
            console.log("images_string ", images_string);
            let images_arr = images_string.split(',');
            console.log("arr ", images_arr);
            let images_array = images_arr.map((image) => {
                return image.replace('.', '');
            });
            console.log("images_array ", images_array);
            params.params = { id: id, images: images_array };
            if (typeof req.jwtToken == "function") {
                return req.jwtToken(jwtCredentialId);
            }
            else {
                return Promise.resolve("");
            }
        })
            .then((result) => {
            params.token = result;
            res.render("dashboard/feedback-image", params);
        })
            .catch((err) => {
            console.log(`${err}`);
            res.json({ "error": err });
        });
    }
    postActive(req, res, next) {
        console.log("post active");
        const id = req.params.id;
        console.log("id ", id);
        RestApi.getDb("customer")
            .where("id", id)
            .update({ is_active: 1, active_status: 1, updateddate: utils_1.Utils.toSqlDate(new Date()) }, "id")
            .then((result) => {
            res.json({ "success": result });
        })
            .catch((err) => {
            console.log(`${err}`);
            res.json({ "error": err });
        });
    }
    postInactive(req, res, next) {
        console.log("post Inactive");
        const id = req.params.id;
        console.log("id ", id);
        RestApi.getDb("customer")
            .where("id", id)
            .update({ is_active: 0, active_status: 0, updateddate: utils_1.Utils.toSqlDate(new Date()) }, "id")
            .then((result) => {
            res.json({ "success": result });
        })
            .catch((err) => {
            console.log(`${err}`);
            res.json({ "error": err });
        });
    }
}
exports.default = new CustomerRouter();
//# sourceMappingURL=customer.js.map