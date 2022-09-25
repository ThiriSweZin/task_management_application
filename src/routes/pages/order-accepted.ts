/**
 * Order Routes
 */
import * as express from "express";
import * as uuid from "uuid";
import { ExpressRouter } from "../../lib/express-application";
import { Utils } from "../../lib/utils";
import config from "../../../data/config.json";
import * as RestApi from "../../lib/restapi";
import * as comfunc from "../../lib/comfunc";
import { Notification } from "../../lib/firebase-msg";
import { Permission } from "../../lib/permission";
import * as localStorage from "local-storage";

const jwtCredentialId = config.jwt.defCredentialId;

class OrderRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/order-accepted").all(Permission.onLoad).get(this.getList);
    this.route("/order-accepted/details/:id").all(Permission.onLoad).get(this.getDetail);
    this.route("/order-accept-preview").all(Permission.onLoad).get(this.getAcceptedDetail);
    
  }

  public onLoad(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.redirect(`/login?url=${req.url}`);
    }
  }

  public getList(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/order-accepted", params: {} };
    params = Permission.getMenuParams(params, req, res);

    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/order-accepted", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/order-accepted", params);
    }
  }

  public getDetail(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    let total: number = 0;
    let order_items: any = [];
    const accept_orders: any = [];
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(next);
    }
    localStorage.set("orderaccepted_id", data.id);
    console.log("orderaccepted_id in getaccepteddetail ", data.id);
    const postUrl = `/order-accepted/details/${data.id}`;
    let params: any = { title: config.appname, postUrl: postUrl, listUrl: "/order-accepted", params: data };
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
          // } else {
            order_item.qty = order_item.replyqty;
            total = order_item.price * order_item.replyqty;
            order_item.total = Utils.numberWithCommas(total);
            order_item.price = Utils.numberWithCommas(order_item.price);
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

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
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

  public getAcceptedDetail(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id || localStorage.get("orderaccepted_id") };
    console.log("orderaccepted_id ", data.id);
    let total: number = 0;
    let order_items: any = [];
    const accept_orders: any = [];
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(next);
    }
    const postUrl = `/order-accept-preview/${data.id}`;
    let params: any = { title: config.appname, postUrl: postUrl, listUrl: "/order-accepted", params: data };
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
          // } else {
            order_item.qty = order_item.replyqty;
            total = order_item.price * order_item.replyqty;
            order_item.total = Utils.numberWithCommas(total);
            order_item.price = Utils.numberWithCommas(order_item.price);
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

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
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

export default new OrderRouter();