/**
 * Sub Category Routes
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

class SubCategoryRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/sub-category").all(Permission.onLoad).get(this.getList);
    this.route("/sub-category/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/sub-category/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/sub-category/delete/:id").all(Permission.onLoad).post(this.postDelete);
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
          res.render("dashboard/sub-category", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/sub-category", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/sub-category/entry", params: {}, listUrl: "/sub-category" };
    params = Permission.getMenuParams(params, req, res);

    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          console.log("params ", params);
          res.render("dashboard/sub-category-entry", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/sub-category-entry", params);
    }

  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.id = uuid.v4();

    delete (data.subcategories);
    const db = RestApi.getDb("sub_category");
    db.insert(data, "id")
      .then((result) => {
        console.log("post sub", result);
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
    const postUrl = `/sub-category/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/sub-category" };
    params = Permission.getMenuParams(params, req, res);
    RestApi.getDb("sub_category").where({ id: data.id }).select()
      .then((result) => {
        params.params = Utils.mixin(data, result[0]);
        console.log("ykm params ", params);
        return RestApi.getDb("sub_category").whereNot({ id: data.id }).select();
      })
      .then((result) => {
        params.subcategories = result;

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/sub-category-entry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);

    let db = RestApi.getDb("sub_category");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    db = db.where({ id: data.id });
    delete (data.id);
    delete (data.subcategories);
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
    RestApi.getDb("product").where({ subcategoryid: data.id }).first()
      .then((result) => {
        console.log("product result ", result);
        if (result) {
          throw new Error("Cannot delete. Already Used!");
        } else {
          return RestApi.getDb("sub_category").where({ id: data.id }).delete("id");
        }
      })
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

export default new SubCategoryRouter();