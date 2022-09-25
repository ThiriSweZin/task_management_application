import { cat } from "shelljs";
/**
 * Sub Category View Model
 */
import * as RestApi from "../lib/restapi";

export class SubCategoryView {
  constructor() { }

  public index(args: any, cb: Function) {
    const data: any = {
      data: {}
    };

    RestApi.getDb("sub_category").select()
      .then((result) => {
        data.data = result;
        cb(undefined, data);
      })
      .catch((err) => {
        console.log(`${err}`);
        cb(err, undefined);
      });
  }
  /**
   * get subcategories by category or all from list - front-end
   */
  public getSubCategory(args: any, cb: Function) {

    let query: any;
    const categoryid = args.categoryid;
    console.log("categoryid ", categoryid);
    if (categoryid)
      query = { "categoryid": categoryid };
    else
      query = {};

    RestApi.getDb("sub_category")
      .leftJoin("category", "sub_category.categoryid", "category.id")
      .select("sub_category.id", "category", "sub_category")
      .where(query)
      .orderBy("sub_category.sub_category", "asc")
      .then((result) => {
        cb(undefined, { data: result });
        console.log("sub category result ", result);
      })
      .catch((err) => {
        console.log(`${err}`);
        cb(err, undefined);
      });
  }

  // public getSubCategoryByCategoryId(args: any, cb: Function) {

  //   let query: any;
  //   const categoryid = args.categoryid;
  //   console.log("categoryid ", categoryid);
  //   if (categoryid)
  //     query = { "categoryid": categoryid };
  //   else
  //     query = {};

  //   RestApi.getKnex().raw(`SELECT sub_category.id,sub_category.sub_category,category.category
  //     FROM sub_category
  //     LEFT JOIN category ON category.id = sub_category.categoryid
  //     WHERE ` + query +
  //     `ORDER BY category.category+0 ASC`)
  //     .then((result) => {
  //       cb(undefined, { data: result[0] });
  //       console.log("sub category result ", result[0]);
  //     })
  //     .catch((err) => {
  //       console.log(`${err}`);
  //       cb(err, undefined);
  //     });
  // }

  public getSubCategoryByCategoryId(args: any, cb: Function) {

    let query: any;
    const categoryid = args.categoryid;
    console.log("categoryid ", categoryid);
    if (categoryid)
      query = { "categoryid": categoryid };
    else
      query = {};

    RestApi.getDb("sub_category")
      .leftJoin("category", "sub_category.categoryid", "category.id")
      .select("sub_category.id", "category", "sub_category")
      .where(query)
      .orderBy("category.category","asc")
      .then((result) => {
        cb(undefined, { data: result });
        console.log("sub category result ", result);
      })
      .catch((err) => {
        console.log(`${err}`);
        cb(err, undefined);
      });
  }

  public checkSubcategoryName(args: any, cb: Function) {
    RestApi.getDb("sub_category")
      .where("sub_category", args.sub_categoryname)
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

export default new SubCategoryView();