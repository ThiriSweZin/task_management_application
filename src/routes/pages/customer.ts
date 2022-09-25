/**
 * Customer Routes
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

class CustomerRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/customer").all(Permission.onLoad).get(this.getList);
    this.route("/customer/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/customer/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/customer/delete/:id").all(Permission.onLoad).post(this.postDelete);
    this.route("/customer-remarks").all(Permission.onLoad).get(this.getRemarks);
    this.route("/customer-remarks/entry").all(Permission.onLoad).get(this.getRemarksEntry).post(this.postRemarksEntry);
    this.route("/customer-remarks/edit/:id").all(Permission.onLoad).get(this.getRemarksEdit).post(this.postRemarksEdit);
    this.route("/customer-remarks/delete/:id").all(Permission.onLoad).post(this.postRemarksDelete);
    this.route("/customer_favorite").all(Permission.onLoad).get(this.getFavorite);
    this.route("/customer_favorite/detail/:id").all(Permission.onLoad).get(this.getFavoriteDetail);
    this.route("/feedback").all(Permission.onLoad).get(this.getFeedback);
    this.route("/feedback/detail/:id").all(Permission.onLoad).get(this.getFeedbackDetail);
    this.route("/feedback/image/:id").all(Permission.onLoad).get(this.getImages);
    this.route("/customer/active/:id").all(Permission.onLoad).post(this.postActive);
    this.route("/customer/inactive/:id").all(Permission.onLoad).post(this.postInactive);
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
          res.render("dashboard/customer", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/customer", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/customer/entry", params: {}, listUrl: "/customer" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("customer")
      .select()
      .then((result) => {
        console.log("params ", params);
        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          res.render("dashboard/customer-entry", params);
        }
      })
      .then((result: string) => {
        params.token = result;
        res.render("dashboard/customer-entry", params);
      })
      .catch((err: any) => {
        next(err);
      });
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.id = uuid.v4();
    const db = RestApi.getDb("customer");
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
    const postUrl = `/customer/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/customer" };
    params = Permission.getMenuParams(params, req, res);
    RestApi.getDb("customer").where({ id: data.id }).select()
      .then((result) => {
        params.params = Utils.mixin(data, result[0]);
        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/customer-entry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);

    let db = RestApi.getDb("customer");
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
    let ord_customer: any, fb_customer: any;
    RestApi.getDb("order").where({ customerid: data.id }).first()
      .then((result) => {
        ord_customer = result;
        return RestApi.getDb("feedback").where({ customerid: data.id }).first();
      })
      .then((result) => {
        fb_customer = result;
        return RestApi.getDb("customer_favorite").where({ customerid: data.id }).first();
      })
      .then((result) => {
        if (result || ord_customer || fb_customer) {
          throw new Error("Cannot delete. Already Used!");
        } else {
          return RestApi.getDb("customer").where({ id: data.id }).delete("id");
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

  public getRemarks(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/customer/remarks", params: {} };
    params = Permission.getMenuParams(params, req, res);

    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/customer-remarks", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/customer-remarks", params);
    }
  }

  public getRemarksEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/customer-remarks/entry", params: {}, listUrl: "/customer-remarks" };
    params = Permission.getMenuParams(params, req, res);

    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/customer-remarks-entry", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/customer-remarks-entry", params);
    }
  }

  public postRemarksEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.date = Utils.toSqlDate(data.date);
    data.id = uuid.v4();

    const db = RestApi.getDb("customer_remark");
    db.insert(data, "id")
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }

  public getRemarksEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(next);
    }

    const postUrl = `/customer-remarks/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/customer-remarks", params: data };
    params = Permission.getMenuParams(params, req, res);
    RestApi.getDb("customer_remark")
      .select("customer_remark.*", "customer.name")
      .leftJoin("customer", "customer_remark.customerid", "customer.id")
      .where("customer_remark.id", data.id)
      .then((result) => {
        params.params = Utils.mixin(data, result[0]);
        params.params.date = Utils.toDisplayDate(params.params.date);
        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/customer-remarks-entry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postRemarksEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.date = Utils.toSqlDate(data.date);

    let db = RestApi.getDb("customer_remark");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    db = db.where({ id: data.id });
    delete (data.id);
    delete (data.name);
    delete (data.code);
    db.update(data, "id")
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }

  public postRemarksDelete(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    RestApi.getDb("customer_remark").where({ id: data.id }).delete("id")
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

  public getFavorite(req: express.Request, res: express.Response, next: express.NextFunction) {
    const params: any = { title: config.appname, user: req.user.username };
    params.login = req.isAuthenticated();
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          console.log("params1 >>", params);
          res.render("dashboard/customer_favorite", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/customer_favorite", params);
      console.log("params2 >>", params);
    }
  }

  public getFavoriteDetail(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(next);
    }
    // const postUrl = `/customer_favorite/detail/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, listUrl: "/customer_favorite", params: data };
    params = Permission.getMenuParams(params, req, res);
    RestApi.getDb("customer_favorite")
      .select("customer.name", "product.productname", "customer_favorite.date")
      .leftJoin("customer", "customer_favorite.customerid", "customer.id")
      .leftJoin("product", "customer_favorite.productid", "product.id")
      .where("customer_favorite.id", data.id)
      .then((result) => {
        params.params = Utils.mixin(data, result[0]);
        params.params.date = Utils.toDisplayDate(params.params.date);
        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/customer_favorite_detail", params);
        console.log("result >>", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public getFeedback(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);

    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/feedback", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/feedback", params);
    }
  }

  public getFeedbackDetail(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(next);
    }
    // const postUrl = `/customer_favorite/detail/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, listUrl: "/feedback", params: data };
    params = Permission.getMenuParams(params, req, res);
    RestApi.getDb("feedback")
      .leftJoin("customer", "feedback.customerid", "customer.id")
      .select("feedback.*", "customer.name", "customer.phone")
      .where("feedback.id", data.id)
      .then((result) => {
        result[0].createddate = Utils.toDisplayDate(result[0].createddate);
        params.params = Utils.mixin(data, result[0]);
        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/feedback-detail", params);
        console.log("result >>", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public getImages(req: express.Request, res: express.Response, next: express.NextFunction) {
    const id = req.params.id;
    if (Utils.isEmpty(id)) {
      return comfunc.sendForbidden(next);
    }
    const postUrl = `/feedback/image/${id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/feedback" };
    params = Permission.getMenuParams(params, req, res);
    RestApi.getDb("feedback").where({ id: id }).select("images")
      .then((result) => {
        console.log("result ", result);
        let images_string = result[0].images;
        console.log("images_string ", images_string);
        let images_arr = images_string.split(',');
        console.log("arr ", images_arr);
        let images_array = images_arr.map((image: any) => {
          return image.replace('.', '');
        });
        console.log("images_array ", images_array);
        params.params = { id: id, images: images_array };
        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/feedback-image", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }

  public postActive(req: express.Request, res: express.Response, next: express.NextFunction) {
    console.log("post active");
    const id = req.params.id;
    console.log("id ", id);
    RestApi.getDb("customer")
      .where("id", id)
      .update({ is_active: 1, active_status: 1, updateddate: Utils.toSqlDate(new Date()) }, "id")
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }

  public postInactive(req: express.Request, res: express.Response, next: express.NextFunction) {
    console.log("post Inactive");
    const id = req.params.id;
    console.log("id ", id);
    RestApi.getDb("customer")
      .where("id", id)
      .update({ is_active: 0, active_status: 0, updateddate: Utils.toSqlDate(new Date()) }, "id")
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }

}

export default new CustomerRouter();