/**
 * Ads View Model
 */
import * as RestApi from "../lib/restapi";

export class AdsView {
  constructor() { }

  public index(args: any, cb: Function) {
    RestApi.getDb("ads").where({status: 1}).select()
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
export default new AdsView();