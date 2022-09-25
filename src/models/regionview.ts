/**
 * Cargate
 */
import * as RestApi from "../lib/restapi";

export class RegionView {
  constructor() { }

  public getRegions(args: any, cb: Function) {

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
      })
    });
  }
}

export default new RegionView();