/**
 * Info Type Routes
 */
import * as express from "express";
import { ExpressRouter } from "../../lib/express-application";
import { Utils } from "../../lib/utils";
import config from "../../../data/config.json";
import * as RestApi from "../../lib/restapi";
import * as comfunc from "../../lib/comfunc";
import { Permission } from "../../lib/permission";

const jwtCredentialId = config.jwt.defCredentialId;

class InfoTypeRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/privacy-and-terms").all(Permission.onLoad).get(this.getPrivacyAndTerms).post(this.postPrivacyAndTerms);
    this.route("/privacy-and-terms-template").get(this.getPrivacyAndTermsTemplate);

    this.route("/usage").all(Permission.onLoad).get(this.getUsage).post(this.postUsage);
    this.route("/usage-template").get(this.getUsageTemplate);

  }

  public onLoad(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.redirect(`/login?url=${req.url}`);
    }
  }

  public getPrivacyAndTerms(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data: any = {};
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/privacy-and-terms", params: {} };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("privacy_terms").first()
      .then((result) => {
        params.params = Utils.mixin(data, result);

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/privacy-and-terms", params);
        // setTimeout(() => {
        //   res.render("dashboard/privacy-and-terms", params);
        // }, 1000);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postPrivacyAndTerms(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);

    let db = RestApi.getDb("privacy_terms");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    db = db.where({ id: data.id });
    delete (data.id);
    db.update(data, "id")
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }

  public getPrivacyAndTermsTemplate(req: express.Request, res: express.Response, next: express.NextFunction) {
    const params: any = { params: {} };
    RestApi.getDb("privacy_terms")
      .select("template")
      .first()
      .then((result) => {
        params.params = result;
        console.log("result ", result);
        res.render("template/privacy-and-terms-layout", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public getUsage(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data: any = {};
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/usage", params: {} };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("usage").first()
      .then((result) => {
        params.params = Utils.mixin(data, result);

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/usage", params);
        // setTimeout(() => {
        //   res.render("dashboard/usage", params);
        // }, 1000);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postUsage(req: express.Request, res: express.Response, next: express.NextFunction) {
    console.log("post usage mobile");
    const data = comfunc.fillDefaultFields(req.body);
    console.log("data ", data);

    let db = RestApi.getDb("usage");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    db = db.where({ id: data.id });
    delete (data.id);
    db.update(data, "id")
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }

  public getUsageTemplate(req: express.Request, res: express.Response, next: express.NextFunction) {
    const params: any = { params: {} };
    RestApi.getDb("usage")
      .select("template")
      .first()
      .then((result) => {
        params.params = result;
        console.log("result ", result);
        res.render("template/usage-layout", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

}

export default new InfoTypeRouter();