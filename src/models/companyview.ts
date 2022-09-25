/**
 * Company View Model
 */
import * as RestApi from "../lib/restapi";

export class CompanyView {
  constructor() { }

  public index(args: any, cb: Function) {
    const data: any = {
      data: {}
    };
    RestApi.getDb("company_info").first()
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

export default new CompanyView();