"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_application_1 = require("../../lib/express-application");
const utils_1 = require("../../lib/utils");
const config_json_1 = __importDefault(require("../../../data/config.json"));
const RestApi = __importStar(require("../../lib/restapi"));
const comfunc = __importStar(require("../../lib/comfunc"));
const uuid = __importStar(require("uuid"));
const permission_1 = require("../../lib/permission");
const jwtCredentialId = config_json_1.default.jwt.defCredentialId;
class UserRoleRouter extends express_application_1.ExpressRouter {
    constructor() {
        super();
        this.route("/user-role").all(permission_1.Permission.onLoad).get(this.getList);
        this.route("/user-role/entry").all(permission_1.Permission.onLoad).get(this.getEntry).post(this.postEntry);
        this.route("/user-role/edit/:id").all(permission_1.Permission.onLoad).get(this.getEdit).post(this.postEdit);
        this.route("/user-role/delete/:id").all(permission_1.Permission.onLoad).post(this.postDelete);
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
        let params = { title: config_json_1.default.appname, user: req.user.username };
        params = permission_1.Permission.getMenuParams(params, req, res);
        if (typeof req.jwtToken == "function") {
            req.jwtToken(jwtCredentialId)
                .then((result) => {
                params.token = result;
                res.render("dashboard/user-role", params);
            })
                .catch((err) => {
                next(err);
            });
        }
        else {
            res.render("dashboard/user-role", params);
        }
    }
    getEntry(req, res, next) {
        let params = { title: config_json_1.default.appname, user: req.user.username, postUrl: "/user-role/entry", params: {}, listUrl: "/user-role" };
        params = permission_1.Permission.getMenuParams(params, req, res);
        RestApi.getDb("program").select()
            .then((result) => {
            params.items = result;
            return RestApi.getDb("user_role").select();
        })
            .then((result) => {
            params.orirole = result;
            console.log("params ", params);
            if (typeof req.jwtToken == "function") {
                return req.jwtToken(jwtCredentialId);
            }
            else {
                res.render("dashboard/user-role-entry", params);
            }
        })
            .then((result) => {
            params.token = result;
            res.render("dashboard/user-role-entry", params);
        })
            .catch((err) => {
            next(err);
        });
    }
    postEntry(req, res, next) {
        const data = comfunc.fillDefaultFields(req.body);
        console.log("data ", data);
        const role_data = {
            id: uuid.v4(),
            role: data.role,
            description: data.description || "",
            selectall: data.select_all == "on" ? 1 : 0,
            createddate: utils_1.Utils.toSqlDate(new Date()),
            updateddate: utils_1.Utils.toSqlDate(new Date())
        };
        const queries = [];
        console.log("IS ARRAY ==>" + Array.isArray(data.programid));
        let insertQuery = "INSERT INTO `user_role_item`(`id`, `roleid`, `programid`, `read`, `write`, `delete`, `createddate`, `updateddate`) VALUES ";
        if (Array.isArray(data.programid)) {
            for (let i = 0; i < data.programid.length; i++) {
                console.log("PROGRAM ID --> ", data.programid[i]);
                const _read = data["read_" + data.programid[i]] == "on" ? 1 : 0;
                const _write = data["write_" + data.programid[i]] == "on" ? 1 : 0;
                const _delete = data["delete_" + data.programid[i]] == "on" ? 1 : 0;
                const item_query = "(UUID(), '" + role_data.id + "', '" + data.programid[i] + "', " + _read + ", " + _write + ", " + _delete + ", '" + role_data.createddate + "', '" + utils_1.Utils.toSqlDate(new Date()) + "')";
                queries.push(item_query);
            }
        }
        insertQuery += queries.join(",") + ";";
        // console.log(insertQuery);
        const db = RestApi.getDb("user_role");
        console.log("role data ", role_data);
        db.insert(role_data, "id")
            .then((result) => {
            return RestApi.getKnex().raw(insertQuery);
        })
            .then((result) => {
            res.json({ "success": result });
        })
            .catch((err) => {
            console.log(`${err}`);
            res.json({ "error": err });
        });
    }
    getEdit(req, res, next) {
        const self = this;
        // return function (req: express.Request, res: express.Response, next: express.NextFunction) {
        const data = { id: req.params.id };
        let role_data = {};
        if (utils_1.Utils.isEmpty(data.id)) {
            return comfunc.sendForbidden(next);
        }
        let params = { title: config_json_1.default.appname, user: req.user.username, listUrl: "/user-role", params: data };
        params = permission_1.Permission.getMenuParams(params, req, res);
        RestApi.getDb("user_role").where({ id: data.id }).select()
            .then((result) => {
            role_data = result[0];
            return RestApi.getDb().columns("program.*", "user_role_item.read", "user_role_item.write", "user_role_item.delete")
                .select()
                .from("program")
                .leftJoin("user_role_item", "user_role_item.programid", "program.id")
                .where({ "user_role_item.roleid": data.id });
            // return RestApi.getDb("program").select();
        })
            .then((result) => {
            params.params = utils_1.Utils.mixin(data, role_data);
            params.items = result;
            if (typeof req.jwtToken == "function") {
                return req.jwtToken(jwtCredentialId);
            }
            else {
                return Promise.resolve("");
            }
        })
            .then((result) => {
            params.token = result;
            res.render("dashboard/user-role-entry", params);
        })
            .catch((err) => {
            console.log(`${err}`);
            next({ "error": err });
        });
        // };
    }
    postEdit(req, res, next) {
        const data = comfunc.fillDefaultFields(req.body);
        console.log("data ", data);
        if (utils_1.Utils.isEmpty(data.id)) {
            return comfunc.sendForbidden(res);
        }
        const role_data = {
            role: data.role,
            description: data.description || "",
            selectall: data.select_all == "on" ? 1 : 0,
            updated_date: data.updated_date
        };
        const queries = [];
        const deleteQuery = (data.id != "") ? "DELETE FROM `user_role_item` WHERE `roleid` = '" + data.id + "';" : "";
        let createddate = utils_1.Utils.toSqlDate(new Date());
        console.log("IS ARRAY ==>" + Array.isArray(data.programid));
        let insertQuery = "INSERT INTO `user_role_item`(`id`, `roleid`, `programid`, `read`, `write`, `delete`, `createddate`, `updateddate`) VALUES ";
        if (Array.isArray(data.programid)) {
            for (let i = 0; i < data.programid.length; i++) {
                if (data.createddate != "") {
                    createddate = data.createddate;
                }
                console.log("PROGRAM ID --> ", data.programid[i]);
                const _read = data["read_" + data.programid[i]] == "on" ? 1 : 0;
                const _write = data["write_" + data.programid[i]] == "on" ? 1 : 0;
                const _delete = data["delete_" + data.programid[i]] == "on" ? 1 : 0;
                const item_query = "(UUID(), '" + data.id + "', '" + data.programid[i] + "', " + _read + ", " + _write + ", " + _delete + ", '" + createddate + "', '" + utils_1.Utils.toSqlDate(new Date()) + "')";
                queries.push(item_query);
            }
        }
        insertQuery += queries.join(",") + ";";
        // console.log(insertQuery);
        const db = RestApi.getDb("user_role").where({ id: data.id });
        delete (data.id);
        db.update(role_data, "id")
            .then((result) => {
            return RestApi.getKnex().raw(deleteQuery);
        })
            .then((result) => {
            return RestApi.getKnex().raw(insertQuery);
        })
            .then((result) => {
            res.json({ "success": result });
        })
            .catch((err) => {
            console.log(`${err}`);
            res.json({ "error": err });
        });
    }
    postDelete(req, res, next) {
        const data = { id: req.params.id };
        if (utils_1.Utils.isEmpty(data.id)) {
            return comfunc.sendForbidden(res);
        }
        RestApi.getDb("user").where("roleid", data.id)
            .then((user) => {
            if (user.length > 0) {
                throw new Error("Can not delete.");
            }
            else {
                return RestApi.getDb("user_role").where({ id: data.id }).delete();
            }
        })
            .then((delete_role) => {
            return RestApi.getDb("user_role_item").where({ roleid: data.id }).delete();
        })
            .then((delete_role_item) => {
            res.json({ "success": delete_role_item });
        })
            .catch((err) => {
            console.log(`${err}`);
            res.json({ "error": err });
        });
        // let db = RestApi.getDb("user_role");
        // db = db.where({ id: data.id });
        // db.delete("id")
        //   .then((result) => {
        //     return RestApi.getDb("user_role_item").where({ roleid: data.id }).delete("id");
        //   })
        //   .then((result) => {
        //     res.json({ "success": result });
        //   })
        //   .catch((err) => {
        //     console.log(`${err}`);
        //     res.json({ "error": err });
        //   });
    }
    setMenuParams(params, req, res) {
        params.login = req.isAuthenticated();
        params.permission = res.locals.permission;
        if (typeof req.jwtToken == "function") {
            return req.jwtToken(jwtCredentialId);
        }
        else {
            return Promise.resolve("");
        }
    }
}
exports.default = new UserRoleRouter();
//# sourceMappingURL=user-role.js.map