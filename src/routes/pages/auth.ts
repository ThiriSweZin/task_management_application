// /**
//  * Auth Router
//  */
// import * as express from "express";
// import { ExpressRouter } from "../../lib/express-application";
// import config from "../../../data/config.json";
// import * as passport from "../../config/passport-config";
// import * as RestApi from "../../lib/restapi";
// import * as comfunc from "../../lib/comfunc";
// import { Utils } from "../../lib/utils";

// class AuthRouter extends ExpressRouter {
//   constructor() {
//     super();

//     /* Login route. */
//     // this.route("/login").get(this.getLogin).post(this.postLogin);
//     /* Log out route */
//     this.route("/logout").all(this.logout);
//     /* Register route */
//     this.route("/register").get(this.getRegister);
//     /* Change password route */
//     // this.route("/changepwd").get(this.getChangePassword).post(this.postChangePassword);
//     this.route("/changepassword").get(this.getChangePassword).post(this.postChangePassword);
//   }

//   static buildAlert(type: string, message: string): string {
//     const cssClass = (type == "error") ? "danger" : type;
//     const title = type.toUpperCase();
//     return `<div class='alert alert-${cssClass} alert-dismissible' role='alert'><strong>${title}:</strong> ${message}
//   <button class='close' type='button' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button>
//   </div>`;
//   }

//   public getLogin(req: express.Request, res: express.Response, next: express.NextFunction) {
//     const params: any = { title: "Login" };
//     params.url = req.query.url || "/dashboard";
//     if (typeof (<any>req).csrfToken == "function") {
//       params.csrfToken = (<any>req).csrfToken();
//     }

//     res.render("auth/login", params);
//   }

//   public postLogin(req: express.Request, res: express.Response, next: express.NextFunction) {
//     const redirecturl = req.body.url || "/dashboard";
//     const remember = (req.body.remember && req.body.remember == 1) || false;
//     if (remember) {
//       // Cookie expires after 7 days
//       req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;
//     } else {
//       // Cookie expires at end of session
//       req.session.cookie.expires = false;
//     }

//     passport.default.authenticate("local", (err, user) => {
//       const params: any = { title: config.appname, user: req.user.username };
//       params.url = redirecturl;
//       if (typeof (<any>req).csrfToken == "function") {
//         params.csrfToken = (<any>req).csrfToken();
//       }

//       if (err) {
//         params.message = AuthRouter.buildAlert("error", err.message);
//         res.render("auth/login", params);

//       } else if (!user) {
//         params.message = AuthRouter.buildAlert("error", "Invalid login user!");
//         res.render("auth/login", params);

//       } else {
//         req.logIn(user, { session: true }, (errLogin) => {
//           if (errLogin) {
//             return next(err);
//           }
//           return res.redirect(redirecturl);
//         });
//       }
//     })(req, res, next);
//   }

//   public logout(req: express.Request, res: express.Response, next: express.NextFunction) {
//     req.logOut();
//     res.redirect("/login");
//   }

//   public getChangePassword(req: express.Request, res: express.Response, next: express.NextFunction) {
//     if (req.isAuthenticated() && req.user) {
//       const params: any = { title: config.appname, user: req.user.username, params: req.user };
//       params.url = req.query["url"] || "/dashboard";
//       console.log("auths called url >>", params);
//       if (typeof (<any>req).csrfToken == "function") {
//         params.csrfToken = (<any>req).csrfToken();
//       }

//       res.render("auth/changepassword", params);
//     } else {
//       res.redirect(`/login?url=${req.url}`);
//     }
//   }
//   public postChangePassword(req: express.Request, res: express.Response, next: express.NextFunction) {
//     const data = comfunc.fillDefaultFields(req.body);
//     console.log("data", data);
//     const redirectUrl = req.body.redirecturl || "/dashboard";
//     const savedata = {
//       password: passport.md5(data.newpassword),
//     };
//     data.password = passport.md5(data.newpassword);
//     let db = RestApi.getDb("user");
//     if (Utils.isEmpty(data.id)) {
//       return comfunc.sendForbidden(res);
//     }
//     db = db.where({ id: data.id });
//     delete (data.id);
//     delete (data.orirole);
//     delete (data._csrf);
//     delete (data.type);
//     delete (data._password);
//     delete (data.redirecturl);
//     delete (data.oldpassword);
//     db.update(savedata, "id")
//       .then((result) => {
//         // res.json({ "success": result });
//         console.log("dataresult", result);
//         res.redirect("/dashboard");
//       })
//       .catch((err) => {
//         res.json({ "error": err });
//       });

//   }
//   public postChangePassword1(req: express.Request, res: express.Response, next: express.NextFunction) {
//     const redirectUrl = req.body.redirecturl || "/dashboard";
//     const outFunc = (data: any, msgtype: string, msg: string) => {
//       const params: any = { title: config.appname, user: req.user.username, params: data, url: redirectUrl };
//       params.message = AuthRouter.buildAlert(msgtype, msg);
//       if (typeof (<any>req).csrfToken == "function") {
//         params.csrfToken = (<any>req).csrfToken();
//       }
//       console.log("params pws >>", params);
//       res.render("auth/changepassword", params);
//     };

//     if (req.isAuthenticated() && req.user) {
//       const data = req.body;
//       const user = req.user;
//       const id = user.id || 0;
//       const password = user.password || "";

//       console.log("data >>", JSON.stringify(data) + " user >>", JSON.stringify(user) + "id >>", id + " pwd >>", password);

//       if (data.id && data.id == id) {
//         const oldpassword = passport.md5(data.oldpassword);

//         const saveData = {
//           id: id,
//           usertype: user.usertype,
//           username: user.username,
//           password: passport.md5(data.password)
//         };

//         console.log("save Data >>", saveData);
//         passport.default.updateSystemUser(saveData)
//           .then((result) => {
//             if (result) {
//               outFunc(data, "success", "Password has changed!");
//             } else {
//               outFunc(data, "error", "Password can not changed!");
//             }
//           })
//           .catch((err) => {
//             outFunc(data, "error", "Password can not changed!");
//           });

//       } else {
//         res.redirect(redirectUrl);
//       }

//     } else {
//       res.redirect(redirectUrl);
//     }
//   }

//   public getRegister(req: express.Request, res: express.Response, next: express.NextFunction) {
//     res.send("Hello world!");
//   }
// }

// export default new AuthRouter();