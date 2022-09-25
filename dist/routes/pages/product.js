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
const firebase_msg_1 = require("../../lib/firebase-msg");
const jwtCredentialId = config_json_1.default.jwt.defCredentialId;
class ProductRouter extends express_application_1.ExpressRouter {
    constructor() {
        super();
        this.route("/product").all(permission_1.Permission.onLoad).get(this.getList);
        this.route("/product/entry").all(permission_1.Permission.onLoad).get(this.getEntry).post(this.postEntry);
        this.route("/product/edit/:id").all(permission_1.Permission.onLoad).get(this.getEdit).post(this.postEdit);
        this.route("/product/delete/:id").all(permission_1.Permission.onLoad).post(this.postDelete);
        this.route("/product/editprice/:id").all(permission_1.Permission.onLoad).post(this.postEditPrice);
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
        let params = { title: config_json_1.default.appname, user: req.user.username, listUrl: "/product" };
        params = permission_1.Permission.getMenuParams(params, req, res);
        if (typeof req.jwtToken == "function") {
            req.jwtToken(jwtCredentialId)
                .then((result) => {
                params.token = result;
                res.render("dashboard/product", params);
            })
                .catch((err) => {
                next(err);
            });
        }
        else {
            res.render("dashboard/product", params);
        }
    }
    getEntry(req, res, next) {
        let params = { title: config_json_1.default.appname, user: req.user.username, postUrl: "/product/entry", params: {}, listUrl: "/product" };
        params = permission_1.Permission.getMenuParams(params, req, res);
        RestApi.getDb("product")
            .select()
            .then((result) => {
            if (typeof req.jwtToken == "function") {
                return req.jwtToken(jwtCredentialId);
            }
            else {
                res.render("dashboard/product-entry", params);
            }
        })
            .then((result) => {
            params.token = result;
            res.render("dashboard/product-entry", params);
        })
            .catch((err) => {
            next(err);
        });
    }
    postEntry(req, res, next) {
        const data = comfunc.fillDefaultFields(req.body);
        console.log("product data ", data);
        data.id = uuid.v4();
        data.createddate = utils_1.Utils.toSqlDateTime(new Date()); // for get latest product by createddate "desc"
        if (typeof data.ifpackage === "undefined") {
            data.ifpackage = "item";
        }
        if (data.itemcount == "") {
            data.itemcount = 0;
        }
        RestApi.getDb("product").insert(data, "id")
            .then((result) => {
            console.log("product ", result);
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
        const postUrl = `/product/edit/${data.id}`;
        let params = { title: config_json_1.default.appname, user: req.user.username, postUrl: postUrl, listUrl: "/product" };
        params = permission_1.Permission.getMenuParams(params, req, res);
        RestApi.getDb("product").where({ id: data.id }).select()
            .then((result) => {
            params.params = utils_1.Utils.mixin(data, result[0]);
            console.log("getedit data ", params.params);
            if (typeof req.jwtToken == "function") {
                return req.jwtToken(jwtCredentialId);
            }
            else {
                return Promise.resolve("");
            }
        })
            .then((result) => {
            params.token = result;
            res.render("dashboard/product-entry", params);
        })
            .catch((err) => {
            console.log(`${err}`);
            next({ "error": err });
        });
    }
    postEdit(req, res, next) {
        const data = comfunc.fillDefaultFields(req.body);
        const noti = new firebase_msg_1.Notification();
        const product_data = {
            type: "product-detail",
            productid: data.id
        };
        if (utils_1.Utils.isEmpty(data.id)) {
            return comfunc.sendForbidden(res);
        }
        const id = data.id;
        delete (data.createddate);
        if (typeof data.ifpackage === "undefined") {
            data.ifpackage = "item";
        }
        if (data.itemcount == "") {
            data.itemcount = 0;
        }
        console.log("data ", data);
        RestApi.getDb("product").where({ id: id }).update(data)
            .then((result) => {
            console.log("product-data ", result);
            //   return noti.sendToTopic(product_data);
            // })
            // .then((result) => {
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
        RestApi.getDb("order_items").where({ productid: data.id }).first()
            .then((result) => {
            if (result) {
                throw new Error("Cannot delete. Already Used!");
            }
            else {
                return RestApi.getDb("product").where({ id: data.id }).delete("id");
            }
        })
            .then((deleteResult) => {
            res.json({ "success": deleteResult });
        })
            .catch((err) => {
            console.log(`${err}`);
            res.json({ "error": err });
        });
    }
    postEditPrice(req, res, next) {
        console.log("call postEditPrice");
        const user = req.user;
        const userid = user.id;
        const data = comfunc.fillDefaultFields(req.body);
        console.log("data 1", data);
        RestApi.getDb("product").update({ "price": data.productprice, "updateddate": utils_1.Utils.toSqlDate(new Date()) }, "id")
            .where({ id: data.productid })
            .then((result) => {
            console.log("product-data ", result);
            res.json({ "message": "success" });
        })
            .catch((err) => {
            console.log(`${err}`);
            res.json({ "error": err });
        });
    }
}
exports.default = new ProductRouter();
//# sourceMappingURL=product.js.map