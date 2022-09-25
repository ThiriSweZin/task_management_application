/**
 * Routes Main
 */
import * as express from "express";
import { ExpressRouter } from "../../lib/express-application";

class HomeRouter extends ExpressRouter {
  constructor() {
    super();
    this.get("/", this.getHome);
  }

  public getHome(req: express.Request, res: express.Response, next: express.NextFunction) {
    res.redirect("/login");
  }
}

export default new HomeRouter();