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
 * forceUpdate Model
 */
const RestApi = __importStar(require("../lib/restapi"));
const AndroidInfo = {
    VersionCode: "",
    forceUpdate: false,
};
const iOSInfo = {
    BuildNumber: "",
    forceUpdate: false,
};
class ForceUpdate {
    constructor() { }
    index(args, cb) {
        return 1;
    }
    forceUpdateAndroid(args, cb) {
        RestApi.getDb("forceupdate")
            .select("versioncode")
            .then((result) => {
            if (result[0].versioncode <= args.versioncode) {
                AndroidInfo.forceUpdate = false;
                AndroidInfo.VersionCode = result[0].versioncode;
                cb(undefined, {
                    data: AndroidInfo
                });
            }
            else {
                AndroidInfo.forceUpdate = true;
                AndroidInfo.VersionCode = result[0].versioncode;
                cb(undefined, {
                    data: AndroidInfo
                });
            }
        })
            .catch((err) => {
            cb(undefined, err);
        });
    }
    forceUpdateIOS(args, cb) {
        RestApi.getDb("forceupdate")
            .select("buildnumber")
            .then((result) => {
            if (result[0].buildnumber <= args.buildnumber) {
                iOSInfo.forceUpdate = false;
                iOSInfo.BuildNumber = result[0].buildnumber;
                cb(undefined, {
                    data: iOSInfo
                });
            }
            else {
                iOSInfo.forceUpdate = true;
                iOSInfo.BuildNumber = result[0].buildnumber;
                cb(undefined, {
                    data: iOSInfo
                });
            }
        })
            .catch((err) => {
            cb(undefined, err);
        });
    }
}
exports.ForceUpdate = ForceUpdate;
exports.default = new ForceUpdate();
//# sourceMappingURL=forceupdateview.js.map