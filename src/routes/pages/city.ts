/**
 * City Routes
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

class CityRouter extends ExpressRouter {
    constructor() {
        super();

        this.route("/city").all(Permission.onLoad).get(this.getList);
        this.route("/city/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
        this.route("/city/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
        this.route("/city/delete/:id").all(Permission.onLoad).post(this.postDelete);
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
                    res.render("dashboard/city", params);
                })
                .catch((err: any) => {
                    next(err);
                });

        } else {
            res.render("dashboard/city", params);
        }
    }
    public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
        let params: any = { title: config.appname, user: req.user.username, postUrl: "/city/entry", params: {}, listUrl: "/city" };
        console.log("params >>", params);
        params = Permission.getMenuParams(params, req, res);
        RestApi.getDb("city").select('cityname')
            .then((result) => {
                params.cities = result;
                if (typeof (<any>req).jwtToken == "function") {
                    return (<any>req).jwtToken(jwtCredentialId);
                } else {
                    res.render("dashboard/city_entry", params);
                }
            })
            .then((result: string) => {
                params.token = result;
                res.render("dashboard/city_entry", params);
            })
            .catch((err: any) => {
                next(err);
            });

    }
    public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
        const data = comfunc.fillDefaultFields(req.body);
        data.id = uuid.v4();

        delete (data.cities);

        const db = RestApi.getDb("city");
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
        const postUrl = `/city/edit/${data.id}`;
        let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/city", params: data };
        params = Permission.getMenuParams(params, req, res);

        RestApi.getDb("city")
            .leftJoin("region", "city.regionid", "region.id")
            .where({ "city.id": data.id })
            .select("city.*", "region.region")
            .then((result) => {
                console.log("reslt ", result);
                params.params = Utils.mixin(data, result[0]);
                console.log("params 2", params.params);
                return RestApi.getDb("city").whereNot("id", data.id).select();
            })
            .then((result) => {
                params.cities = result;
                console.log("cities>>", params.cities);
                if (typeof (<any>req).jwtToken == "function") {
                    return (<any>req).jwtToken(jwtCredentialId);
                } else {
                    return Promise.resolve("");
                }
            })
            .then((result) => {
                params.token = result;
                console.log("params tocken >>", params);
                res.render("dashboard/city_entry", params);
            })
            .catch((err) => {
                console.log(`${err}`);
                next({ "error": err });
            });
    }


    public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
        const data = comfunc.fillDefaultFields(req.body);

        let db = RestApi.getDb("city");
        if (Utils.isEmpty(data.id)) {
            return comfunc.sendForbidden(res);
        }
        db = db.where({ id: data.id });
        delete (data.id);
        delete (data.cities);
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
        let customerCity: any = {};
        if (Utils.isEmpty(data.id)) {
            return comfunc.sendForbidden(res);
        }

        RestApi.getDb("customer").where({ cityid: data.id }).first()
        .then((result) => {
            customerCity = result;
            return RestApi.getDb("car_gate").where({ cityid: data.id }).first();
        })
        .then((result) => {
            if(result || customerCity){
                throw new Error("Cannot delete. Already Used!");
            } else {
                return RestApi.getDb("city").where({ id: data.id }).delete("id");
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
}
export default new CityRouter();
