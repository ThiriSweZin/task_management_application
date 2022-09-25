/**
 * forceUpdate Model
 */
import * as RestApi from "../lib/restapi";

const AndroidInfo = {
  VersionCode: "",
  forceUpdate: false,
  // VersionName: "1.0"
};
const iOSInfo = {
  BuildNumber: "",
  forceUpdate: false,
  // VersionName: "1.1"
};



export class ForceUpdate {
  constructor() { }

  public index(args: any, cb: Function) {
    return 1;
  }

  public forceUpdateAndroid(args: any, cb: Function) {

    RestApi.getDb("forceupdate")
    .select("versioncode")
    .then((result) => {
      if(result[0].versioncode <= args.versioncode){
        AndroidInfo.forceUpdate = false;
        AndroidInfo.VersionCode = result[0].versioncode;
        cb(undefined, {
          data: AndroidInfo
        });
      } else {
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

  public forceUpdateIOS(args: any, cb: Function) {

    RestApi.getDb("forceupdate")
    .select("buildnumber")
    .then((result) => {
      if(result[0].buildnumber <= args.buildnumber){
        iOSInfo.forceUpdate = false;
        iOSInfo.BuildNumber = result[0].buildnumber;
        cb(undefined, {
          data: iOSInfo
        });
      } else {
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

export default new ForceUpdate();