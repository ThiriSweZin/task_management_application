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
const localStorage = __importStar(require("local-storage"));
const jwtCredentialId = config_json_1.default.jwt.defCredentialId;
class OrderRouter extends express_application_1.ExpressRouter {
    constructor() {
        super();
        this.route("/order-accepted").all(permission_1.Permission.onLoad).get(this.getList);
        this.route("/order-accepted/details/:id").all(permission_1.Permission.onLoad).get(this.getDetail);
        this.route("/order-accept-preview").all(permission_1.Permission.onLoad).get(this.getAcceptedDetail);
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
        let params = { title: config_json_1.default.appname, user: req.user.username, postUrl: "/order-accepted", params: {} };
        params = permission_1.Permission.getMenuParams(params, req, res);
        if (typeof req.jwtToken == "function") {
            req.jwtToken(jwtCredentialId)
                .then((result) => {
                params.token = result;
                res.render("dashboard/order-accepted", params);
            })
                .catch((err) => {
                next(err);
            });
        }
        else {
            res.render("dashboard/order-accepted", params);
        }
    }
    getDetail(req, res, next) {
        const data = { id: req.params.id };
        let total = 0;
        let order_items = [];
        const accept_orders = [];
        if (utils_1.Utils.isEmpty(data.id)) {
            return comfunc.sendForbidden(next);
        }
        localStorage.set("orderaccepted_id", data.id);
        console.log("orderaccepted_id in getaccepteddetail ", data.id);
        const postUrl = `/order-accepted/details/${data.id}`;
        let params = { title: config_json_1.default.appname, postUrl: postUrl, listUrl: "/order-accepted", params: data };
        params = permission_1.Permission.getMenuParams(params, req, res);
        RestApi.getDb("order")
            .leftJoin("customer", "order.customerid", "customer.id")
            .leftJoin("car_gate", "order.cargate", "car_gate.id")
            .where("order.id", data.id)
            .select("order.*", "customer.name", "car_gate.cargatename")
            .then((result) => {
            params.params = utils_1.Utils.mixin(data, result[0]);
            params.params.orderdate = utils_1.Utils.toDisplayDate(params.params.orderdate);
            params.params.netamount = utils_1.Utils.numberWithCommas(params.params.netamount);
            return RestApi.getDb("order_items as oi")
                .select("oi.id as orderitemid", "oi.orderid", "oi.productid", "oi.price", "oi.orderqty", "oi.replyqty", "product.id", "product.productcode", "product.productname", "product.price", "product.itemcount")
                .leftJoin("product", "oi.productid", "product.id")
                .where("oi.orderid", data.id);
        })
            .then((order_items_result) => {
            order_items = order_items_result;
            order_items.forEach((order_item) => {
                // if (params.params.status == "new") {
                //   order_item.qty = order_item.orderqty;
                //   total = order_item.price * order_item.orderqty;
                //   order_item.total = Utils.numberWithCommas(total);
                // } else {
                order_item.qty = order_item.replyqty;
                total = order_item.price * order_item.replyqty;
                order_item.total = utils_1.Utils.numberWithCommas(total);
                order_item.price = utils_1.Utils.numberWithCommas(order_item.price);
                // }
                // netamount += total;
                // console.log("netamount ", netamount);
            });
            // params.params.netamount = Utils.numberWithCommas(netamount);
            // console.log("params netamount ", params.params.netamount);
            params.params.details = order_items;
            return RestApi.getDb("customer").select().where("id", params.params.customerid);
        })
            .then((customer) => {
            params.params.customer = customer;
            if (typeof req.jwtToken == "function") {
                return req.jwtToken(jwtCredentialId);
            }
            else {
                return Promise.resolve("");
            }
        })
            .then((result) => {
            params.token = result;
            res.render("dashboard/order-accepted-details", params);
        })
            .catch((err) => {
            console.log(`${err}`);
            next({ "error": err });
        });
    }
    getAcceptedDetail(req, res, next) {
        const data = { id: req.params.id || localStorage.get("orderaccepted_id") };
        console.log("orderaccepted_id ", data.id);
        let total = 0;
        let order_items = [];
        const accept_orders = [];
        if (utils_1.Utils.isEmpty(data.id)) {
            return comfunc.sendForbidden(next);
        }
        const postUrl = `/order-accept-preview/${data.id}`;
        let params = { title: config_json_1.default.appname, postUrl: postUrl, listUrl: "/order-accepted", params: data };
        params = permission_1.Permission.getMenuParams(params, req, res);
        RestApi.getDb("order")
            .leftJoin("customer", "order.customerid", "customer.id")
            .leftJoin("car_gate", "order.cargate", "car_gate.id")
            .where("order.id", data.id)
            .select("order.*", "customer.name", "customer.mobile", "customer.phone", "customer.address", "customer.code", "car_gate.cargatename")
            .then((result) => {
            params.params = utils_1.Utils.mixin(data, result[0]);
            params.params.date = utils_1.Utils.toDisplayDateTime(params.params.date);
            params.params.orderdate = utils_1.Utils.toDisplayDate(params.params.orderdate);
            params.params.netamount = utils_1.Utils.numberWithCommas(params.params.netamount);
            return RestApi.getDb("order_items as oi")
                .select("oi.id as orderitemid", "oi.orderid", "oi.productid", "oi.price", "oi.orderqty", "oi.replyqty", "product.id", "product.productcode", "product.productname", "product.price", "product.itemcount")
                .leftJoin("product", "oi.productid", "product.id")
                .where("oi.orderid", data.id);
        })
            .then((order_items_result) => {
            order_items = order_items_result;
            order_items.forEach((order_item) => {
                // if (params.params.status == "new") {
                //   order_item.qty = order_item.orderqty;
                //   total = order_item.price * order_item.orderqty;
                //   order_item.total = Utils.numberWithCommas(total);
                // } else {
                order_item.qty = order_item.replyqty;
                total = order_item.price * order_item.replyqty;
                order_item.total = utils_1.Utils.numberWithCommas(total);
                order_item.price = utils_1.Utils.numberWithCommas(order_item.price);
                // }
                // netamount += total;
                // console.log("netamount ", netamount);
            });
            // params.params.netamount = Utils.numberWithCommas(netamount);
            // console.log("params netamount ", params.params.netamount);
            params.params.details = order_items;
            console.log("params.params ", params.params);
            return RestApi.getDb("customer").select().where("id", params.params.customerid);
        })
            .then((customer) => {
            params.params.customer = customer;
            if (typeof req.jwtToken == "function") {
                return req.jwtToken(jwtCredentialId);
            }
            else {
                return Promise.resolve("");
            }
        })
            .then((result) => {
            params.token = result;
            res.render("dashboard/order-accept-preview", params);
        })
            .catch((err) => {
            console.log(`${err}`);
            next({ "error": err });
        });
    }
}
exports.default = new OrderRouter();
//# sourceMappingURL=order-accepted.js.map