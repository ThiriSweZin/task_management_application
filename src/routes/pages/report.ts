/**
 * Region Routes
 */
import * as express from "express";
import { ExpressRouter } from "../../lib/express-application";
import config from "../../../data/config.json";
import { Permission } from "../../lib/permission";
import { Utils } from "../../lib/utils";
import * as comfunc from "../../lib/comfunc";
import * as RestApi from "../../lib/restapi";

const jwtCredentialId = config.jwt.defCredentialId;

class ReportRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/customer-report").all(Permission.onLoad).get(this.getCustomerReport);
    this.route("/product-report").all(Permission.onLoad).get(this.getProductReport);
    this.route("/monthly-order-report").all(Permission.onLoad).get(this.getMonthlyOrderReport);
    this.route("/monthly-order-report/detail/:id/:status").all(Permission.onLoad).get(this.getMonthlyOrderReportDetail);
    this.route("/daily-order-detail-report").all(Permission.onLoad).get(this.getDailyOrderDetailReport);
    this.route("/order-detail-excel-report").all(Permission.onLoad).get(this.getOrderDetailExcelReport);
  }

  public getCustomerReport(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    console.log("params ", params);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          console.log("paramas ", params);
          res.render("dashboard/customer-report", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/customer-report", params);
    }
  }

  public getProductReport(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    console.log("params ", params);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          console.log("paramas ", params);
          res.render("dashboard/product-report", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/product-report", params);
    }
  }

  public getMonthlyOrderReport(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, params: {} };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          console.log("paramas ", params);
          res.render("dashboard/monthly-order-report", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/monthly-order-report", params);
    }
  }

  public getMonthlyOrderReportDetail(req: express.Request, res: express.Response, next: express.NextFunction) {
    console.log("req.params ", req.params);
    const data = { id: req.params.id, status: req.params.status };
    let total: number = 0;
    let order_items: any = [];
    console.log("data ",data);
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(next);
    }
    
    let params: any = { title: config.appname, user: req.user.username, listUrl: "/monthly-order-report", params: data };
    console.log("params1 ", params);
    params = Permission.getMenuParams(params, req, res);
    console.log("params2 ", params);
    RestApi.getDb("order")
      .leftJoin("customer", "order.customerid", "customer.id")
      .leftJoin("car_gate", "order.cargate", "car_gate.id")
      .where("order.id", data.id)
      .select("order.*", "customer.name", "car_gate.cargatename")
      .then((result) => {
        params.params = Utils.mixin(data, result[0]);
        params.params.orderdate = Utils.toDisplayDate(params.params.orderdate);
        params.params.netamount = Utils.numberWithCommas(params.params.netamount);
        if(data.status == "delivered"){
          return RestApi.getDb("order_items as oi")
          .select("oi.id as orderitemid", "oi.orderid", "oi.productid", "oi.price", "oi.orderqty", "oi.replyqty", "product.id", "product.productcode", "product.productname", "product.price", "product.itemcount")
          .leftJoin("product", "oi.productid", "product.id")
          .where("oi.orderid",data.id)
          .whereNot("oi.replyqty", 0);
        } else {
          return RestApi.getDb("order_items as oi")
          .select("oi.id as orderitemid", "oi.orderid", "oi.productid", "oi.price", "oi.orderqty", "oi.replyqty", "product.id", "product.productcode", "product.productname", "product.price", "product.itemcount")
          .leftJoin("product", "oi.productid", "product.id")
          .where("oi.orderid",data.id);
        }
        
      })
      .then((order_items_result) => {
        order_items = order_items_result;
        order_items.map((order_item: any) => {
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
        res.render("dashboard/monthly-order-report-detail", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public getDailyOrderDetailReport(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, params: {} };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          console.log("paramas ", params);
          res.render("dashboard/daily-order-detail-report", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/daily-order-detail-report", params);
    }
  }

  public getOrderDetailExcelReport(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, params: {} };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          console.log("paramas ", params);
          res.render("dashboard/order-detail-excel-report", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/order-detail-excel-report", params);
    }
  }

}

export default new ReportRouter();