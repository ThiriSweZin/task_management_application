/**
 * Customer
 */
import * as RestApi from "../lib/restapi";
import * as uuid from "uuid";
import { Utils } from "../lib/utils";
import * as schedule from "node-schedule";
import moment from "moment";

export class CustomerView {
  constructor() { }

  public index(args: any, cb: Function) {
    cb(undefined, {
      error: {
        message: "Not Working..."
      }
    });
  }

  public getCustomerList(args: any, cb: Function) {
    const data: any = {
      data: {}
    };

    RestApi.getDb("customer")
      .leftJoin("city", "customer.cityid", "city.id")
      .select("customer.*", "city.cityname")
      .orderBy("createddate", "desc")
      .then((result) => {
        data.data = result;
        cb(undefined, data);
        // console.log("customer list result ", result);
      })
      .catch((err) => {
        console.log(`${err}`);
        cb(err, undefined);
      });
  }

  public customerInfo(args: any, cb: Function) {
    let data: any = {};

    RestApi.getDb("customer")
      .select("customer.imageurl", "customer.name", "customer.mobile", "customer.phone", "customer.address")
      .where({ "id": args.customerid })
      .first()
      .then((result) => {
        data = result;
        cb(undefined, data);
        console.log("new order customer-info ", result);
      })
      .catch((err) => {
        console.log(`${err}`);
        cb(err, undefined);
      });
  }

  public changepassword(args: any, cb: Function) {
    console.log("args.customerid ", args.customerid);
    console.log("old password ", args.oldpassword);
    console.log("new password ", args.newpassword);
    RestApi.getDb("customer")
      .where({ "id": args.customerid, "password": args.oldpassword })
      .select("customer.id", "customer.name", "customer.password")
      .first()
      .then((result_old) => {
        if (result_old && result_old != "") {
          return RestApi.getDb("customer").update({ "password": args.newpassword, "updateddate": Utils.toSqlDate(new Date()) }).where({ "id": args.customerid, "password": args.oldpassword })
            .then((result_customer) => {
              cb(undefined, {
                success: {
                  id: args.customerid,
                  data: result_customer,
                  message: " Password Change successful",
                }
              });
            });
        }
        else {
          cb(undefined, {
            success: {
              message: " Error ",
            }
          });
        }
      })
      .catch((err: any) => {
        cb(undefined, {
          error: {
            message: err.message || " Error "
          }
        });
      });

  }

  public favorite(args: any, cb: Function) {
    const id = uuid.v4();
    const data = {
      id: id,
      customerid: args.customerid,
      productid: args.productid,
      date: args.date || Utils.toSqlDate(new Date()),
      createddate: Utils.toSqlDate(new Date()),
      updateddate: Utils.toSqlDate(new Date())
    };
    console.log("favorite add data >>", data);
    if (Utils.isEmpty(data.customerid)) {
      return cb(undefined, {
        error: {
          message: "customerid can not blank."
        }
      });
    }

    if (Utils.isEmpty(data.productid)) {
      return cb(undefined, {
        error: {
          message: "productid can not blank."
        }
      });
    }

    RestApi.getDb("customer_favorite")
      .insert(data)
      .then((result) => {
        cb(undefined, {
          success: {
            message: "Success Favorite Insert",
            id: id
          }
        });
      })
      .catch((err) => {
        cb(undefined, {
          error: {
            message: err.message || "Favourite error"
          }
        });
      });
  }

  public removeFavorite(args: any, cb: Function) {
    let dbQuery = RestApi.getDb("customer_favorite");
    dbQuery = dbQuery.where({ customerid: args.customerid, productid: args.productid });
    dbQuery.delete()
      .then((result) => {
        cb(undefined, {
          success: { message: "Success Delete." }
        });
      })
      .catch((err) => {
        cb(undefined, {
          error: {
            message: err.message || "Remove favorite error"
          }
        });
      });
  }

  public favoriteList(args: any, cb: Function) {
    if (Utils.isEmpty(args.customerid)) {
      return cb(undefined, {
        error: {
          message: "customerid can not blank."
        }
      });
    }
    const data: any = {
      data: []
    };
    RestApi.getDb("customer_favorite")
      .leftJoin("customer", "customer_favorite.customerid", "customer.id")
      .leftJoin("product", "customer_favorite.productid", "product.id")
      .leftJoin("category", "product.categoryid", "category.id")
      .leftJoin("sub_category", "product.subcategoryid", "sub_category.id")
      .where("customerid", args.customerid)
      .select("product.*", "category", "sub_category")
      .then((result) => {
        data.data = result;
        console.log("favoriteList >>", data.data);
        if (data.data.length > 0) {
          data.data.forEach((cutdata: any) => {
            console.log("favoriteList product id >>", cutdata.productname);
            console.log("favoriteList category id >>", cutdata.category);
            console.log("favoriteList sub_category id >>", cutdata.sub_category);
          });
        }
        cb(undefined, {
          data: result
        });
      })
      .catch((err) => {
        cb(undefined, {
          error: {
            message: err.message || "Favourite List Error."
          }
        });
      });
  }

  public getFeedback(args: any, cb: Function) {

    RestApi.getDb("feedback")
      .leftJoin("customer", "feedback.customerid", "customer.id")
      .select("feedback.*", "customer.name")
      .orderBy("createddate", "desc")
      .then((feedback) => {
        cb(undefined, {
          data: feedback
        });
      })
      .catch((err) => {
        cb(undefined, {
          error: err.message || "Feedback Error..."
        });
      })

  }

  public getCustomerReport(args: any, cb: Function) {
    const startDate = Utils.toSqlDate(args.startdate);
    const endDate = Utils.toSqlDate(args.enddate);
    console.log("startDate >>", startDate);
    console.log("endDate >>", endDate);

    RestApi.getDb("customer")
      .select("customer.code", "customer.name", "customer.phone", "region.region", "cusorder.netamount", "cusorder.ordertime")
      .leftJoin("region", "customer.regionid", "region.id")
      .leftJoin(RestApi.getKnex().raw(`(SELECT SUM(netamount) AS netamount, COUNT(\`order\`.id) AS ordertime, customerid FROM \`order\`
      LEFT JOIN customer ON \`order\`.customerid = customer.id
      Where \`order\`.status in ('delivered')
      And \`order\`.date Between '${startDate}' And '${endDate}'
      GROUP BY customerid) AS cusorder`),
        "customer.id", "cusorder.customerid")
      .where("cusorder.netamount", ">", 0)
      .orderBy("cusorder.netamount", "desc")
      .limit(10)
      .then((result) => {
        cb(undefined, {
          data: result
        });
      })
      .catch((err) => {
        cb(undefined, {
          error: err.message || "Customer Report Error"
        })
      });
  }

  /**
   * update customer active if hasn't any order within one month is expired. 
   */
  public async updateCustomerActive() {

    try {
      let customer: any = [];
      const customer_id: any = [];
      const fromnoformat = moment(new Date()).subtract(30, "days").toDate();
      const fromdate = moment(fromnoformat).format("YYYY-MM-DD");
      const todate = moment(new Date()).format("YYYY-MM-DD");
      const customer_active: any = { is_active: 1 };
      console.log("fromdate date ", fromdate);
      console.log("todate date ", todate);

      RestApi.getKnex().raw(`SELECT id,username
              FROM customer 
              WHERE id NOT IN (SELECT distinct customerid FROM \`order\` WHERE createddate BETWEEN '` + fromdate + `' AND '` + todate + `') AND customer.active_status='0' `)
        .then((result) => {
          customer = result[0];
          console.log(" result NOT EXISTS ", customer);
          if (customer.length > 0) {
            customer.forEach((cutdata: any) => {
              customer_id.push(cutdata.id);
            });
            console.log("if customer_id ", customer_id);
            return RestApi.getDb("customer")
              .whereIn("id", customer_id)
              .update({ "is_active": 0, "updateddate": Utils.toSqlDate(new Date()) }, "id");
          }
          else {
            return undefined;
          }
        });
    } catch (error) {
      throw new Error("Update Customer Active Error");
    }


  }

  // public async updateCustomerActive() {

  //   try {
  //     let customer: any = [];
  //     const customer_id: any = [];
  //     const fromnoformat = moment(new Date()).subtract(30, "days").toDate();
  //     const fromdate = moment(fromnoformat).format("YYYY-MM-DD");
  //     const todate = moment(new Date()).format("YYYY-MM-DD");
  //     const customer_active: any = { is_active: 1 };
  //     console.log("fromdate date ", fromdate);
  //     console.log("todate date ", todate);

  //     RestApi.getKnex().raw(`SELECT id,username
  //             FROM customer 
  //             WHERE id NOT IN (SELECT distinct customerid FROM \`order\` WHERE createddate BETWEEN '` + fromdate + `' AND '` + todate + `') AND customer.active_status='1' AND updateddate BETWEEN '` + fromdate + `' AND '` + todate + `'`)
  //       .then((result) => {
  //         customer = result[0];
  //         console.log(" result NOT EXISTS ", customer);
  //         if (customer.length > 0) {
  //           customer.forEach((cutdata: any) => {
  //             customer_id.push(cutdata.id);
  //           });
  //           console.log("if customer_id ", customer_id);
  //           return RestApi.getDb("customer")
  //             .whereIn("id", customer_id)
  //             .update({ "is_active": 0, "updateddate": Utils.toSqlDate(new Date()) }, "id");
  //         }
  //         else {
  //           return undefined;
  //         }
  //       });
  //   } catch (error) {
  //     throw new Error("Update Customer Active Error");
  //   }


  // }

  
}

export default new CustomerView();