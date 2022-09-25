/**
 * Company Info Routes
 */
import * as express from "express";
import { ExpressRouter } from "../../lib/express-application";
import { Utils } from "../../lib/utils";
import config from "../../../data/config.json";
import * as RestApi from "../../lib/restapi";
import * as comfunc from "../../lib/comfunc";
import { Permission } from "../../lib/permission";

const jwtCredentialId = config.jwt.defCredentialId;

class CompanyInfoRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/company-info").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
  }

  public onLoad(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.redirect(`/login?url=${req.url}`);
    }
  }

  public getEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data: any = {};
    const postUrl = `/company-info`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/company-info" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("company_info").first()
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
        res.render("dashboard/company-info", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    const id = data.id;
    console.log("data ", data);
      RestApi.getDb("company_info").where({ id: id }).update(data, "id")
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }
}

export default new CompanyInfoRouter();