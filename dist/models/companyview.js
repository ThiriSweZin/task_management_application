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
 * Company View Model
 */
const RestApi = __importStar(require("../lib/restapi"));
class CompanyView {
    constructor() { }
    index(args, cb) {
        const data = {
            data: {}
        };
        RestApi.getDb("company_info").first()
            .then((result) => {
            data.data = result;
            cb(undefined, data);
        })
            .catch((err) => {
            console.log(`${err}`);
            cb(err, undefined);
        });
    }
}
exports.CompanyView = CompanyView;
exports.default = new CompanyView();
//# sourceMappingURL=companyview.js.map