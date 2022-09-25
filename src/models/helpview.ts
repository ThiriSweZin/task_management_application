/**
 * Help View Model
 */
import * as RestApi from "../lib/restapi";

export class HelpView {
  constructor() { }

  public index(args: any, cb: Function) {
    cb(undefined, {
      error: {
        message: "Not Working..."
      }
    });
  }

  public getHelpview(args: any, cb: Function) {
    RestApi.getDb("help")
    .first()
    .then((result) => {
      console.log("result >>", result);
      cb(undefined, { data: result });
    })
    .catch((err) => {
      cb(undefined, {
        error: {
          message: err.message || "Get HelpView Error."
        }
      });
    });
  }
}
export default new HelpView();