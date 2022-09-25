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
 * Category View Model
 */
const RestApi = __importStar(require("../lib/restapi"));
class CategoryView {
    constructor() { }
    index(args, cb) {
        const data = {
            data: {}
        };
        RestApi.getDb("category").select().orderBy("no", "asc")
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
exports.CategoryView = CategoryView;
exports.default = new CategoryView();
//# sourceMappingURL=categoryview.js.map