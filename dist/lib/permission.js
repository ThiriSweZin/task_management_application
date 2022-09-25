"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Permission {
    constructor() { }
    static onLoad(req, res, next) {
        console.log("permission load");
        if (req.isAuthenticated()) {
            res.redirect(`/login?url=${req.url}`);
        }
        else {
            res.redirect(`/login?url=${req.url}`);
        }
    }
    checkPermission(user) {
        // comming soon
        return true;
    }
    static getMenuParams(params, req, res) {
        // console.log("permission getMenuParams");
        params.login = req.isAuthenticated();
        // console.log("login ", params.login);
        params.permission = res.locals.permission;
        // console.log("permission ", params.permission);
        // if (typeof (<any>req).jwtToken == "function") {
        //   params.csrfToken = (<any>req).csrfToken();
        // }
        return params;
    }
}
exports.Permission = Permission;
//# sourceMappingURL=permission.js.map