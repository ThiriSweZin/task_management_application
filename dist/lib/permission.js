"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const RestApi = __importStar(require("./restapi"));
class Permission {
    constructor() { }
    // 0: dashboard_Menu | 1: manage_user_Menu | 2: general_Menu | 3: main_Menu | 4: categories_Menu
    static onLoad(req, res, next) {
        // console.log("permission load");
        const dashboard = [], manage_user = [], general = [], info = [], customer = [], order = [], report = [];
        const seperator = new RegExp(["\\\/", "\\\?"].join("|"), "g");
        const proCome = req.url.replace("/", "").split(seperator)[0];
        console.log(proCome);
        let proGive;
        if (req.isAuthenticated()) {
            if (req.user.id == 0) {
                console.log("user -1 ");
                (() => __awaiter(this, void 0, void 0, function* () {
                    yield RestApi.getDb("program").select()
                        .then((result) => {
                        for (const i in result) {
                            result[i].read = 1;
                            result[i].write = 1;
                            result[i].delete = 1;
                            switch (result[i].menu_no) {
                                case 0:
                                    dashboard.push(result[i]);
                                    break;
                                case 1:
                                    general.push(result[i]);
                                    break;
                                case 2:
                                    manage_user.push(result[i]);
                                    break;
                                case 3:
                                    info.push(result[i]);
                                    break;
                                case 4:
                                    customer.push(result[i]);
                                    break;
                                case 5:
                                    order.push(result[i]);
                                    break;
                                case 6:
                                    report.push(result[i]);
                                    break;
                                default: break;
                            }
                        }
                        proGive = result.find((pp) => {
                            return pp.program == proCome;
                        });
                    })
                        .catch((err) => {
                        console.log(`${err}`);
                    });
                    // console.log("-1 == ProGive : ", proGive);
                    res.locals.permission = {
                        dashboard: dashboard,
                        manage: manage_user,
                        general: general,
                        info: info,
                        customer: customer,
                        order: order,
                        report: report,
                        access: proGive.read + "," + proGive.write + "," + proGive.delete
                    };
                    yield next();
                }))();
            }
            else {
                (() => __awaiter(this, void 0, void 0, function* () {
                    yield RestApi.getDb("user").columns("roleid").where({ id: req.user.id }).select()
                        .then((result) => {
                        return RestApi.getDb().columns("program.*", "user_role_item.read", "user_role_item.write", "user_role_item.delete")
                            .select()
                            .from("program")
                            .leftJoin("user_role_item", "user_role_item.programid", "program.id")
                            .where({ "user_role_item.roleid": result[0].roleid });
                    })
                        .then((result) => {
                        // console.log("result ", result);
                        for (const i in result) {
                            if (!(result[i].read == 0 && result[i].write == 0 && result[i].delete == 0)) {
                                switch (result[i].menu_no) {
                                    case 0:
                                        dashboard.push(result[i]);
                                        break;
                                    case 1:
                                        general.push(result[i]);
                                        break;
                                    case 2:
                                        manage_user.push(result[i]);
                                        break;
                                    case 3:
                                        info.push(result[i]);
                                        break;
                                    case 4:
                                        customer.push(result[i]);
                                        break;
                                    case 5:
                                        order.push(result[i]);
                                        break;
                                    case 6:
                                        report.push(result[i]);
                                        break;
                                    default: break;
                                }
                                proGive = result.find((pp) => {
                                    return pp.program == proCome;
                                });
                            }
                        }
                        // console.log("general ", general);
                        // console.log(req.user.id + "ProGive : ", proGive);
                    })
                        .catch((err) => {
                        console.log(`${err}`);
                    });
                    res.locals.permission = {
                        dashboard: dashboard,
                        manage: manage_user,
                        general: general,
                        info: info,
                        customer: customer,
                        order: order,
                        report: report,
                        access: proGive.read + "," + proGive.write + "," + proGive.delete
                    };
                    yield next();
                }))();
            }
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