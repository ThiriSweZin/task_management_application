/**
 * Order Routes
 */
import * as express from "express";
import { ExpressRouter } from "../../lib/express-application";
import { Utils } from "../../lib/utils";
import config from "../../../data/config.json";
import * as RestApi from "../../lib/restapi";
import * as comfunc from "../../lib/comfunc";
import { Notification } from "../../lib/firebase-msg";
import { Permission } from "../../lib/permission";
import axios from 'axios';
import qs from 'querystring';
import uuid from "uuid";
import * as localStorage from "local-storage";

const jwtCredentialId = config.jwt.defCredentialId;

class OrderRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/order-new").all(Permission.onLoad).get(this.getNewList);
    this.route("/order-reply").all(Permission.onLoad).get(this.getReplyList);
    this.route("/order-new/details/:id").all(Permission.onLoad).get(this.getNewDetail);
    this.route("/order-reply/details/:id").all(Permission.onLoad).get(this.getReplyDetail);
    this.route("/order-new/reply").all(Permission.onLoad).post(this.postReply);
    this.route("/order-new-preview").all(Permission.onLoad).get(this.getDetail);
  }

  public onLoad(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.redirect(`/login?url=${req.url}`);
    }
  }

  public getNewList(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);

    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/order-new", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/order-new", params);
    }
  }

  public getReplyList(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);

    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/order-reply", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/order-reply", params);
    }
  }

  public getNewDetail(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    let total: number = 0;
    let order_items: any = [];
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(next);
    }
    localStorage.set("ordernew_id", data.id);
    console.log("ordernew_id in getnewdetail ", data.id);
    const postUrl = `/order-new/details/${data.id}`;
    console.log("postUrl ", postUrl);
    let params: any = { title: config.appname, postUrl: postUrl, listUrl: "/order-new", params: data };
    params = Permission.getMenuParams(params, req, res);
    console.log("params ", params);

    RestApi.getDb("order")
      .leftJoin("customer", "order.customerid", "customer.id")
      .leftJoin("car_gate", "order.cargate", "car_gate.id")
      .where("order.id", data.id)
      .select("order.*", "customer.name", "car_gate.cargatename")
      .then((result) => {
        params.params = Utils.mixin(data, result[0]);
        params.params.orderdate = Utils.toDisplayDate(params.params.orderdate);
        params.params.netamount = Utils.numberWithCommas(params.params.netamount);
        return RestApi.getDb("order_items as oi")
          .select("oi.id as orderitemid", "oi.orderid", "oi.productid", "oi.price", "oi.orderqty", "oi.replyqty", "product.id", "product.productcode", "product.productname", "product.price", "product.itemcount")
          .leftJoin("product", "oi.productid", "product.id")
          .where("oi.orderid", data.id);
      })
      .then((order_items_result) => {
        order_items = order_items_result;
        order_items.forEach((order_item: any) => {
          // if (params.params.status == "new") {
            order_item.qty = order_item.orderqty;
            total = order_item.price * order_item.orderqty;
            order_item.total = Utils.numberWithCommas(total);
            order_item.price = Utils.numberWithCommas(order_item.price);
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

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
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

  public getReplyDetail(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    let total: number = 0;
    let order_items: any = [];
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(next);
    }
    localStorage.set("orderreply_id", data.id);
    const postUrl = `/order-reply/details/${data.id}`;
    let params: any = { title: config.appname, postUrl: postUrl, listUrl: "/order-reply", params: data };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("order")
      .leftJoin("customer", "order.customerid", "customer.id")
      .leftJoin("car_gate", "order.cargate", "car_gate.id")
      .where("order.id", data.id)
      .select("order.*", "customer.name", "car_gate.cargatename")
      .then((result) => {
        params.params = Utils.mixin(data, result[0]);
        params.params.orderdate = Utils.toDisplayDate(params.params.orderdate);
        params.params.netamount = Utils.numberWithCommas(params.params.netamount);
        return RestApi.getDb("order_items as oi")
          .select("oi.id as orderitemid", "oi.orderid", "oi.productid", "oi.price", "oi.orderqty", "oi.replyqty", "product.id", "product.productcode", "product.productname", "product.price", "product.itemcount")
          .leftJoin("product", "oi.productid", "product.id")
          .where("oi.orderid", data.id);
      })
      .then((order_items_result) => {
        order_items = order_items_result;
        order_items.forEach((order_item: any) => {
          // if (params.params.status == "new") {
          //   order_item.qty = order_item.orderqty;
          //   total = order_item.price * order_item.orderqty;
          //   order_item.total = Utils.numberWithCommas(total);
          //   order_item.price = Utils.numberWithCommas(order_item.price);
          // } else {
            order_item.qty = order_item.replyqty;
            total = order_item.price * order_item.replyqty;
            order_item.total = Utils.numberWithCommas(total);
            order_item.price = Utils.numberWithCommas(order_item.price);
          // }
          
        });
        params.params.details = order_items;
        return RestApi.getDb("customer").select().where("id", params.params.customerid);
      })
      .then((customer) => {
        params.params.customer = customer;

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
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

  public postReply(req: express.Request, res: express.Response, next: express.NextFunction) {
    console.log("call postreply");
    let updatedObj: any = {}, totalQty: number = 0, orderCode: String, notimessage: any, notilogData: any = {};
    const notilogDataId: any = uuid.v4();
    const noti = new Notification();
    const user = req.user;
    const userid = user.id;
    const data = req.body;
    console.log("data ", data);
    const items = data.items;
    delete data.items;
    const current = Utils.toSqlDateTime(new Date());
    console.log("items ", items);

    items.forEach((item: any) => {
      totalQty += parseInt(item.replyqty);
    });
    if(totalQty == 0){
      updatedObj = {"userid": userid, "totalqty": totalQty, "netamount": data.netamount, "status": "rejected", "date": current, "updateddate": Utils.toSqlDate(new Date()) };
    } else {
      updatedObj = {"userid": userid, "totalqty": totalQty, "netamount": data.netamount, "status": "reply", "date": current, "reply_remark": data.reply_remark, "updateddate": Utils.toSqlDate(new Date()) };
    }

    items.forEach((item: any) => {
      RestApi.getDb("order_items")
        .update({ "replyqty": item.replyqty, "updateddate": Utils.toSqlDate(new Date()) }, "id")
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
        notimessage = notimessage.replace("OrderNo", "Order No."+orderCode);
        return RestApi.getDb("customer_values").select().where({ customerid: data.customerid });
      })
      .then((result) => {
        console.log("customer values ", result);
        if (result && result.length > 0) {
          const token: string = result[0].firebase_token;
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
        } else {
          console.log("No Customer Values");
          return undefined;
        }
      })
      .then((result) => {
        notilogData.id = notilogDataId;
        notilogData.customerid = data.customerid;
        notilogData.orderid = data.orderid;
        notilogData.date = Utils.toSqlDateTime(new Date());
        notilogData.type = "order-reply";
        notilogData.notimessage = notimessage;
        notilogData.createddate = Utils.toSqlDate(new Date());
        notilogData.updateddate = Utils.toSqlDate(new Date());
        return RestApi.getDb("ordernoti_log").insert(notilogData, "id");
      })
      .then((result) => {
        return RestApi.getDb("customer").select('mobile').where({ id: data.customerid })
      })
      .then((result) => {
        console.log("result >>", result);
        let mobile = result[0].mobile;
        console.log("mobile >>", mobile);
        console.log("charAt ", mobile.charAt(0));
        if(mobile.charAt(0) === '0'){
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
        axios.post('https://digitxt.yellowstone.com.mm/Services/SMSSerivce.asmx/SendBulkSMS', qs.stringify(smsData), config)
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

  public getDetail(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id || localStorage.get("ordernew_id") };
    console.log("ordernew_id ", data.id);

    let total: number = 0;
    let order_items: any = [];
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(next);
    }
    const postUrl = `/order-new-preview/${data.id}`;
    console.log("postUrl ", postUrl);
    let params: any = { title: config.appname, postUrl: postUrl, listUrl: "/order-new", params: data };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("order")
      .leftJoin("customer", "order.customerid", "customer.id")
      .leftJoin("car_gate", "order.cargate", "car_gate.id")
      .where("order.id", data.id)
      .select("order.*", "customer.name","customer.mobile","customer.phone","customer.address","customer.code", "car_gate.cargatename")
      .then((result) => {
        params.params = Utils.mixin(data, result[0]);
        params.params.date = Utils.toDisplayDateTime(params.params.date);
        params.params.orderdate = Utils.toDisplayDate(params.params.orderdate);
        params.params.netamount = Utils.numberWithCommas(params.params.netamount);
        console.log("params in getdetail 1", params.params);
        return RestApi.getDb("order_items as oi")
          .select("oi.id as orderitemid", "oi.orderid", "oi.productid", "oi.price", "oi.orderqty", "oi.replyqty", "product.id", "product.productcode", "product.productname", "product.price", "product.itemcount")
          .leftJoin("product", "oi.productid", "product.id")
          .where("oi.orderid", data.id);
      })
      .then((order_items_result) => {
        order_items = order_items_result;
        order_items.forEach((order_item: any) => {
            order_item.qty = order_item.orderqty;
            total = order_item.price * order_item.orderqty;
            order_item.total = Utils.numberWithCommas(total);
            order_item.price = Utils.numberWithCommas(order_item.price);
        });
        params.params.details = order_items;
        console.log("params.params.details", params.params.details);
        console.log("params in getdetail 2", params.params);
        return RestApi.getDb("customer").select().where("id", params.params.customerid);
      })
      .then((customer) => {
        params.params.customer = customer;

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
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

export default new OrderRouter();