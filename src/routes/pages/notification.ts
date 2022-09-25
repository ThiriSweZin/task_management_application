/**
 * Notification Routes
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

class NotificationRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/notification").all(Permission.onLoad).get(this.getList);
    this.route("/notification/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/notification/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/notification/delete/:id").all(Permission.onLoad).post(this.postDelete);

  }

  public onLoad(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.redirect(`/login?url=${req.url}`);
    }
  }

  public getList(req: express.Request, res: express.Response, next: express.NextFunction) {
    const params: any = { title: config.appname, user: req.user.username };
    params.login = req.isAuthenticated();
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/notification", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/notification", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, postUrl: "/notification/entry", params: {}, listUrl: "/notification" };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/notification-entry", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/notification-entry", params);
    }
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    const noti = new Notification();
    let noti_data: any;
    console.log("post entry data d>>", data);
    data.id = uuid.v4();
    data.date = Utils.toSqlDateTime(new Date());
    delete (data.notification);

    const db = RestApi.getDb("notification");
    db.insert(data, "id")
    .then((result) => {
      return RestApi.getDb("notification")
      .select("title", "description", "date")
      .where({"notification.id": data.id})
      .first()
    })
    .then((result_notidata) => {
      result_notidata.date = result_notidata.date.toISOString();
      result_notidata.click_action = "FLUTTER_NOTIFICATION_CLICK";
      result_notidata.type = "other";
      noti_data = result_notidata;
      console.log("noti_data ", noti_data);
      return noti.sendToTopic(noti_data);
    })
    .then(result_noti => {
      console.log("Successfully sent notification:", result_noti);
      res.json({ success: result_noti });
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
    const postUrl = `/notification/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/notification" };
    params = Permission.getMenuParams(params, req, res);
    RestApi.getDb("notification").where({ id: data.id }).select()
    .then((result) => {
      // result[0].date = Utils.toDisplayDate(result[0].date);
      params.params = Utils.mixin(data, result[0]);
      if (typeof (<any>req).jwtToken == "function") {
        return (<any>req).jwtToken(jwtCredentialId);
      } else {
        return Promise.resolve("");
      }
    })
    .then((result) => {
      params.token = result;
      res.render("dashboard/notification-entry", params);
    })
    .catch((err) => {
      console.log(`${err}`);
      next({ "error": err });
    });
  }

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.date = Utils.toSqlDateTime(new Date());
    const noti = new Notification();
    let noti_data: any;
    let db = RestApi.getDb("notification");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    db = db.where({ id: data.id });
    db.update(data, "id")
    .then((result) => {
      return RestApi.getDb("notification")
      .select("title", "description", "date")
      .where({"notification.id": data.id})
      .first()
    })
    .then((result_notidata) => {
      result_notidata.date = result_notidata.date.toISOString();
      result_notidata.click_action = "FLUTTER_NOTIFICATION_CLICK";
      result_notidata.type = "other";
      noti_data = result_notidata;
      console.log("noti_data ", noti_data);
      return noti.sendToTopic(noti_data);
    })
    .then((result_noti) => {
      console.log("Successfully sent notification:", result_noti);
      res.json({ success: result_noti });
    })
    .catch((err) => {
      console.log(`${err}`);
      res.json({ "error": err });
    });
  }

  public postDelete(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    console.log("data >>", data);
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    RestApi.getDb("notification").where({ id: data.id }).delete("id")
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

export default new NotificationRouter();