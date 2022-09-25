/**
 * Product Routes
 */
import * as express from "express";
import * as knex from "knex";
import * as uuid from "uuid";
import { ExpressRouter } from "../../lib/express-application";
import { Utils } from "../../lib/utils";
import config from "../../../data/config.json";
import * as RestApi from "../../lib/restapi";
import * as comfunc from "../../lib/comfunc";
import { Permission } from "../../lib/permission";
import { Notification } from "../../lib/firebase-msg";

const jwtCredentialId = config.jwt.defCredentialId;

class ProductRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/product").all(Permission.onLoad).get(this.getList);
    this.route("/product/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/product/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/product/delete/:id").all(Permission.onLoad).post(this.postDelete);
    this.route("/product/editprice/:id").all(Permission.onLoad).post(this.postEditPrice);
  }

  public onLoad(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.redirect(`/login?url=${req.url}`);
    }
  }

  public getList(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, listUrl: "/product" };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/product", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/product", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/product/entry", params: {}, listUrl: "/product" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("product")
      .select()
      .then((result) => {
        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          res.render("dashboard/product-entry", params);
        }
      })
      .then((result: string) => {
        params.token = result;
        res.render("dashboard/product-entry", params);
      })
      .catch((err: any) => {
        next(err);
      });
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    console.log("product data ", data);
    data.id = uuid.v4();
    data.createddate = Utils.toSqlDateTime(new Date());   // for get latest product by createddate "desc"
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

  public getEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(next);
    }
    const postUrl = `/product/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/product" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("product").where({ id: data.id }).select()
      .then((result) => {
        params.params = Utils.mixin(data, result[0]);
        console.log("getedit data ", params.params);
        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
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

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    const noti = new Notification();
    const product_data: any = {
      type: "product-detail",
      productid: data.id
    };
    if (Utils.isEmpty(data.id)) {
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

  public postDelete(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    RestApi.getDb("order_items").where({ productid: data.id }).first()
      .then((result) => {
        if (result) {
          throw new Error("Cannot delete. Already Used!");
        } else {
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

  public postEditPrice(req: express.Request, res: express.Response, next: express.NextFunction) {
    console.log("call postEditPrice");
    const user = req.user;
    const userid = user.id;
    const data = comfunc.fillDefaultFields(req.body);
    console.log("data 1", data);
    
    RestApi.getDb("product").update({ "price": data.productprice, "updateddate": Utils.toSqlDate(new Date()) }, "id")
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

export default new ProductRouter();