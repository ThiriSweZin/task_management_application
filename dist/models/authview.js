"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Auth
 */
const RestApi = __importStar(require("../lib/restapi"));
const uuid = __importStar(require("uuid"));
const utils_1 = require("../lib/utils");
class Auth {
    constructor() { }
    index(args, cb) {
        cb(undefined, {
            error: {
                message: "Not Working..."
            }
        });
    }
    login(args, cb) {
        const id = uuid.v4();
        const data = {
            id: id,
            customerid: "",
            firebase_token: args.firebase_token,
            createddate: utils_1.Utils.toSqlDate(new Date()),
            updateddate: utils_1.Utils.toSqlDate(new Date())
        };
        console.log("args.password", args.password);
        RestApi.getDb("customer")
            .where({ "username": args.username, "password": args.password, "is_active": 1 })
            .select()
            .then((result) => {
            console.log("customer data ", result);
            if (result.length > 0) {
                cb(undefined, {
                    success: {
                        id: result[0].id,
                        message: "Login Successful"
                    }
                });
                RestApi.getDb("customer_values").where({ "customerid": result[0].id }).select()
                    .then((old_customer) => {
                    if (old_customer.length == 0) {
                        data.customerid = result[0].id;
                        return RestApi.getDb("customer_values").insert(data);
                    }
                    else {
                        return RestApi.getDb("customer_values").update({ "firebase_token": args.firebase_token }, "id")
                            .where({ "customerid": result[0].id });
                    }
                });
            }
            else {
                cb(undefined, {
                    success: {
                        id: result[0].id,
                        message: "Login Failed!"
                    }
                });
            }
        })
            .catch((err) => {
            cb(undefined, {
                error: {
                    message: "Login Failed"
                }
            });
        });
    }
    refreshToken(args, cb) {
        const customerid = args.customerid;
        const firebase_token = args.firebase_token;
        RestApi.getDb("customer_values").where({ "customerid": customerid }).select()
            .then((result) => {
            console.log("then");
            cb(undefined, {
                data: result[0].id
            });
            if (result && result.length != 0) {
                return RestApi.getDb("customer_values")
                    .update({ "firebase_token": firebase_token }, "id")
                    .where({ "customerid": customerid });
            }
        })
            .catch((err) => {
            console.log("catch");
            cb(undefined, {
                error: {
                    message: err.message || "Is Exists error"
                }
            });
        });
    }
}
exports.Auth = Auth;
exports.default = new Auth();
//# sourceMappingURL=authview.js.map