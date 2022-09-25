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
 * Dashboard View Model
 */
const RestApi = __importStar(require("../lib/restapi"));
class DashboardView {
    constructor() { }
    order(args, cb) {
        const data = {
            data: []
        };
        RestApi.getKnex()
            .raw("\
        SELECT status,COUNT(*) as count\
        FROM `order` \
        GROUP BY `status`\
        ")
            .then((result) => {
            data.data = result[0];
            return RestApi.getKnex()
                .raw("\
                SELECT COUNT(*) as count\
                FROM `feedback` \
                WHERE `createddate` = CURDATE() \
                ");
        })
            .then((result) => {
            data.feedback = result[0];
            cb(undefined, data);
        })
            .catch((err) => {
            cb(err, data);
        });
    }
}
exports.DashboardView = DashboardView;
exports.default = new DashboardView();
//# sourceMappingURL=dashboardview.js.map