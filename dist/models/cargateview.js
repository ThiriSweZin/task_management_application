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
 * Cargate
 */
const RestApi = __importStar(require("../lib/restapi"));
class CargateView {
    constructor() { }
    index(args, cb) {
        cb(undefined, {
            error: {
                message: "Not Working..."
            }
        });
    }
    getCargateList(args, cb) {
        const customerid = args.customerid;
        const data = {
            data: {}
        };
        RestApi.getDb("car_gate")
            .leftJoin("customer", "car_gate.cityid", "customer.cityid")
            .where({ "customer.id": customerid })
            .select("car_gate.id", "car_gate.cargatename")
            .then((result) => {
            data.data = result;
            cb(undefined, data);
            console.log("cargate name result ", result);
        })
            .catch((err) => {
            console.log(`${err}`);
            cb(err, undefined);
        });
    }
    checkCargateName(args, cb) {
        console.log("cargate args ", args);
        RestApi.getDb("car_gate")
            .where("cargatename", args.cargatename)
            .andWhere("cityid", args.cityid)
            .andWhere("id", "!=", args.recordid)
            .select()
            .then((result) => {
            console.log("cargate view ", result);
            if (result.length > 0)
                cb(undefined, true);
            else
                cb(undefined, false);
        })
            .catch((err) => {
            cb(undefined, {
                error: {
                    message: err.message || "Check Error"
                }
            });
        });
    }
}
exports.CargateView = CargateView;
exports.default = new CargateView();
//# sourceMappingURL=cargateview.js.map