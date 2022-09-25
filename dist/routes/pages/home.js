"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_application_1 = require("../../lib/express-application");
class HomeRouter extends express_application_1.ExpressRouter {
    constructor() {
        super();
        this.get("/", this.getHome);
    }
    getHome(req, res, next) {
        res.redirect("/login");
    }
}
exports.default = new HomeRouter();
//# sourceMappingURL=home.js.map