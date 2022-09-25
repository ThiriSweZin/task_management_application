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
 * Bank View Model
 */
const RestApi = __importStar(require("../lib/restapi"));
class BankView {
    constructor() { }
    index(args, cb) {
        const data = {
            data: []
        };
        RestApi.getDb("bank").select()
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
exports.BankView = BankView;
exports.default = new BankView();
//# sourceMappingURL=bankview.js.map