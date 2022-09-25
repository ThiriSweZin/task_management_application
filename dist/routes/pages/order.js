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
const firebase_msg_1 = require("../../lib/firebase-msg");
const permission_1 = require("../../lib/permission");
const axios_1 = __importDefault(require("axios"));
const querystring_1 = __importDefault(require("querystring"));
const uuid_1 = __importDefault(require("uuid"));
const localStorage = __importStar(require("local-storage"));
const jwtCredentialId = config_json_1.default.jwt.defCredentialId;
class OrderRouter extends express_application_1.ExpressRouter {
    constructor() {
        super();
        this.route("/order-new").all(permission_1.Permission.onLoad).get(this.getNewList);
        this.route("/order-reply").all(permission_1.Permission.onLoad).get(this.getReplyList);
        this.route("/order-new/details/:id").all(permission_1.Permission.onLoad).get(this.getNewDetail);
        this.route("/order-reply/details/:id").all(permission_1.Permission.onLoad).get(this.getReplyDetail);
        this.route("/order-new/reply").all(permission_1.Permission.onLoad).post(this.postReply);
        this.route("/order-new-preview").all(permission_1.Permission.onLoad).get(this.getDetail);
    }
    onLoad(req, res, next) {
        if (req.isAuthenticated()) {
            next();
        }
        else {
            res.redirect(`/login?url=${req.url}`);
        }
    }
    getNewList(req, res, next) {
        let params = { title: config_json_1.default.appname, user: req.user.username };
        params = permission_1.Permission.getMenuParams(params, req, res);
        if (typeof req.jwtToken == "function") {
            req.jwtToken(jwtCredentialId)
                .then((result) => {
                params.token = result;
                res.render("dashboard/order-new", params);
            })
                .catch((err) => {
                next(err);
            });
        }
        else {
            res.render("dashboard/order-new", params);
        }
    }
    getReplyList(req, res, next) {
        let params = { title: config_json_1.default.appname, user: req.user.username };
        params = permission_1.Permission.getMenuParams(params, req, res);
        if (typeof req.jwtToken == "function") {
            req.jwtToken(jwtCredentialId)
                .then((result) => {
                params.token = result;
                res.render("dashboard/order-reply", params);
            })
                .catch((err) => {
                next(err);
            });
        }
        else {
            res.render("dashboard/order-reply", params);
        }
    }
    getNewDetail(req, res, next) {
        const data = { id: req.params.id };
        let total = 0;
        let order_items = [];
        if (utils_1.Utils.isEmpty(data.id)) {
            return comfunc.sendForbidden(next);
        }
        localStorage.set("ordernew_id", data.id);
        console.log("ordernew_id in getnewdetail ", data.id);
        const postUrl = `/order-new/details/${data.id}`;
        console.log("postUrl ", postUrl);
        let params = { title: config_json_1.default.appname, postUrl: postUrl, listUrl: "/order-new", params: data };
        params = permission_1.Permission.getMenuParams(params, req, res);
        console.log("params ", params);
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
                order_item.qty = order_item.orderqty;
                total = order_item.price * order_item.orderqty;
                order_item.total = utils_1.Utils.numberWithCommas(total);
                order_item.price = utils_1.Utils.numberWithCommas(order_item.price);
                // } else {
                //   order_item.qty = order_item.replyqty;
                //   total = order_item.price * order_item.replyqty;
                //   order_item.total = Utils.numberWithCommas(total);
                //   order_item.price = Utils.numberWithCommas(order_item.price);
                // }
            });
            params.params.details = order_items;
            console.log("params.params in getnewdetail ", params.params);
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
            res.render("dashboard/order-new-details", params);
        })
            .catch((err) => {
            console.log(`${err}`);
            next({ "error": err });
        });
    }
    getReplyDetail(req, res, next) {
        const data = { id: req.params.id };
        let total = 0;
        let order_items = [];
        if (utils_1.Utils.isEmpty(data.id)) {
            return comfunc.sendForbidden(next);
        }
        localStorage.set("orderreply_id", data.id);
        const postUrl = `/order-reply/details/${data.id}`;
        let params = { title: config_json_1.default.appname, postUrl: postUrl, listUrl: "/order-reply", params: data };
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
                //   order_item.price = Utils.numberWithCommas(order_item.price);
                // } else {
                order_item.qty = order_item.replyqty;
                total = order_item.price * order_item.replyqty;
                order_item.total = utils_1.Utils.numberWithCommas(total);
                order_item.price = utils_1.Utils.numberWithCommas(order_item.price);
                // }
            });
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
            res.render("dashboard/order-reply-details", params);
        })
            .catch((err) => {
            console.log(`${err}`);
            next({ "error": err });
        });
    }
    postReply(req, res, next) {
        console.log("call postreply");
        let updatedObj = {}, totalQty = 0, orderCode, notimessage, notilogData = {};
        const notilogDataId = uuid_1.default.v4();
        const noti = new firebase_msg_1.Notification();
        const user = req.user;
        const userid = user.id;
        const data = req.body;
        console.log("data ", data);
        const items = data.items;
        delete data.items;
        const current = utils_1.Utils.toSqlDateTime(new Date());
        console.log("items ", items);
        items.forEach((item) => {
            totalQty += parseInt(item.replyqty);
        });
        if (totalQty == 0) {
            updatedObj = { "userid": userid, "totalqty": totalQty, "netamount": data.netamount, "status": "rejected", "date": current, "updateddate": utils_1.Utils.toSqlDate(new Date()) };
        }
        else {
            updatedObj = { "userid": userid, "totalqty": totalQty, "netamount": data.netamount, "status": "reply", "date": current, "reply_remark": data.reply_remark, "updateddate": utils_1.Utils.toSqlDate(new Date()) };
        }
        items.forEach((item) => {
            RestApi.getDb("order_items")
                .update({ "replyqty": item.replyqty, "updateddate": utils_1.Utils.toSqlDate(new Date()) }, "id")
                .where({ id: item.orderitemid })
                .then((result) => {
                console.log("update order items result", result);
            })
                .then((totalqty_result) => {
                console.log("update order items totalqty_result", totalqty_result);
            })
                .catch((err) => {
                console.log("update order items failed");
            });
        });
        RestApi.getDb("order")
            .update(updatedObj, "id")
            .where({ id: data.orderid })
            .then((result_queries) => {
            return RestApi.getDb("order_noti").select().where({ status: "Reply" });
        })
            .then((result_order_noti) => {
            console.log("order noti ", result_order_noti);
            notimessage = result_order_noti.length > 0 ? result_order_noti[0].notiformat : "";
            return RestApi.getDb("order").select("ordercode").where({ id: data.orderid });
        })
            .then((result_ordercode) => {
            orderCode = result_ordercode[0].ordercode;
            notimessage = notimessage.replace("OrderNo", "Order No." + orderCode);
            return RestApi.getDb("customer_values").select().where({ customerid: data.customerid });
        })
            .then((result) => {
            console.log("customer values ", result);
            if (result && result.length > 0) {
                const token = result[0].firebase_token;
                if (token && token != "") {
                    return noti.sendToDevice({
                        token: token,
                        title: "J Mahar",
                        message: notimessage,
                        click_action: "FLUTTER_NOTIFICATION_CLICK",
                        type: "order-reply",
                        orderid: `${data.orderid}`,
                        notilogid: notilogDataId
                    });
                }
            }
            else {
                console.log("No Customer Values");
                return undefined;
            }
        })
            .then((result) => {
            notilogData.id = notilogDataId;
            notilogData.customerid = data.customerid;
            notilogData.orderid = data.orderid;
            notilogData.date = utils_1.Utils.toSqlDateTime(new Date());
            notilogData.type = "order-reply";
            notilogData.notimessage = notimessage;
            notilogData.createddate = utils_1.Utils.toSqlDate(new Date());
            notilogData.updateddate = utils_1.Utils.toSqlDate(new Date());
            return RestApi.getDb("ordernoti_log").insert(notilogData, "id");
        })
            .then((result) => {
            return RestApi.getDb("customer").select('mobile').where({ id: data.customerid });
        })
            .then((result) => {
            console.log("result >>", result);
            let mobile = result[0].mobile;
            console.log("mobile >>", mobile);
            console.log("charAt ", mobile.charAt(0));
            if (mobile.charAt(0) === '0') {
                mobile = mobile.slice(1);
            }
            console.log("mobile ", mobile);
            // for sms
            const smsMessage = `Dear customer, your OrderNo.${orderCode} has been replied. Thank you for shopping with us.`;
            const smsData = {
                MobileNo: mobile,
                APIKey: '44DBFLpdls1r6WaMiQYra3wAI4hon28Eu4ZWCrOvU+Y=',
                SchduleDate: '',
                EmailId: 'info@newwave-tech.com',
                SMSType: 'T',
                SenderCode: 'J-Mahar',
                Message: smsMessage
            };
            console.log("smsData ", smsData);
            const config = {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            };
            axios_1.default.post('https://digitxt.yellowstone.com.mm/Services/SMSSerivce.asmx/SendBulkSMS', querystring_1.default.stringify(smsData), config)
                .then((res) => {
                console.log(`Status: ${res.status}`);
                console.log('Body: ', res.data);
            }).catch((err) => {
                console.log(err);
            });
            res.json({ "order_reply": "success" });
        })
            .catch((err) => {
            console.log("error", `${err}`);
            res.json({ "order_reply": { "error": err } });
        });
    }
    getDetail(req, res, next) {
        const data = { id: req.params.id || localStorage.get("ordernew_id") };
        console.log("ordernew_id ", data.id);
        let total = 0;
        let order_items = [];
        if (utils_1.Utils.isEmpty(data.id)) {
            return comfunc.sendForbidden(next);
        }
        const postUrl = `/order-new-preview/${data.id}`;
        console.log("postUrl ", postUrl);
        let params = { title: config_json_1.default.appname, postUrl: postUrl, listUrl: "/order-new", params: data };
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
            console.log("params in getdetail 1", params.params);
            return RestApi.getDb("order_items as oi")
                .select("oi.id as orderitemid", "oi.orderid", "oi.productid", "oi.price", "oi.orderqty", "oi.replyqty", "product.id", "product.productcode", "product.productname", "product.price", "product.itemcount")
                .leftJoin("product", "oi.productid", "product.id")
                .where("oi.orderid", data.id);
        })
            .then((order_items_result) => {
            order_items = order_items_result;
            order_items.forEach((order_item) => {
                order_item.qty = order_item.orderqty;
                total = order_item.price * order_item.orderqty;
                order_item.total = utils_1.Utils.numberWithCommas(total);
                order_item.price = utils_1.Utils.numberWithCommas(order_item.price);
            });
            params.params.details = order_items;
            console.log("params.params.details", params.params.details);
            console.log("params in getdetail 2", params.params);
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
            res.render("dashboard/order-new-preview", params);
        })
            .catch((err) => {
            console.log(`${err}`);
            next({ "error": err });
        });
    }
}
exports.default = new OrderRouter();
//# sourceMappingURL=order.js.map