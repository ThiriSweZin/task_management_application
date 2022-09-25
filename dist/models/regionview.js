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
class RegionView {
    constructor() { }
    getRegions(args, cb) {
        RestApi.getDb("region")
            .where("region", args.region)
            .andWhere("id", "!=", args.recordid)
            .select()
            .then((result) => {
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
exports.RegionView = RegionView;
exports.default = new RegionView();
//# sourceMappingURL=regionview.js.map