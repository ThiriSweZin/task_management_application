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
 * Notification View
 */
const RestApi = __importStar(require("../lib/restapi"));
class NotificationView {
    constructor() { }
    getNotification(args, cb) {
        RestApi.getDb("notification")
            .where("title", args.title)
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
exports.NotificationView = NotificationView;
exports.default = new NotificationView();
//# sourceMappingURL=notificationview.js.map