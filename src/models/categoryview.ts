/**
 * Category View Model
 */
import * as RestApi from "../lib/restapi";

export class CategoryView {
  constructor() { }

  public index(args: any, cb: Function) {
    const data: any = {
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
export default new CategoryView();