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
 * Ads View Model
 */
const RestApi = __importStar(require("../lib/restapi"));
class AdsView {
    constructor() { }
    index(args, cb) {
        RestApi.getDb("ads").where({ status: 1 }).select()
            .then((result) => {
            cb(undefined, {
                data: result
            });
        })
            .catch((err) => {
            cb(undefined, {
                error: {
                    message: err.message || "Get ads error."
                }
            });
        });
    }
}
exports.AdsView = AdsView;
exports.default = new AdsView();
//# sourceMappingURL=adsview.js.map