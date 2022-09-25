/**
 * CarGate Routes
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
class CarGateRouter extends ExpressRouter {
    constructor() {
        super();

        this.route("/cargate").all(Permission.onLoad).get(this.getList);
        this.route("/cargate/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
        this.route("/cargate/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
        this.route("/cargate/delete/:id").all(Permission.onLoad).post(this.postDelete);
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
                    res.render("dashboard/cargate", params);
                })
                .catch((err: any) => {
                    next(err);
                });
        } else {
            res.render("dashboard/cargate", params);
        }
    }
    public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
        let params: any = { title: config.appname, user: req.user.username, postUrl: "/cargate/entry", params: {}, listUrl: "/cargate" };
        params = Permission.getMenuParams(params, req, res);

        if (typeof (<any>req).jwtToken == "function") {
            (<any>req).jwtToken(jwtCredentialId)
                .then((result: string) => {
                    params.token = result;
                    console.log("params ", params);
                    res.render("dashboard/cargate-entry", params);
                })
                .catch((err: any) => {
                    next(err);
                });

        } else {
            res.render("dashboard/cargate-entry", params);
        }
    }
    public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
        const data = comfunc.fillDefaultFields(req.body);
        data.id = uuid.v4();

        delete (data.cargates);

        const db = RestApi.getDb("car_gate");
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
        console.log("POST");
        const data = { id: req.params.id };
        console.log("id ", data.id);
        if (Utils.isEmpty(data.id)) {
            return comfunc.sendForbidden(next);
        }
        const postUrl = `/cargate/edit/${data.id}`;
        console.log("postUrl >>", postUrl);
        let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/cargate", params: data };
        // params.login = req.isAuthenticated();
        params = Permission.getMenuParams(params, req, res);
        console.log("params ", params);
        RestApi.getDb("car_gate")
            .leftJoin("city", "car_gate.cityid", "city.id")
            .where({ "car_gate.id": data.id })
            .select("car_gate.*", "city.cityname")
            .then((result) => {
                console.log("reslt ", result);
                params.params = Utils.mixin(data, result[0]);
                console.log("params 2", params.params);
                return RestApi.getDb("car_gate").whereNot("id", data.id).select();
            })
            .then((result) => {
                params.cargates = result;
                console.log("params 3", params.params);
                if (typeof (<any>req).jwtToken == "function") {
                    return (<any>req).jwtToken(jwtCredentialId);
                } else {
                    return Promise.resolve("");
                }
            })
            .then((result) => {
                params.token = result;
                console.log("params 4", params.params);
                res.render("dashboard/cargate-entry", params);
            })
            .catch((err) => {
                console.log(`${err}`);
                next({ "error": err });
            });
    }
    public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
        const data = comfunc.fillDefaultFields(req.body);
        delete (data.cargates);

        let db = RestApi.getDb("car_gate");
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
    public postDelete(req: express.Request, res: express.Response, next: express.NextFunction) {
        const data = { id: req.params.id };
        if (Utils.isEmpty(data.id)) {
            return comfunc.sendForbidden(res);
        }
        RestApi.getDb("car_gate").where({ id: data.id }).delete("id")
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

export default new CarGateRouter();