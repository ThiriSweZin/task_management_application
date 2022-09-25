/**
 * Force Update Routes
 */
import * as express from "express";
import { ExpressRouter } from "../../lib/express-application";
import { Utils } from "../../lib/utils";
import config from "../../../data/config.json";
import * as RestApi from "../../lib/restapi";
import * as comfunc from "../../lib/comfunc";

const jwtCredentialId = config.jwt.defCredentialId;

class ForceUpdateRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/forceupdate").get(this.getEdit).post(this.postEdit);
  }

  public getEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data: any = {};
    const postUrl = `/forceupdate`;
    let params: any = { title: config.appname, postUrl: postUrl, listUrl: "/forceupdate" };

    RestApi.getDb("forceupdate").first()
      .then((result) => {
        params.params = Utils.mixin(data, result);
        res.render("dashboard/forceupdate", params);
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
      RestApi.getDb("forceupdate").where({ id: id }).update(data, "id")
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });

  }
}

export default new ForceUpdateRouter();