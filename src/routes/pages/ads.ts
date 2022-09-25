/**
 * Ads Routes
 */
import * as express from "express";
import * as uuid from "uuid";
import { ExpressRouter } from "../../lib/express-application";
import { Utils } from "../../lib/utils";
import config from "../../../data/config.json";
import * as RestApi from "../../lib/restapi";
import * as comfunc from "../../lib/comfunc";
import { Permission } from "../../lib/permission";
import { Notification } from "../../lib/firebase-msg";

const jwtCredentialId = config.jwt.defCredentialId;

class AdsRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/ads").all(Permission.onLoad).get(this.getList);
    this.route("/ads/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/ads/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/ads/delete/:id").all(Permission.onLoad).post(this.postDelete);
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
          res.render("dashboard/ads", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/ads", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/ads/entry", params: {}, listUrl: "/ads" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("ads")
      .select()
      .then((result) => {
        params.ads = result;

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          res.render("dashboard/ads-entry", params);
        }
      })
      .then((result: string) => {
        params.token = result;
        res.render("dashboard/ads-entry", params);
      })
      .catch((err: any) => {
        next(err);
      });
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.id = uuid.v4();
    const noti = new Notification();
    delete (data.ads);
    
    const db = RestApi.getDb("ads");
    db.insert(data, "id")
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
    const postUrl = `/ads/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/ads" };
    params = Permission.getMenuParams(params, req, res);
    RestApi.getDb("ads").where({ id: data.id }).select()
      .then((result) => {
        params.params = Utils.mixin(data, result[0]);
        return RestApi.getDb("ads").whereNot({ id: data.id }).select();
      })
      .then((result) => {
        params.ads = result;
        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/ads-entry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    
    const noti = new Notification();
    let db = RestApi.getDb("ads");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    db = db.where({ id: data.id });
    delete (data.ads);
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

    RestApi.getDb("ads").where({ id: data.id }).delete("id")
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

export default new AdsRouter();