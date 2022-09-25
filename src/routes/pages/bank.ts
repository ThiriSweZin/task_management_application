/**
 * Bank Routes
 */
import * as express from "express";
import * as uuid from "uuid";
import { ExpressRouter } from "../../lib/express-application";
import { Utils } from "../../lib/utils";
import config from "../../../data/config.json";
import * as RestApi from "../../lib/restapi";
import * as comfunc from "../../lib/comfunc";
import { Permission } from "../../lib/permission";
import * as FileRouter from "../../routes/file";

const jwtCredentialId = config.jwt.defCredentialId;

class BankRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/bank").all(Permission.onLoad).get(this.getList);
    this.route("/bank/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/bank/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/bank/delete/:id").all(Permission.onLoad).post(this.postDelete);
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
          res.render("dashboard/bank", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/bank", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/bank/entry", params: {}, listUrl: "/bank" };
    params = Permission.getMenuParams(params, req, res);
    RestApi.getDb("bank")
    .select()
    .then((result) => {
      params.banks = result;

      if (typeof (<any>req).jwtToken == "function") {
        return (<any>req).jwtToken(jwtCredentialId);
      } else {
        res.render("dashboard/bank-entry", params);
      }
    })
    .then((result: string) => {
      params.token = result;
      res.render("dashboard/bank-entry", params);
    })
    .catch((err: any) => {
      next(err);
    });
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.id = uuid.v4();
    delete (data.banks);

    const db = RestApi.getDb("bank");
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
    const postUrl = `/bank/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/bank" };
    params = Permission.getMenuParams(params, req, res);
    RestApi.getDb("bank").where({ id: data.id }).select()
      .then((result) => {
        params.params = Utils.mixin(data, result[0]);
        return RestApi.getDb("bank").whereNot({ id: data.id }).select();
      })
      .then((result) => {
        params.banks = result;

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/bank-entry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    const id = data.id;
    delete (data.id);
    delete (data.banks);

    RestApi.getDb("bank").where({ id: id }).first()
    .then((result) => {
      if (result.logo != "" && data.logo == "") {
        const file = FileRouter.default;
        file.init();
        file.delete(result.logo, (err: any, result: any) => {
          if (err) {
            res.json({ "error": result });
          }
        });
      }
      return RestApi.getDb("bank").where({ id: id }).update(data, "id");
    })
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
    RestApi.getDb("bank").where({ id: data.id }).delete("id")
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

export default new BankRouter();