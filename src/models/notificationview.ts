/**
 * Notification View
 */
import * as RestApi from "../lib/restapi";

export class NotificationView {
  constructor() { }

  public getNotification(args: any, cb: Function) {

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
      })
    });
  }
}

export default new NotificationView();