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
/**
 * Order
 */
const RestApi = __importStar(require("../lib/restapi"));
const uuid = __importStar(require("uuid"));
const utils_1 = require("../lib/utils");
const firebase_msg_1 = require("../lib/firebase-msg");
const moment_1 = __importDefault(require("moment"));
class OrderView {
    constructor() { }
    orderConfirm(args, cb) {
        let order_items = [], order_data = [], queries = [];
        let order = {}, notimessage, notilogData = {};
        const notilogDataId = uuid.v4();
        const orderid = uuid.v4();
        const prefix = "ORD";
        let count = 0;
        const noti = new firebase_msg_1.Notification();
        const datecode = utils_1.Utils.toDateCode(new Date()); // format - 22042020
        order = args.order;
        order.id = orderid;
        order.date = utils_1.Utils.toSqlDateTime(new Date());
        order.ordercode = "";
        order.status = "new";
        order.createddate = utils_1.Utils.toSqlDate(new Date());
        order.updateddate = utils_1.Utils.toSqlDate(new Date());
        order_items = args.order_items;
        if (order_items && order_items.length > 0) {
            order_items.forEach((order_item) => {
                const item = {};
                item["id"] = uuid.v4();
                item["orderid"] = order.id;
                item["productid"] = order_item.productid;
                item["price"] = order_item.price;
                item["orderqty"] = order_item.orderqty;
                item["createddate"] = utils_1.Utils.toSqlDate(new Date());
                item["updateddate"] = utils_1.Utils.toSqlDate(new Date());
                order_data.push(item);
            });
        }
        else {
            cb(undefined, {
                error: {
                    message: "No cart."
                }
            });
        }
        console.log(" order data >> ", order_data + ", order", [...order_data]);
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
            let ordercount;
            if (count < 10) {
                ordercount = "00" + count;
            }
            else if (count > 9 && count < 100) {
                ordercount = "0" + count;
            }
            // } else if (count > 99 && count < 1000) {
            //   ordercount = "0" + count;
            // }
            const ordercode = prefix + ordercount + datecode;
            order.ordercode = ordercode;
            queries.push(RestApi.getKnex().batchInsert("order_items", order_data));
            queries.push(RestApi.getDb("order").insert(order, "id"));
            queries.push(RestApi.getDb("autogenerate").where("id", autogenId).update(autogen[0], "id"));
        })
            .then((result) => {
            return RestApi.getKnex().transaction(function (trx) {
                Promise.all(queries)
                    .then(trx.commit)
                    .catch(trx.rollback);
            });
        })
            .then((result_queries) => {
            return RestApi.getDb("order_noti").select().where({ status: "New" });
        })
            .then((result_order_noti) => {
            console.log("order noti ", result_order_noti);
            notimessage = result_order_noti.length > 0 ? result_order_noti[0].notiformat : "";
            notimessage = notimessage.replace("OrderNo", "Order No." + order.ordercode);
            return RestApi.getDb("customer_values").select().where({ customerid: order.customerid });
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
                        type: "order-new",
                        orderid: orderid,
                        notilogid: notilogDataId
                    });
                }
            }
            else {
                console.log("else ok");
                return undefined;
            }
        })
            .then((result) => {
            notilogData.id = notilogDataId;
            notilogData.customerid = order.customerid;
            notilogData.orderid = orderid;
            notilogData.date = utils_1.Utils.toSqlDateTime(new Date());
            notilogData.type = "order-new";
            notilogData.notimessage = notimessage;
            notilogData.createddate = utils_1.Utils.toSqlDate(new Date());
            notilogData.updateddate = utils_1.Utils.toSqlDate(new Date());
            return RestApi.getDb("ordernoti_log").insert(notilogData, "id");
        })
            .then((result) => {
            cb(undefined, {
                success: {
                    message: "Order Succeed. ",
                    id: order.id
                }
            });
        })
            .catch((err) => {
            cb(undefined, err);
        });
    }
    acceptOrder(args, cb) {
        let notilogData = {}, notimessage;
        let orderid = args.orderid;
        let customerid = args.customerid;
        const notilogDataId = uuid.v4();
        const noti = new firebase_msg_1.Notification();
        const current = utils_1.Utils.toSqlDateTime(new Date());
        RestApi.getDb("order")
            .update({ "status": "accepted", "date": current, "updateddate": current }, "id")
            .where({ id: orderid })
            .then((result) => {
            return RestApi.getDb("order_noti").select().where({ status: "Accept" });
        })
            .then((result_order_noti) => {
            console.log("order noti ", result_order_noti);
            notimessage = result_order_noti.length > 0 ? result_order_noti[0].notiformat : "";
            return RestApi.getDb("order").select("ordercode").where({ id: orderid });
        })
            .then((result_ordercode) => {
            notimessage = notimessage.replace("OrderNo", "Order No." + result_ordercode[0].ordercode);
            return RestApi.getDb("customer_values").select().where({ customerid: customerid });
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
                        type: "order-accepted",
                        orderid: orderid,
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
            notilogData.customerid = customerid;
            notilogData.orderid = orderid;
            notilogData.date = utils_1.Utils.toSqlDateTime(new Date());
            notilogData.type = "order-accepted";
            notilogData.notimessage = notimessage;
            notilogData.createddate = utils_1.Utils.toSqlDate(new Date());
            notilogData.updateddate = utils_1.Utils.toSqlDate(new Date());
            return RestApi.getDb("ordernoti_log").insert(notilogData, "id");
        })
            .then((result) => {
            console.log("result ", result);
            cb(undefined, {
                success: {
                    message: "Order accepted noti successful",
                }
            });
        })
            .catch((err) => {
            console.log("error", `${err}`);
            cb(undefined, err);
        });
    }
    rejectOrder(args, cb) {
        let notilogData = {}, notimessage;
        let orderid = args.orderid;
        let customerid = args.customerid;
        const notilogDataId = uuid.v4();
        const noti = new firebase_msg_1.Notification();
        const current = utils_1.Utils.toSqlDateTime(new Date());
        RestApi.getDb("order")
            .update({ "status": "rejected", "date": current, "updateddate": current }, "id")
            .where({ id: orderid })
            .then((result) => {
            return RestApi.getDb("order_noti").select().where({ status: "Reject" });
        })
            .then((result_order_noti) => {
            console.log("order noti ", result_order_noti);
            notimessage = result_order_noti.length > 0 ? result_order_noti[0].notiformat : "";
            return RestApi.getDb("order").select("ordercode").where({ id: orderid });
        })
            .then((result_ordercode) => {
            notimessage = notimessage.replace("OrderNo", "Order No." + result_ordercode[0].ordercode);
            return RestApi.getDb("customer_values").select().where({ customerid: customerid });
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
                        type: "order-rejected",
                        orderid: orderid,
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
            notilogData.customerid = customerid;
            notilogData.orderid = orderid;
            notilogData.date = utils_1.Utils.toSqlDateTime(new Date());
            notilogData.type = "order-rejected";
            notilogData.notimessage = notimessage;
            notilogData.createddate = utils_1.Utils.toSqlDate(new Date());
            notilogData.updateddate = utils_1.Utils.toSqlDate(new Date());
            return RestApi.getDb("ordernoti_log").insert(notilogData, "id");
        })
            .then((result) => {
            console.log("result ", result);
            cb(undefined, {
                success: {
                    message: "Order rejected noti successful",
                }
            });
        })
            .catch((err) => {
            console.log("error", `${err}`);
            cb(undefined, err);
        });
    }
    deliveryCustomer(args, cb) {
        let data = {};
        RestApi.getDb("customer")
            .select("customer.id", "customer.name")
            .leftJoin("order", "order.customerid", "customer.id")
            .where({ "order.status": "accepted", "order.take_way": args.take_way })
            .groupBy("customer.name", "customer.id")
            .then((result) => {
            data = result;
            cb(undefined, data);
            console.log("deliveryCustomer ", result);
        })
            .catch((err) => {
            console.log(`${err}`);
            cb(err, undefined);
        });
    }
    customerCargate(args, cb) {
        let data = {};
        let customerid = args.customerid;
        RestApi.getDb("car_gate")
            .select("car_gate.*")
            .leftJoin("customer", "customer.cityid", "car_gate.cityid")
            .where({ "customer.id": customerid })
            .then((result) => {
            data = result;
            cb(undefined, data);
            console.log("customerCargate ", result);
        })
            .catch((err) => {
            console.log(`${err}`);
            cb(err, undefined);
        });
    }
    customerAcceptedOrder(args, cb) {
        let query;
        let data = {};
        let customerid = args.customerid;
        let take_way = args.take_way;
        let cargate = args.cargate;
        console.log(" cargate length ", args.cargate.length);
        console.log(" cargate  ", args.cargate);
        if (customerid && cargate.length == 0)
            query = { take_way, customerid };
        if (customerid && cargate == 'null')
            query = { take_way, customerid };
        else
            query = { take_way, customerid, cargate };
        console.log("query => ", query);
        RestApi.getDb("order")
            .select("order.*")
            // .where({ "customerid": customerid, "status": "accepted", "take_way": take_way, "cargate": car_gate })
            .where(query)
            .orderBy("order.date", "desc")
            .then((result) => {
            result.forEach((res) => {
                res.netamount = utils_1.Utils.numberWithCommas(res.netamount);
            });
            cb(undefined, { data: result });
            console.log("customerAcceptedOrder ", result);
        })
            .catch((err) => {
            console.log(`${err}`);
            cb(err, undefined);
        });
    }
    deliveredOrders(args, cb) {
        let data = {};
        let customerid = args.customerid;
        let deliveryid = args.deliveryid;
        console.log("customerid", customerid);
        console.log("deliveryid", deliveryid);
        RestApi.getDb("order")
            .select("order.*", "orderdelivery_items.orderdeliveryid")
            .leftJoin("orderdelivery_items", "orderdelivery_items.orderid", "order.id")
            .where({ "order.customerid": customerid, "status": "delivered", "orderdelivery_items.orderdeliveryid": deliveryid })
            .then((result) => {
            result.forEach((res) => {
                res.netamount = utils_1.Utils.numberWithCommas(res.netamount);
            });
            cb(undefined, { data: result });
            console.log("deliveredOrders ", result);
        })
            .catch((err) => {
            console.log(`${err}`);
            cb(err, undefined);
        });
    }
    // mobile api for customer's orders history data
    customerOrders(args, cb) {
        console.log("args", args.status);
        const search = args.status;
        console.log("string ", [...search]);
        console.log("string length ", search.length);
        console.log(" 0 :", search[0]);
        console.log(" 1 :", search[1]);
        console.log(" 2 :", search[2]);
        console.log(" 3 :", search[3]);
        console.log(" 4 :", search[4]);
        console.log(" 5 :", search[5]);
        console.log(" 6 :", search[6]);
        console.log(" 7 :", search[7]);
        console.log(" 8 :", search[8]);
        console.log(" 9 :", search[9]);
        console.log(" 10 :", search[10]);
        console.log(" 11 :", search[11]);
        console.log(" 12 :", search[12]);
        let customerid = args.customerid;
        let status = args.status;
        let order_data = {
            order: {},
            order_items: {}
        };
        RestApi.getDb("order")
            .where({ "order.customerid": customerid, "order.status": status })
            .select("order.id", "order.ordercode", "order.date", "order.status", "order.totalqty", "order.netamount", "order.delnoti_remark", "order.reply_remark")
            .orderBy("order.date", "desc")
            .then((result_order) => {
            order_data.order = result_order;
            return RestApi.getDb("order")
                .leftJoin("order_items", "order.id", "order_items.orderid")
                .leftJoin("product", "order_items.productid", "product.id")
                .where({ "order.customerid": customerid, "order.status": status })
                .select("order.id", "order_items.price", "order_items.orderqty", "order_items.replyqty", "product.imageurl1", "product.productname");
        })
            .then((result_order_items) => {
            order_data.order_items = result_order_items;
            cb(undefined, order_data);
        })
            .catch((err) => {
            cb(undefined, err);
        });
    }
    customerOrders_test(args, cb) {
        let customerid = args.customerid;
        let status = args.status;
        let orders = [];
        let order = {};
        RestApi.getDb("order")
            .where({ "order.customerid": customerid, "order.status": status })
            .leftJoin("car_gate", "order.cargate", "car_gate.id")
            .select("order.id", "order.ordercode", "order.date", "order.status", "order.totalqty", "order.netamount", "order.delnoti_remark", "order.reply_remark")
            .orderBy("order.date", "desc")
            .then((result_orders) => {
            orders = result_orders;
            return RestApi.getDb("order_items")
                .leftJoin("order", "order.id", "order_items.orderid")
                .leftJoin("product", "order_items.productid", "product.id")
                .where({ "order.customerid": customerid, "order.status": status })
                .select("order_items.orderid", "order_items.price", "order_items.orderqty", "order_items.replyqty", "product.imageurl1", "product.productname");
        })
            .then((order_items) => {
            orders.map((order) => {
                let items = order_items.filter((item) => {
                    return order.id === item.orderid;
                });
                order.items = items;
            });
            cb(undefined, {
                result: "success",
                data: orders
            });
        })
            .catch((err) => {
            cb(undefined, err);
        });
    }
    getMonthlyReport(args, cb) {
        const params = {
            data: []
        };
        const startDate = utils_1.Utils.toSqlDateDDMMYYYY(args.startdate);
        const endDate = utils_1.Utils.toSqlDateDDMMYYYY(args.enddate);
        let dbQuery = RestApi.getDb("order")
            .select("id", "ordercode", "date", "status", "totalqty", "netamount");
        if (args.customerid && args.customerid != "") {
            dbQuery = dbQuery.where({ "customerid": args.customerid });
        }
        if (args.status != "all") {
            dbQuery = dbQuery.where({ "status": args.status });
        }
        dbQuery = dbQuery.whereBetween("date", [startDate, endDate]);
        dbQuery.orderBy("date", "asc")
            .then((result) => {
            console.log("monthly data >> ", result);
            params.data = result;
            cb(undefined, params);
        })
            .catch((err) => {
            cb(undefined, err);
        });
    }
    getDailyOrderDetailReport(args, cb) {
        const params = {
            data: []
        };
        const startDate = utils_1.Utils.toSqlDate(args.startdate);
        const endDate = utils_1.Utils.toSqlDate(args.enddate);
        let orders = [];
        const orderid = [];
        console.log("start date ", startDate);
        console.log("end date ", endDate);
        // const date = Utils.toSqlDate(args.date);
        // console.log("date ", date);
        RestApi.getDb("order")
            .select("order.id", "order.ordercode", "order.date", "order.netamount", "order.status")
            .whereBetween("order.date", [startDate, endDate])
            .orderBy("date", "asc")
            .then((result_order) => {
            orders = result_order;
            console.log("orders ", orders);
            orders.forEach((order) => {
                // order.orderdate = Utils.toDisplayDateTime(order.orderdate);
                orderid.push(order.id);
                console.log("order", order);
            });
            console.log("orderid ", orderid);
            return RestApi.getDb("order_items as oi")
                .select("oi.id", "oi.orderid", "oi.productid", "oi.orderqty", "oi.replyqty", "product.productname", "product.price")
                .leftJoin("product", "oi.productid", "product.id")
                .whereIn("oi.orderid", orderid);
        })
            .then((result_items) => {
            console.log("items ", result_items);
            orders.map((order) => {
                const item = result_items.filter((result) => {
                    return result.orderid == order.id && (!(result.replyqty == 0 && order.status == "delivered"));
                });
                order.items = item;
            });
            console.log("orders final ", orders);
            cb(undefined, {
                data: orders
            });
        })
            .catch((err) => {
            cb(undefined, {
                error: {
                    message: err.message || "Order List Error."
                }
            });
        });
    }
    getOrderDetailExcelReport(args, cb) {
        const startDate = utils_1.Utils.toSqlDate(args.startdate);
        const endDate = utils_1.Utils.toSqlDate(args.enddate);
        let orders = [];
        const orderID = [];
        RestApi.getDb("order")
            .select("order.id", "order.ordercode", "order.date", "order.netamount", "order.status")
            .whereBetween("order.date", [startDate, endDate])
            .orderBy("date", "asc")
            .then((result => {
            orders = result;
            orders.forEach((order) => {
                orderID.push(order.id);
            });
            console.log("orderId ", orderID);
            return RestApi.getDb("order_items")
                .leftJoin("product", "order_items.productid", "product.id")
                .whereIn("orderid", orderID)
                .select("order_items.orderid", "product.productcode", "product.productname", "product.price", "order_items.replyqty");
        }))
            .then((result_items) => {
            console.log("items ", result_items);
            orders.map((order) => {
                order.items = "";
                result_items.forEach((result) => {
                    if (order.id == result.orderid && (!(result.replyqty == 0 && order.status == "delivered"))) {
                        console.log("order id ", order.id);
                        const item = "[" + result.productcode + "," + result.productname + "," + result.replyqty + "," + result.price + "]";
                        // order.items.concat(result);
                        // delete result.orderid;
                        // order.items = order.items + JSON.stringify(result);
                        order.items = order.items + item;
                    }
                });
            });
            console.log("orders ", orders);
            cb(undefined, {
                data: orders
            });
        })
            .catch((err) => {
            cb(undefined, {
                error: {
                    message: err.message || "Order List Error."
                }
            });
        });
    }
    // for mobile >> noti's order details
    getOrderDetails(args, cb) {
        const orderid = args.orderid;
        let order_data = {
            order: {},
            order_items: {}
        };
        RestApi.getDb("order")
            .where({ "order.id": orderid })
            .leftJoin("car_gate", "order.cargate", "car_gate.id")
            .select("order.id", "order.ordercode", "order.date", "order.status", "order.totalqty", "order.netamount", "order.reply_remark")
            .first()
            .then((result_order) => {
            order_data.order = result_order;
            return RestApi.getDb("order_items")
                .leftJoin("order", "order.id", "order_items.orderid")
                .leftJoin("product", "order_items.productid", "product.id")
                .where({ "order_items.orderid": orderid })
                .select("order.id", "order_items.price", "order_items.orderqty", "order_items.replyqty", "product.imageurl1", "product.productname");
        })
            .then((result_order_items) => {
            order_data.order_items = result_order_items;
            cb(undefined, order_data);
        })
            .catch((err) => {
            cb(undefined, err);
        });
    }
    /**
     * Get Order Noti Log from mobile
     */
    getOrderNotiLogs(args, cb) {
        const customerid = args.customerid;
        RestApi.getDb("ordernoti_log").select("id", "orderid", "date", "notimessage").where({ customerid }).orderBy("date", "desc")
            .then((result) => {
            console.log("Order Noti Logs ", result);
            cb(undefined, {
                message: "Success",
                data: result
            });
        })
            .catch((error) => {
            console.log("Order Noti Logs ", error);
            cb(error, {
                message: "Failed",
                data: null
            });
        });
    }
    /**
     * Get Order List by filter from front-end
     */
    getOrderList(args, cb) {
        let query;
        const fromnoformat = moment_1.default(new Date()).subtract(300, "days").toDate();
        const fromdate = moment_1.default(fromnoformat).format("YYYY-MM-DD");
        const todate = moment_1.default(new Date()).format("YYYY-MM-DD");
        let startDate = utils_1.Utils.toSqlDate(args.startdate);
        let endDate = utils_1.Utils.toSqlDate(args.enddate);
        if (!startDate && !endDate) {
            startDate = fromdate;
            endDate = todate;
        }
        const customerid = args.customerid;
        const ordercode = args.ordercode;
        const status = args.status;
        console.log("startdate", startDate);
        console.log("enddate", endDate);
        query = { status };
        if (customerid)
            query = { status, customerid };
        if (ordercode)
            query = { status, ordercode };
        if (customerid && ordercode)
            query = { status, customerid, ordercode };
        if (!customerid && !ordercode)
            query = { status };
        console.log("status", query);
        RestApi.getDb("order")
            .select("order.*", "customer.name")
            .leftJoin("customer", "order.customerid", "customer.id")
            // .leftJoin("user", "order.userid", "user.id")
            .where(query)
            .whereBetween("order.updateddate", [startDate, endDate])
            .orderBy("order.date", "desc")
            .then((result) => {
            console.log("result orderview ", result);
            cb(undefined, {
                message: "Success",
                data: result
            });
        })
            .catch((error) => {
            // console.log(error);
            cb(error, {
                message: "Failed",
                data: null
            });
        });
    }
    getOrderListReply(args, cb) {
        let query;
        const fromnoformat = moment_1.default(new Date()).subtract(300, "days").toDate();
        const fromdate = moment_1.default(fromnoformat).format("YYYY-MM-DD");
        const todate = moment_1.default(new Date()).format("YYYY-MM-DD");
        let startDate = utils_1.Utils.toSqlDate(args.startdate);
        let endDate = utils_1.Utils.toSqlDate(args.enddate);
        if (!startDate && !endDate) {
            startDate = fromdate;
            endDate = todate;
        }
        const customerid = args.customerid;
        const ordercode = args.ordercode;
        const status = args.status;
        console.log("startdate", startDate);
        console.log("enddate", endDate);
        query = { status };
        if (customerid)
            query = { status, customerid };
        if (ordercode)
            query = { status, ordercode };
        if (customerid && ordercode)
            query = { status, customerid, ordercode };
        if (!customerid && !ordercode)
            query = { status };
        console.log("status", query);
        RestApi.getDb("order")
            .select("order.*", "customer.name")
            .leftJoin("customer", "order.customerid", "customer.id")
            // .leftJoin("user", "order.userid", "user.id")
            .where(query)
            .whereBetween("order.updateddate", [startDate, endDate])
            .orderBy("order.date", "desc")
            .then((result) => {
            console.log("result orderview ", result);
            cb(undefined, {
                message: "Success",
                data: result
            });
        })
            .catch((error) => {
            // console.log(error);
            cb(error, {
                message: "Failed",
                data: null
            });
        });
    }
    /**
     * Get order customer by date for filter select-box from front-end
     */
    getOrderCustomerByDate(args, cb) {
        let query;
        const status = args.status;
        const fromnoformat = moment_1.default(new Date()).subtract(14, "days").toDate();
        const fromdate = moment_1.default(fromnoformat).format("YYYY-MM-DD");
        const todate = moment_1.default(new Date()).format("YYYY-MM-DD");
        let startDate = utils_1.Utils.toSqlDate(args.startdate);
        let endDate = utils_1.Utils.toSqlDate(args.enddate);
        if (!startDate && !endDate) {
            startDate = fromdate;
            endDate = todate;
        }
        query = { "order.status": status };
        console.log("query", query);
        RestApi.getDb("customer")
            .select("customer.id", "customer.name")
            .leftJoin("order", "customer.id", "order.customerid")
            .where(query)
            .whereBetween("order.date", [startDate, endDate])
            .groupBy("customer.id", "customer.name")
            .then((result) => {
            console.log("result ", result);
            cb(undefined, {
                message: "Success",
                data: result
            });
        })
            .catch((error) => {
            console.log(error);
            cb(error, {
                message: "Failed",
                data: null
            });
        });
    }
    getOrderCustomer(args, cb) {
        let query;
        const status = args.status;
        query = { "order.status": status };
        console.log("query", query);
        RestApi.getDb("customer")
            .select("customer.id", "customer.name")
            .leftJoin("order", "customer.id", "order.customerid")
            .where(query)
            .groupBy("customer.id", "customer.name")
            .then((result) => {
            console.log("getOrderCustomer result ", result);
            cb(undefined, {
                message: "Success",
                data: result
            });
        })
            .catch((error) => {
            console.log(error);
            cb(error, {
                message: "Failed",
                data: null
            });
        });
    }
    /**
     * Get order code by date and customer for filter select-box from front-end
     */
    getOrderCode(args, cb) {
        console.log("args", args.status);
        const search = args.status;
        console.log("string ", [...search]);
        console.log("string length ", search.length);
        console.log(" 0 :", search[0]);
        console.log(" 1 :", search[1]);
        console.log(" 2 :", search[2]);
        console.log(" 3 :", search[3]);
        console.log(" 4 :", search[4]);
        console.log(" 5 :", search[5]);
        console.log(" 6 :", search[6]);
        console.log(" 7 :", search[7]);
        console.log(" 8 :", search[8]);
        console.log(" 9 :", search[9]);
        console.log(" 10 :", search[10]);
        console.log(" 11 :", search[11]);
        console.log(" 12 :", search[12]);
        let query;
        const status = args.status;
        const fromnoformat = moment_1.default(new Date()).subtract(14, "days").toDate();
        const fromdate = moment_1.default(fromnoformat).format("YYYY-MM-DD");
        const todate = moment_1.default(new Date()).format("YYYY-MM-DD");
        let startDate = utils_1.Utils.toSqlDate(args.startdate);
        let endDate = utils_1.Utils.toSqlDate(args.enddate);
        if (!startDate && !endDate) {
            startDate = fromdate;
            endDate = todate;
        }
        const customerid = args.customerid;
        console.log("customerid", customerid);
        if (customerid)
            query = { status, customerid };
        if (!customerid)
            query = { status };
        console.log("query", query);
        RestApi.getDb("order")
            .select("id", "ordercode")
            .where(query)
            .whereBetween("order.date", [startDate, endDate])
            .then((result) => {
            console.log("result ", result);
            cb(undefined, {
                message: "Success",
                data: result
            });
        })
            .catch((error) => {
            console.log(error);
            cb(error, {
                message: "Failed",
                data: null
            });
        });
    }
    getOrderCodebyCustomerId(args, cb) {
        let query;
        const fromnoformat = moment_1.default(new Date()).subtract(14, "days").toDate();
        const fromdate = moment_1.default(fromnoformat).format("YYYY-MM-DD");
        const todate = moment_1.default(new Date()).format("YYYY-MM-DD");
        let startDate = utils_1.Utils.toSqlDate(args.startdate);
        let endDate = utils_1.Utils.toSqlDate(args.enddate);
        if (!startDate && !endDate) {
            startDate = fromdate;
            endDate = todate;
        }
        console.log("startdate", startDate);
        console.log("enddate", endDate);
        const status = args.status;
        const customerid = args.customerid;
        query = { status };
        if (customerid)
            query = { status, customerid };
        if (!customerid)
            query = { status };
        console.log("query", query);
        RestApi.getDb("order")
            .select("id", "ordercode")
            .where(query)
            .whereBetween("order.date", [startDate, endDate])
            .then((result) => {
            console.log("getOrderCodebyCustomerId result ", result);
            cb(undefined, {
                message: "Success",
                data: result
            });
        })
            .catch((error) => {
            console.log(error);
            cb(error, {
                message: "Failed",
                data: null
            });
        });
    }
}
exports.OrderView = OrderView;
exports.default = new OrderView();
//# sourceMappingURL=orderview.js.map