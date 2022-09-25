/**
 * User Routes
 */
import * as express from "express";
import { ExpressRouter } from "../../lib/express-application";
import { Utils } from "../../lib/utils";
import config from "../../../data/config.json";
import * as RestApi from "../../lib/restapi";
import * as comfunc from "../../lib/comfunc";
import * as passport from "../../config/passport-config";
import * as uuid from "uuid";
import { Permission } from "../../lib/permission";

const jwtCredentialId = config.jwt.defCredentialId;

class UserRegisterRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/user-register").all(Permission.onLoad).get(this.getList);
    this.route("/user-register/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/user-register/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/user-register/unlock/:id").all(Permission.onLoad).post(this.postUnlock);
    this.route("/user-register/delete/:id").all(Permission.onLoad).post(this.postDelete);
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
          res.render("dashboard/user-register", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/user-register", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/user-register/entry", params: {}, listUrl: "/user-register" };
    params = Permission.getMenuParams(params, req, res);
    RestApi.getDb("user").select()
      .then((result) => {
        params.users = result;
        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          res.render("dashboard/user-register-entry", params);
        }
      })
      .then((result: string) => {
        params.token = result;
        res.render("dashboard/user-register-entry", params);
      })
      .catch((err: any) => {
        next(err);
      });
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.id = uuid.v4();
    data.password = passport.md5(req.body.password || "");

    delete (data.confirm_password);
    delete (data.users);

    const db = RestApi.getDb("user");
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
    const postUrl = `/user-register/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/user-register"  };
    params = Permission.getMenuParams(params, req, res);
    RestApi.getDb("user")
      .leftJoin("user_role", "user.roleid", "user_role.id")
      .where({ "user.id": data.id })
      .select("user.*", "user_role.role")
      .then((result) => {
        params.params = Utils.mixin(data, result[0]);
        return RestApi.getDb("user").whereNot({ id: data.id }).select();
      })
      .then((result) => {
        params.users = result;
        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/user-register-entry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    const password = req.body.password || "";
    if (password == "") delete (data.password);
    else data.password = passport.md5(password);
    delete (data.confirm_password);
    delete (data.users);

    let db = RestApi.getDb("user");
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

  public postUnlock(req: express.Request, res: express.Response, next: express.NextFunction) {
    let data = comfunc.fillDefaultFields(req.body);
    data = { id: req.params.id };
    console.log("data1 ", data);
    data.status = 0;
    let db = RestApi.getDb("user");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    db = db.where({ id: data.id });
    delete (data.id);
    console.log("data ", data);
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
    
    RestApi.getDb("user").where({ id: data.id }).delete("id")
    .then((result) => {
      res.json({ "success": result });
    })
    .catch((err) => {
      console.log(`${err}`);
      res.json({ "error": err });
    });
  }
}

export default new UserRegisterRouter();