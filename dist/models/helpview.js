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
 * Help View Model
 */
const RestApi = __importStar(require("../lib/restapi"));
class HelpView {
    constructor() { }
    index(args, cb) {
        cb(undefined, {
            error: {
                message: "Not Working..."
            }
        });
    }
    getHelpview(args, cb) {
        RestApi.getDb("help")
            .first()
            .then((result) => {
            console.log("result >>", result);
            cb(undefined, { data: result });
        })
            .catch((err) => {
            cb(undefined, {
                error: {
                    message: err.message || "Get HelpView Error."
                }
            });
        });
    }
}
exports.HelpView = HelpView;
exports.default = new HelpView();
//# sourceMappingURL=helpview.js.map