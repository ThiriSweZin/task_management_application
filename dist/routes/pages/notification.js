"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid = __importStar(require("uuid"));
const express_application_1 = require("../../lib/express-application");
const utils_1 = require("../../lib/utils");
const config_json_1 = __importDefault(require("../../../data/config.json"));
const RestApi = __importStar(require("../../lib/restapi"));
const comfunc = __importStar(require("../../lib/comfunc"));
const permission_1 = require("../../lib/permission");
const firebase_msg_1 = require("../../lib/firebase-msg");
const jwtCredentialId = config_json_1.default.jwt.defCredentialId;
class NotificationRouter extends express_application_1.ExpressRouter {
    constructor() {
        super();
        this.route("/notification").all(permission_1.Permission.onLoad).get(this.getList);
        this.route("/notification/entry").all(permission_1.Permission.onLoad).get(this.getEntry).post(this.postEntry);
        this.route("/notification/edit/:id").all(permission_1.Permission.onLoad).get(this.getEdit).post(this.postEdit);
        this.route("/notification/delete/:id").all(permission_1.Permission.onLoad).post(this.postDelete);
    }
    onLoad(req, res, next) {
        if (req.isAuthenticated()) {
            next();
        }
        else {
            res.redirect(`/login?url=${req.url}`);
        }
    }
    getList(req, res, next) {
        const params = { title: config_json_1.default.appname, user: req.user.username };
        params.login = req.isAuthenticated();
        if (typeof req.jwtToken == "function") {
            req.jwtToken(jwtCredentialId)
                .then((result) => {
                params.token = result;
                res.render("dashboard/notification", params);
            })
                .catch((err) => {
                next(err);
            });
        }
        else {
            res.render("dashboard/notification", params);
        }
    }
    getEntry(req, res, next) {
        let params = { title: config_json_1.default.appname, postUrl: "/notification/entry", params: {}, listUrl: "/notification" };
        params = permission_1.Permission.getMenuParams(params, req, res);
        if (typeof req.jwtToken == "function") {
            req.jwtToken(jwtCredentialId)
                .then((result) => {
                params.token = result;
                res.render("dashboard/notification-entry", params);
            })
                .catch((err) => {
                next(err);
            });
        }
        else {
            res.render("dashboard/notification-entry", params);
        }
    }
    postEntry(req, res, next) {
        const data = comfunc.fillDefaultFields(req.body);
        const noti = new firebase_msg_1.Notification();
        let noti_data;
        console.log("post entry data d>>", data);
        data.id = uuid.v4();
        data.date = utils_1.Utils.toSqlDateTime(new Date());
        delete (data.notification);
        const db = RestApi.getDb("notification");
        db.insert(data, "id")
            .then((result) => {
            return RestApi.getDb("notification")
                .select("title", "description", "date")
                .where({ "notification.id": data.id })
                .first();
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
    getEdit(req, res, next) {
        const data = { id: req.params.id };
        if (utils_1.Utils.isEmpty(data.id)) {
            return comfunc.sendForbidden(next);
        }
        const postUrl = `/notification/edit/${data.id}`;
        let params = { title: config_json_1.default.appname, user: req.user.username, postUrl: postUrl, listUrl: "/notification" };
        params = permission_1.Permission.getMenuParams(params, req, res);
        RestApi.getDb("notification").where({ id: data.id }).select()
            .then((result) => {
            // result[0].date = Utils.toDisplayDate(result[0].date);
            params.params = utils_1.Utils.mixin(data, result[0]);
            if (typeof req.jwtToken == "function") {
                return req.jwtToken(jwtCredentialId);
            }
            else {
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
    postEdit(req, res, next) {
        const data = comfunc.fillDefaultFields(req.body);
        data.date = utils_1.Utils.toSqlDateTime(new Date());
        const noti = new firebase_msg_1.Notification();
        let noti_data;
        let db = RestApi.getDb("notification");
        if (utils_1.Utils.isEmpty(data.id)) {
            return comfunc.sendForbidden(res);
        }
        db = db.where({ id: data.id });
        db.update(data, "id")
            .then((result) => {
            return RestApi.getDb("notification")
                .select("title", "description", "date")
                .where({ "notification.id": data.id })
                .first();
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
    postDelete(req, res, next) {
        const data = { id: req.params.id };
        console.log("data >>", data);
        if (utils_1.Utils.isEmpty(data.id)) {
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
exports.default = new NotificationRouter();
//# sourceMappingURL=notification.js.map