import express from "express";
import * as RestApi from "./restapi";

export class Permission {

  constructor() { }

  public static onLoad(req: express.Request, res: express.Response, next: express.NextFunction): void {
    console.log("permission load");
    if (req.isAuthenticated()) {
      res.redirect(`/login?url=${req.url}`);
    } else {
      res.redirect(`/login?url=${req.url}`);
    }
  }

  public checkPermission(user: any): boolean {
    // comming soon
    return true;
  }

  public static getMenuParams(params: any, req: express.Request, res: express.Response): any {
    // console.log("permission getMenuParams");
    params.login = req.isAuthenticated();
    // console.log("login ", params.login);
    params.permission = res.locals.permission;
    // console.log("permission ", params.permission);
    // if (typeof (<any>req).jwtToken == "function") {
    //   params.csrfToken = (<any>req).csrfToken();
    // }
    return params;
  }
}