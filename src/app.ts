/**
 * Main Application
 */
import * as express from "express";
import cookieParser from "cookie-parser";
import * as path from "path";
import * as session from "express-session";
import uuid from "uuid/v4";
import { ExpressApplication } from "./lib/express-application";
import * as passport from "./config/passport-config";
import * as RestApi from "./lib/restapi";
import * as schedule from "node-schedule";
// import * as schedule from "node-schedule";
import config from "../data/config.json";
import * as filerouter from "./routes/file";
// import { Auth } from "./lib/auth";
import { JwtAuth } from "./lib/jwt";
import { OrderView } from "./models/orderview";
import { CustomerView } from "./models/customerview";
import { months } from "moment";


class MainApp extends ExpressApplication {
  constructor() {
    super(__dirname);

    // uncomment after under construction
    // this.isUnderConstruction = true;

    this.urlencodedOptions.extended = true;
  }

  public onUseViewEngine(app: express.Express): void {
    // view engine setup
    this.set("views", path.join(__dirname, "../views/pages"));
    this.set("view engine", "pug");
  }

  public onUseMiddleWares(app: express.Express): void {
    this.use(cookieParser());
    this.useStatic("../public");
    this.use(session.default({
      genid: (req) => { return uuid(); },
      secret: config.sessionsecret,
      resave: true,
      saveUninitialized: true
    })); // session secret

    this.use(passport.default.initialize());
    this.use(passport.default.session());

    // const auth = new Auth();
    // this.use(auth.handle("csrf"));

    const auth = new JwtAuth(config.jwt);
    this.use(auth.handle());

    config.restapi.modelBasePath = path.join(__dirname, "models");
    this.use("/api", RestApi.init(config.restapi, (err, api) => {
      if (api) {
        api.applyModel("notificationview", "regionview", "feedbackview", "cargateview", "bankview", "authview", "adsview", "categoryview", "productview", "subcategoryview", "customerview", "orderview", "dashboardview", "companyview", "forceupdateview", "reportview");
      }
    }));

    this.use("/file", filerouter.default.init());

    var rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = [0, new schedule.Range(1, 6)];
    rule.hour = 17;
    rule.minute = 0;
    schedule.scheduleJob(rule, this.updateCustomerActive);

    // schedule.scheduleJob({ second: 10 }, this.updateCustomerActive);
    // schedule.scheduleJob({ hour: 5, minute: 30 }, this.callsendWarningNoti);
    // schedule.scheduleJob({ hour: 8, minute: 30 }, this.callsendCancelNoti);
  }

  public onUseRouter(app: express.Express): void {
    this.loadRouters("./routes/pages");
  }

  private updateCustomerActive() {
    console.log("updated customer status active ");
    const customerview = new CustomerView();
    customerview.updateCustomerActive();
  }

  // private callsendWarningNoti() {
  //   console.log("warning noti");
  //   const orderview = new OrderView();
  //   // orderview.sendWarningNoti();
  // }

  // private callsendCancelNoti() {
  //   console.log("cancel noti");
  //   const orderview = new OrderView();
  //   orderview.sendCancelNoti();
  // }
}

const app = new MainApp();
export default app.create();