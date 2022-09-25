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
const jwtCredentialId = config_json_1.default.jwt.defCredentialId;
class ForceUpdateRouter extends express_application_1.ExpressRouter {
    constructor() {
        super();
        this.route("/forceupdate").get(this.getEdit).post(this.postEdit);
    }
    getEdit(req, res, next) {
        const data = {};
        const postUrl = `/forceupdate`;
        let params = { title: config_json_1.default.appname, postUrl: postUrl, listUrl: "/forceupdate" };
        RestApi.getDb("forceupdate").first()
            .then((result) => {
            params.params = utils_1.Utils.mixin(data, result);
            res.render("dashboard/forceupdate", params);
        })
            .catch((err) => {
            console.log(`${err}`);
            next({ "error": err });
        });
    }
    postEdit(req, res, next) {
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
exports.default = new ForceUpdateRouter();
//# sourceMappingURL=forceupdate.js.map