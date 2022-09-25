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
const firebase_msg_1 = require("../../lib/firebase-msg");
const permission_1 = require("../../lib/permission");
// import axios from 'axios';
// import qs from 'querystring';
const jwtCredentialId = config_json_1.default.jwt.defCredentialId;
class OrderDeliveryRouter extends express_application_1.ExpressRouter {
    constructor() {
        super();
        this.route("/order-delivery").all(permission_1.Permission.onLoad).get(this.getList);
        this.route("/order-delivery/entry").all(permission_1.Permission.onLoad).get(this.getEntry).post(this.postEntry);
        this.route("/order-delivery/detail/:id").all(permission_1.Permission.onLoad).get(this.getDeliveryDetail);
        this.route("/order-delivery/detail/item-detail/:id/:deliveryid").all(permission_1.Permission.onLoad).get(this.getDeliveryItemDetail);
        this.route("/delivery-list").all(permission_1.Permission.onLoad).get(this.getDelList);
        this.route("/delivery-list/detail/:id").all(permission_1.Permission.onLoad).get(this.getDelListDetail);
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
        // let params: any = { title: config.appname, user: req.user.username, postUrl: "/order-delivery", params: {} };
        let params = { title: config_json_1.default.appname, user: req.user.username };
        params = permission_1.Permission.getMenuParams(params, req, res);
        if (typeof req.jwtToken == "function") {
            req.jwtToken(jwtCredentialId)
                .then((result) => {
                params.token = result;
                res.render("dashboard/order-delivery", params);
            })
                .catch((err) => {
                next(err);
            });
        }
        else {
            res.render("dashboard/order-delivery", params);
        }
    }
    getEntry(req, res, next) {
        let params = { title: config_json_1.default.appname, user: req.user.username, postUrl: "/order-delivery/entry", params: {}, listUrl: "/order-delivery" };
        params = permission_1.Permission.getMenuParams(params, req, res);
        RestApi.getDb("order_delivery")
            .select()
            .then((result) => {
            params.orders_array = [];
            console.log("params ", params);
            if (typeof req.jwtToken == "function") {
                return req.jwtToken(jwtCredentialId);
            }
            else {
                res.render("dashboard/order-delivery-entry", params);
            }
        })
            .then((result) => {
            params.token = result;
            res.render("dashboard/order-delivery-entry", params);
        })
            .catch((err) => {
            next(err);
        });
    }
    postEntry(req, res, next) {
        let notilogData = {}, notimessage, orderCodes, orderCode = [], orders_result = [];
        let carGate, count = 0;
        const prefix = "DEL", notilogDataId = uuid.v4();
        const noti = new firebase_msg_1.Notification();
        const datecode = utils_1.Utils.toDateCode(new Date());
        const data = comfunc.fillDefaultFields(req.body);
        data.id = uuid.v4();
        data.date = utils_1.Utils.toSqlDateTime(new Date());
        data.userid = req.user.id;
        data.deliverycode = "";
        delete data.list_length;
        delete data.select_all;
        let parcelQty = "(" + data.parcelqty + ")";
        const orders_arr = JSON.parse(data.orders_array);
        // orders_arr.forEach((item: any) => {
        //   if (data.take_way === 'self') {
        //     RestApi.getDb("order")
        //     .update({ "status": "delivered", "date": Utils.toSqlDateTime(new Date()) }, "id")
        //     .where({ id: item })
        //     .then((result) => {
        //       console.log("update order delivered ", result);
        //     })
        //     .catch((err) => {
        //       console.log("update order items failed");
        //     });
        //   } else {
        //     RestApi.getDb("order")
        //     .update({ "status": "delivered", "cargate": data.cargateid, "date": Utils.toSqlDateTime(new Date()) }, "id")
        //     .where({ id: item })
        //     .then((result) => {
        //       console.log("update order delivered ", result);
        //     })
        //     .catch((err) => {
        //       console.log("update order items failed");
        //     });
        //   }
        // });
        // order codes for noti message
        orders_arr.forEach((item) => {
            RestApi.getDb("order")
                .select("ordercode")
                .where({ id: item })
                .then((result) => {
                orderCode.push(' ' + result[0].ordercode);
                orderCodes = orderCode.toString();
                console.log("select ordercode success");
            })
                .catch((err) => {
                console.log("select ordercode fail");
            });
        });
        orders_arr.forEach((order) => {
            let order_items = {};
            order_items.id = uuid.v4();
            order_items.orderdeliveryid = data.id;
            console.log("order id", order);
            order_items.orderid = order;
            order_items.createddate = utils_1.Utils.toSqlDate(new Date());
            order_items.updateddate = utils_1.Utils.toSqlDate(new Date());
            orders_result.push(order_items);
        });
        delete data.orders_array;
        // console.log("orders_result ", orders_result);
        RestApi.getDb("autogenerate").select("*").where("prefix", prefix)
            .then((autogen) => {
            if (autogen[0].datecode == datecode) {
                count = autogen[0].count + 1;
            }
            else {
                count++;
                autogen[0].datecode = datecode;
            }
            autogen[0].count = count;
            autogen[0].updateddate = utils_1.Utils.toSqlDate(new Date());
            const autogenId = autogen[0].id;
            delete (autogen[0].id);
            let deliverycount;
            if (count < 10) {
                deliverycount = "000" + count;
            }
            else if (count > 9 && count < 100) {
                deliverycount = "00" + count;
            }
            else if (count > 99 && count < 1000) {
                deliverycount = "0" + count;
            }
            const deliverycode = prefix + deliverycount + datecode;
            data.deliverycode = deliverycode;
            return RestApi.getDb("autogenerate").where("id", autogenId).update(autogen[0], "id");
        })
            .then((result) => {
            if (data.take_way === 'self') {
                delete (data.cargateid);
            }
            console.log("order delivery data >> ", data);
            return RestApi.getDb("order_delivery").insert(data, "id");
        })
            .then((result) => {
            return RestApi.getKnex().batchInsert("orderdelivery_items", orders_result);
        })
            .then((items_result) => {
            if (data.take_way === 'bus') {
                return RestApi.getDb("car_gate")
                    .select("cargatename")
                    .leftJoin("order_delivery", "order_delivery.cargateid", "car_gate.id")
                    .where({ "order_delivery.cargateid": data.cargateid })
                    .first();
            }
        })
            .then((cargate_result) => {
            if (data.take_way === 'self') {
                return RestApi.getDb("order_noti").select().where({ status: "Delivery-Self" });
            }
            else {
                carGate = cargate_result.cargatename;
                console.log("carGate ", carGate);
                return RestApi.getDb("order_noti").select().where({ status: "Delivery-Bus" });
            }
        })
            .then((result_order_noti) => {
            console.log("order noti ", result_order_noti);
            notimessage = result_order_noti.length > 0 ? result_order_noti[0].notiformat.toString() : "";
            notimessage = notimessage.replace("OrderNo", "Order No." + orderCodes);
            notimessage = notimessage.replace("Cargate", carGate);
            notimessage = notimessage.replace("Quantity", parcelQty);
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
                        type: "order-delivered",
                        notilotid: notilogDataId
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
            notilogData.date = utils_1.Utils.toSqlDateTime(new Date());
            notilogData.type = "order-delivered";
            notilogData.notimessage = notimessage;
            notilogData.createddate = utils_1.Utils.toSqlDate(new Date());
            notilogData.updateddate = utils_1.Utils.toSqlDate(new Date());
            return RestApi.getDb("ordernoti_log").insert(notilogData, "id");
        })
            .then((result) => {
            const notilogData = result;
            orders_arr.forEach((item) => {
                if (data.take_way === 'self') {
                    RestApi.getDb("order")
                        .update({ "status": "delivered", "date": utils_1.Utils.toSqlDateTime(new Date()), "delnoti_remark": notimessage }, "id")
                        .where({ id: item })
                        .then((result) => {
                        console.log("update order delivered ", result);
                    })
                        .catch((err) => {
                        console.log("update order items failed");
                    });
                }
                else {
                    RestApi.getDb("order")
                        .update({ "status": "delivered", "cargate": data.cargateid, "date": utils_1.Utils.toSqlDateTime(new Date()), "delnoti_remark": notimessage }, "id")
                        .where({ id: item })
                        .then((result) => {
                        console.log("update order delivered ", result);
                    })
                        .catch((err) => {
                        console.log("update order items failed");
                    });
                }
            });
            return notilogData;
        })
            // .then((result) => {
            //   return RestApi.getDb("customer").select('mobile').where({ id: data.customerid })
            // })
            // .then((result) => {
            //   let mobile = result[0].mobile;
            //   console.log("mobile >>", mobile);
            //   if(mobile.charAt(0) === '0'){
            //     mobile = mobile.slice(1);
            //   }
            //   console.log("mobile ", mobile);
            //   const smsData = { 
            //     MobileNo: mobile,
            //     APIKey: '44DBFLpdls1r6WaMiQYra3wAI4hon28Eu4ZWCrOvU+Y=',
            //     SchduleDate: '',
            //     EmailId: 'info@newwave-tech.com',
            //     SMSType: 'T',
            //     SenderCode: 'J-Mahar',
            //     Message: notimessage
            //   };
            //   console.log("smsData ", smsData);
            //   const config = {
            //     headers: {
            //         'Content-Type': 'application/x-www-form-urlencoded'
            //     }
            //   };
            //   axios.post('https://digitxt.yellowstone.com.mm/Services/SMSSerivce.asmx/SendBulkSMS', qs.stringify(smsData), config)
            //   .then((res) => {
            //       console.log(`Status: ${res.status}`);
            //       console.log('Body: ', res.data);
            //   }).catch((err) => {
            //       console.log(err);
            //   });
            //   res.json({ "success": result });
            // })
            .then((result) => {
            console.log("result ", result);
            res.json({ "success": result });
        })
            .catch((err) => {
            console.log(`${err}`);
            res.json({ "error": err });
        });
    }
    getDeliveryDetail(req, res, next) {
        const data = { id: req.params.id };
        if (utils_1.Utils.isEmpty(data.id)) {
            return comfunc.sendForbidden(next);
        }
        let params = { title: config_json_1.default.appname, user: req.user.username, listUrl: "/order-delivery", params: data };
        params = permission_1.Permission.getMenuParams(params, req, res);
        RestApi.getDb("order_delivery")
            .select("order_delivery.*", "customer.name", "car_gate.cargatename")
            .leftJoin("customer", "order_delivery.customerid", "customer.id")
            .leftJoin("car_gate", "order_delivery.cargateid", "car_gate.id")
            .where("order_delivery.id", data.id)
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
            res.render("dashboard/order-delivery-detail", params);
            console.log("result >>", params);
        })
            .catch((err) => {
            console.log(`${err}`);
            next({ "error": err });
        });
    }
    getDeliveryItemDetail(req, res, next) {
        const data = { id: req.params.id, deliveryid: req.params.deliveryid };
        let total = 0;
        let order_items = [];
        console.log("data ", data);
        if (utils_1.Utils.isEmpty(data.id)) {
            return comfunc.sendForbidden(next);
        }
        let params = { title: config_json_1.default.appname, user: req.user.username, listUrl: "/order-delivery/detail/" + data.deliveryid, params: data };
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
            return RestApi.getDb("order_items as oi")
                .select("oi.id as orderitemid", "oi.orderid", "oi.productid", "oi.price", "oi.orderqty", "oi.replyqty", "product.id", "product.productcode", "product.productname", "product.price", "product.itemcount")
                .leftJoin("product", "oi.productid", "product.id")
                .where("oi.orderid", data.id);
        })
            .then((order_items_result) => {
            order_items = order_items_result;
            order_items.forEach((order_item) => {
                order_item.qty = order_item.replyqty;
                total = order_item.price * order_item.replyqty;
                order_item.total = utils_1.Utils.numberWithCommas(total);
                order_item.price = utils_1.Utils.numberWithCommas(order_item.price);
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
            res.render("dashboard/order-delivery-item-detail", params);
        })
            .catch((err) => {
            console.log(`${err}`);
            next({ "error": err });
        });
    }
    getDelList(req, res, next) {
        let params = { title: config_json_1.default.appname, user: req.user.username, postUrl: "/delivery-list", params: {} };
        params = permission_1.Permission.getMenuParams(params, req, res);
        if (typeof req.jwtToken == "function") {
            req.jwtToken(jwtCredentialId)
                .then((result) => {
                params.token = result;
                res.render("dashboard/delivery-list", params);
            })
                .catch((err) => {
                next(err);
            });
        }
        else {
            res.render("dashboard/delivery-list", params);
        }
    }
    getDelListDetail(req, res, next) {
        const data = { id: req.params.id };
        let total = 0;
        let order_items = [];
        if (utils_1.Utils.isEmpty(data.id)) {
            return comfunc.sendForbidden(next);
        }
        const postUrl = `/delivery-list/details/${data.id}`;
        let params = { title: config_json_1.default.appname, postUrl: postUrl, listUrl: "/delivery-list", params: data };
        params = permission_1.Permission.getMenuParams(params, req, res);
        RestApi.getDb("order")
            .leftJoin("customer", "order.customerid", "customer.id")
            .leftJoin("car_gate", "order.cargate", "car_gate.id")
            .where("order.id", data.id)
            .select("order.*", "customer.name", "car_gate.cargatename")
            .then((result) => {
            params.params = utils_1.Utils.mixin(data, result[0]);
            params.params.netamount = utils_1.Utils.numberWithCommas(params.params.netamount);
            return RestApi.getDb("order_items as oi")
                .select("oi.id as orderitemid", "oi.orderid", "oi.productid", "oi.price", "oi.orderqty", "oi.replyqty", "product.id", "product.productcode", "product.productname", "product.price", "product.itemcount")
                .leftJoin("product", "oi.productid", "product.id")
                .where("oi.orderid", data.id);
        })
            .then((order_items_result) => {
            order_items = order_items_result;
            order_items.forEach((order_item) => {
                order_item.qty = order_item.replyqty;
                total = order_item.price * order_item.replyqty;
                order_item.total = utils_1.Utils.numberWithCommas(total);
                order_item.price = utils_1.Utils.numberWithCommas(order_item.price);
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
            res.render("dashboard/delivery-list-details", params);
        })
            .catch((err) => {
            console.log(`${err}`);
            next({ "error": err });
        });
    }
}
exports.default = new OrderDeliveryRouter();
//# sourceMappingURL=order-delivery.js.map