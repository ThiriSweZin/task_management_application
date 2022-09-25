/**
 * OrderNoti Routes
 */
import * as express from "express";
import * as uuid from "uuid";
import { ExpressRouter } from "../../lib/express-application";
import { Utils } from "../../lib/utils";
import config from "../../../data/config.json";
import * as RestApi from "../../lib/restapi";
import * as comfunc from "../../lib/comfunc";
import * as FileRouter from "../file";
import { Permission } from "../../lib/permission";

const jwtCredentialId = config.jwt.defCredentialId;

class OrderNotiRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/order-noti").all(Permission.onLoad).get(this.getList);
    this.route("/order-noti/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/order-noti/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/order-noti/delete/:id").all(Permission.onLoad).post(this.postDelete);
  }

  public onLoad(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.redirect(`/login?url=${req.url}`);
    }
  }

  public getList(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/order-noti", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/order-noti", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/order-noti/entry", params: {}, listUrl: "/order-noti" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("order_noti")
    .select()
    .then((result) => {
      params.statusname = result;
      console.log("params ", params);

      if (typeof (<any>req).jwtToken == "function") {
        return (<any>req).jwtToken(jwtCredentialId);
      } else {
        res.render("dashboard/order-noti-entry", params);
      }
    })
    .then((result: string) => {
      params.token = result;
      res.render("dashboard/order-noti-entry", params);
    })
    .catch((err: any) => {
      next(err);
    });
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.id = uuid.v4();
    delete (data.statusname);
    const db = RestApi.getDb("order_noti").insert(data, "id")
    .then((result) => {
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
    const postUrl = `/order-noti/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/order-noti" };
    params = Permission.getMenuParams(params, req, res);
    RestApi.getDb("order_noti").where({ id: data.id }).select()
    .then((result) => {
      params.params = Utils.mixin(data, result[0]);

      return RestApi.getDb("order_noti").whereNot({ id: data.id }).select();
    })
    .then((result) => {
      params.statusname = result;

      if (typeof (<any>req).jwtToken == "function") {
        return (<any>req).jwtToken(jwtCredentialId);
      } else {
        return Promise.resolve("");
      }
    })
    .then((result) => {
      params.token = result;
      res.render("dashboard/order-noti-entry", params);
    })
    .catch((err) => {
      console.log(`${err}`);
      next({ "error": err });
    });
  }

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);

    let db = RestApi.getDb("order_noti");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    db = db.where({ id: data.id });
    delete (data.id);
    delete (data.statusname);
    db.update(data, "id")
    .then((result) => {
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

    RestApi.getDb("order_noti").where({ id: data.id }).delete("id")
    .then((result) => {
      res.json({ "success": result });
    })
    .catch((err) => {
      console.log(`${err}`);
      res.json({
        "error": {
          name: err.name,
          message: err.message,
          stack: err.stack
        }
      });
    });
  }
}

export default new OrderNotiRouter();