/**
 * Region Routes
 */
import * as express from "express";
import * as uuid from "uuid";
import { ExpressRouter } from "../../lib/express-application";
import { Utils } from "../../lib/utils";
import config from "../../../data/config.json";
import * as RestApi from "../../lib/restapi";
import * as comfunc from "../../lib/comfunc";
import { Permission } from "../../lib/permission";

const jwtCredentialId = config.jwt.defCredentialId;

class RegionRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/region").all(Permission.onLoad).get(this.getList);
    this.route("/region/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/region/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/region/delete/:id").all(Permission.onLoad).post(this.postDelete);
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
          res.render("dashboard/region", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/region", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/region/entry", params: {}, listUrl: "/region" };
    params = Permission.getMenuParams(params, req, res);

    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/region-entry", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/region-entry", params);
    }

  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.id = uuid.v4();
    delete (data.regions);

    const db = RestApi.getDb("region");
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
    const postUrl = `/region/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/region" };
    params = Permission.getMenuParams(params, req, res);
    RestApi.getDb("region").where({ id: data.id }).select()
    .then((result) => {
      params.params = Utils.mixin(data, result[0]);
      if (typeof (<any>req).jwtToken == "function") {
        return (<any>req).jwtToken(jwtCredentialId);
      } else {
        return Promise.resolve("");
      }
    })
    .then((result) => {
      params.token = result;
      res.render("dashboard/region-entry", params);
    })
    .catch((err) => {
      console.log(`${err}`);
      next({ "error": err });
    });
  }

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);

    let db = RestApi.getDb("region");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    db = db.where({ id: data.id });
    delete (data.id);
    delete (data.regions);
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
    let customerRegion: any = {};
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    RestApi.getDb("customer").where({ regionid: data.id }).first()
    .then((result) => {
      customerRegion = result;
      console.log("customerRegion ", customerRegion);
      return RestApi.getDb("city").where({ regionid: data.id }).first();
    })
    .then((result) => {
      if (result || customerRegion) {
        throw new Error("Cannot delete. Already Used!");
      } else {
        return RestApi.getDb("region").where({ id: data.id }).delete("id");
      }
    })
    .then((result) => {
      res.json({ "success": result });
    })
    .catch((err) => {
      console.log(`${err}`);
      res.json({ "error": {
          name: err.name,
          message: err.message,
          stack: err.stack
        }
      });
    });
  }
}

export default new RegionRouter();