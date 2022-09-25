/**
 * Dashboard Router
 */
import * as express from "express";
import { ExpressRouter } from "../../lib/express-application";
import config from "../../../data/config.json";
import { Permission } from "../../lib/permission";

const jwtCredentialId = config.jwt.defCredentialId;

class DashboardRouter extends ExpressRouter {
  constructor() {
    super();
    this.route("/dashboard").all(Permission.onLoad).get(this.getDashboard);
  }

  public onLoad(req: express.Request, res: express.Response, next: express.NextFunction): void {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.redirect(`/login?url=${req.url}`);
    }
  }

  public getDashboard(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/index", params);
        })
        .catch((err: any) => {
          next(err);
        });
    } else {
      res.render("dashboard/index", params);
    }
  }
}

export default new DashboardRouter();