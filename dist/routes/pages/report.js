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
const permission_1 = require("../../lib/permission");
const utils_1 = require("../../lib/utils");
const comfunc = __importStar(require("../../lib/comfunc"));
const RestApi = __importStar(require("../../lib/restapi"));
const jwtCredentialId = config_json_1.default.jwt.defCredentialId;
class ReportRouter extends express_application_1.ExpressRouter {
    constructor() {
        super();
        this.route("/customer-report").all(permission_1.Permission.onLoad).get(this.getCustomerReport);
        this.route("/product-report").all(permission_1.Permission.onLoad).get(this.getProductReport);
        this.route("/monthly-order-report").all(permission_1.Permission.onLoad).get(this.getMonthlyOrderReport);
        this.route("/monthly-order-report/detail/:id/:status").all(permission_1.Permission.onLoad).get(this.getMonthlyOrderReportDetail);
        this.route("/daily-order-detail-report").all(permission_1.Permission.onLoad).get(this.getDailyOrderDetailReport);
        this.route("/order-detail-excel-report").all(permission_1.Permission.onLoad).get(this.getOrderDetailExcelReport);
    }
    getCustomerReport(req, res, next) {
        let params = { title: config_json_1.default.appname, user: req.user.username };
        params = permission_1.Permission.getMenuParams(params, req, res);
        console.log("params ", params);
        if (typeof req.jwtToken == "function") {
            req.jwtToken(jwtCredentialId)
                .then((result) => {
                params.token = result;
                console.log("paramas ", params);
                res.render("dashboard/customer-report", params);
            })
                .catch((err) => {
                next(err);
            });
        }
        else {
            res.render("dashboard/customer-report", params);
        }
    }
    getProductReport(req, res, next) {
        let params = { title: config_json_1.default.appname, user: req.user.username };
        params = permission_1.Permission.getMenuParams(params, req, res);
        console.log("params ", params);
        if (typeof req.jwtToken == "function") {
            req.jwtToken(jwtCredentialId)
                .then((result) => {
                params.token = result;
                console.log("paramas ", params);
                res.render("dashboard/product-report", params);
            })
                .catch((err) => {
                next(err);
            });
        }
        else {
            res.render("dashboard/product-report", params);
        }
    }
    getMonthlyOrderReport(req, res, next) {
        let params = { title: config_json_1.default.appname, user: req.user.username, params: {} };
        params = permission_1.Permission.getMenuParams(params, req, res);
        if (typeof req.jwtToken == "function") {
            req.jwtToken(jwtCredentialId)
                .then((result) => {
                params.token = result;
                console.log("paramas ", params);
                res.render("dashboard/monthly-order-report", params);
            })
                .catch((err) => {
                next(err);
            });
        }
        else {
            res.render("dashboard/monthly-order-report", params);
        }
    }
    getMonthlyOrderReportDetail(req, res, next) {
        console.log("req.params ", req.params);
        const data = { id: req.params.id, status: req.params.status };
        let total = 0;
        let order_items = [];
        console.log("data ", data);
        if (utils_1.Utils.isEmpty(data.id)) {
            return comfunc.sendForbidden(next);
        }
        let params = { title: config_json_1.default.appname, user: req.user.username, listUrl: "/monthly-order-report", params: data };
        console.log("params1 ", params);
        params = permission_1.Permission.getMenuParams(params, req, res);
        console.log("params2 ", params);
        RestApi.getDb("order")
            .leftJoin("customer", "order.customerid", "customer.id")
            .leftJoin("car_gate", "order.cargate", "car_gate.id")
            .where("order.id", data.id)
            .select("order.*", "customer.name", "car_gate.cargatename")
            .then((result) => {
            params.params = utils_1.Utils.mixin(data, result[0]);
            params.params.orderdate = utils_1.Utils.toDisplayDate(params.params.orderdate);
            params.params.netamount = utils_1.Utils.numberWithCommas(params.params.netamount);
            if (data.status == "delivered") {
                return RestApi.getDb("order_items as oi")
                    .select("oi.id as orderitemid", "oi.orderid", "oi.productid", "oi.price", "oi.orderqty", "oi.replyqty", "product.id", "product.productcode", "product.productname", "product.price", "product.itemcount")
                    .leftJoin("product", "oi.productid", "product.id")
                    .where("oi.orderid", data.id)
                    .whereNot("oi.replyqty", 0);
            }
            else {
                return RestApi.getDb("order_items as oi")
                    .select("oi.id as orderitemid", "oi.orderid", "oi.productid", "oi.price", "oi.orderqty", "oi.replyqty", "product.id", "product.productcode", "product.productname", "product.price", "product.itemcount")
                    .leftJoin("product", "oi.productid", "product.id")
                    .where("oi.orderid", data.id);
            }
        })
            .then((order_items_result) => {
            order_items = order_items_result;
            order_items.map((order_item) => {
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
            res.render("dashboard/monthly-order-report-detail", params);
        })
            .catch((err) => {
            console.log(`${err}`);
            next({ "error": err });
        });
    }
    getDailyOrderDetailReport(req, res, next) {
        let params = { title: config_json_1.default.appname, user: req.user.username, params: {} };
        params = permission_1.Permission.getMenuParams(params, req, res);
        if (typeof req.jwtToken == "function") {
            req.jwtToken(jwtCredentialId)
                .then((result) => {
                params.token = result;
                console.log("paramas ", params);
                res.render("dashboard/daily-order-detail-report", params);
            })
                .catch((err) => {
                next(err);
            });
        }
        else {
            res.render("dashboard/daily-order-detail-report", params);
        }
    }
    getOrderDetailExcelReport(req, res, next) {
        let params = { title: config_json_1.default.appname, user: req.user.username, params: {} };
        params = permission_1.Permission.getMenuParams(params, req, res);
        if (typeof req.jwtToken == "function") {
            req.jwtToken(jwtCredentialId)
                .then((result) => {
                params.token = result;
                console.log("paramas ", params);
                res.render("dashboard/order-detail-excel-report", params);
            })
                .catch((err) => {
                next(err);
            });
        }
        else {
            res.render("dashboard/order-detail-excel-report", params);
        }
    }
}
exports.default = new ReportRouter();
//# sourceMappingURL=report.js.map