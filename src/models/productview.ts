/**
 * Product View Model
 */
import * as RestApi from "../lib/restapi";
import { Utils } from "../lib/utils";

export class ProductView {
  constructor() { }

  public index(args: any, cb: Function) {
    const data: any = {
      data: []
    };

    RestApi.getDb("product")
      .select()
      .then((result) => {
        data.data = result;
        cb(undefined, data);
      })
      .catch((err) => {
        console.log(`${err}`);
        cb(err, undefined);
      });
  }

  public getProductList(args: any, cb: Function) {
    const data: any = {
      data: []
    };
    let per_page = args.perPage || 10;
    let offset = args.page || 1;
    if (args.page && args.page != "") {
      offset = (args.page - 1) * per_page;
    }
    RestApi.getDb("product")
      .leftJoin("category", "product.categoryid", "category.id")
      .leftJoin("sub_category", "product.subcategoryid", "sub_category.id")
      .select("product.*", "category", "sub_category")
      .limit(per_page).offset(offset)
      .orderBy("product.createddate", "desc")
      .then((result) => {
        data.data = result;
        return RestApi.getDb().count({ total: "product.id" })
          .select().from("product")
      })
      .then((result) => {
        const count = (result.length > 0) ? result[0].total : 0;
        console.log("count", count);
        data.totalpage = Math.ceil(count / per_page);
        console.log("data.totalpage", data.totalpage);
        cb(undefined, data);
        console.log("product result ", result);
      })
      .catch((err) => {
        console.log(`${err}`);
        cb({
          error: {
            message: err.message || "Prodcut List Error."
          }
        }, undefined);
      });
  }

  public getProductBySubcategory(args: any, cb: Function) {
    const data: any = {
      product: []
    };
    let per_page = args.perPage || 10;
    let offset = args.page || 1;

    let dbQuery = RestApi.getDb().column("product.*", "category.category", "sub_category.sub_category")
      .select().from("product").leftJoin("category", "product.categoryid", "category.id")
      .leftJoin("sub_category", "product.subcategoryid", "sub_category.id")

    if (args.categoryid && args.categoryid != "") {
      dbQuery = dbQuery.where("product.categoryid", args.categoryid);
    }
    if (args.subcategoryid && args.subcategoryid != "") {
      dbQuery = dbQuery.where("product.subcategoryid", args.subcategoryid);
    }
    if (args.page && args.page != "") {
      offset = (args.page - 1) * per_page;
      dbQuery = dbQuery.limit(10).offset(offset);
    }
    dbQuery.orderBy("product.createddate", "desc")
      .then((result) => {
        data.product = result;
        let dbQuerySearch = RestApi.getDb()
          .select().from("product");
        if (args.categoryid && args.categoryid != "") {
          dbQuerySearch = dbQuerySearch.where("product.categoryid", args.categoryid);
        }
        if (args.subcategoryid && args.subcategoryid != "") {
          dbQuerySearch = dbQuerySearch.where("product.subcategoryid", args.subcategoryid);
        }
        return dbQuerySearch.count({ total: "product.id" });
      })
      .then((result) => {
        const count = (result.length > 0) ? result[0].total : 0;
        console.log("count", count);
        data.totalpage = Math.ceil(count / per_page);
        console.log("data.totalpage", data.totalpage);
        cb(undefined, data);
      })
      .catch((err) => {
        cb(undefined, {
          error: {
            message: err.message || "Product List Error."
          }
        })
      })
  }

  public getProductListbyid(args: any, cb: Function) {
    // console.log("args", args);
    const categoryid = args.categoryid;
    const subcategoryid = args.subcategoryid;
    let _category_filter = ` WHERE p.categoryid =  '` + categoryid + `'`;
    if (categoryid == "" || categoryid == "undefined") {
      _category_filter = "";
    }
    let _subcategory_filter = ` AND p.subcategoryid =  '` + subcategoryid + `'`;
    if (subcategoryid == "" || subcategoryid == "undefined") {
      _subcategory_filter = "";
    }

    let product_detail: any = [];
    RestApi.getKnex().raw(`SELECT p.*,category,sub_category
        FROM product p
        LEFT JOIN category c ON c.id = p.categoryid
        LEFT JOIN sub_category s ON s.id = p.subcategoryid
        ` + _category_filter + _subcategory_filter +
      ` ORDER BY p.createddate desc `)
      .then((result => {
        product_detail = result[0];
        // console.log("product result ", product_detail);
        cb(undefined, { data: product_detail });

      }))
      .catch((err) => {
        console.log(`${err}`);
        cb(err, undefined);
      });
  }

  public getProductByID(args: any, cb: Function) {
    console.log("product by id result ", args);
    const productId = args.productid;
    RestApi.getDb("product")
      .leftJoin("category", "product.categoryid", "category.id")
      .leftJoin("sub_category", "product.subcategoryid", "sub_category.id")
      .select("product.*", "category", "sub_category")
      .where({ "product.id": productId })
      .first()
      .then((result) => {
        cb(undefined, { data: result });
        console.log("product by id result ", result);
      })
      .catch((err) => {
        console.log(`${err}`);
        cb(err, undefined);
      });
  }

  public SearchProductDetail(args: any, cb: Function) {
    const data: any = {
      data: []
    };
    let per_page = args.perPage || 10;
    let offset = args.page || 1;
    if (args.page && args.page != "") {
      offset = (args.page - 1) * per_page;
    }
    console.log("args", args.search);
    const search = args.search;
    console.log("string ", [...search]);
    // const google_myanmar_tools = require("myanmar-tools");
    // const detector = new google_myanmar_tools.ZawgyiDetector();
    // const score = detector.getZawgyiProbability(search);

    // const google_myanmar_tools = require("myanmar-tools");
    // const converter = new google_myanmar_tools.ZawgyiConverter();
    // const output = converter.zawgyiToUnicode("မ္း");
    // console.log("string length ", search.length);
    // console.log(" 0 :", search[0]); 
    // console.log(" 1 :", search[1]);
    // console.log(" 2 :", search[2]); 
    // console.log(" 3 :", search[3]);
    // console.log(" 4 :", search[4]); 
    // console.log(" 5 :", search[5]);
    // console.log(" 6 :", search[6]); 
    // console.log(" 7 :", search[7]);
    // console.log(" 8 :", search[8]); 
    // console.log(" 9 :", search[9]);
    // console.log(" 10 :", search[10]); 
    // console.log(" 11 :", search[11]);
    // console.log(" 12 :", search[12]);
    let dbQuery = RestApi.getDb("product")
      .select("product.*", "category", "sub_category")
      .leftJoin("category", "product.categoryid", "category.id")
      .leftJoin("sub_category", "product.subcategoryid", "sub_category.id");
    if (search && search != "") {
      dbQuery = dbQuery.where("productname", "like", "%" + search + "%");
    }
    if (offset && offset != "") {
      const offset = (args.page - 1) * 10;
      dbQuery = dbQuery.where("status", 1).limit(per_page).offset(offset);
    }
    dbQuery.orderBy("product.createddate", "desc")
      .then((result) => {
        data.data = result;
        console.log("search data.data result ", result);
        return RestApi.getDb().count({ total: "product.id" })
          .select().from("product").where("productname", "like", "%" + search + "%");
        // let dbQuery =  RestApi.getDb("product")
        //   .select("product.*", "category", "sub_category")
        //   .leftJoin("category", "product.categoryid", "category.id")
        //   .leftJoin("sub_category", "product.subcategoryid", "sub_category.id");
        // if (search && search != "") {
        //   dbQuery = dbQuery.where("productname", "like", "%" + search + "%").orWhere("productcode", "like", "%" + search + "%").orWhere("description", "like", "%" + search + "%");
        // }
        // if (offset && offset != "") {
        //   const offset = (args.page - 1) * 10;
        //   dbQuery = dbQuery.where("status", 1).limit(per_page).offset(offset);
        // }
        // return dbQuery.count({ total: "product.id" });
      })
      .then((result) => {
        console.log("count result ", result);
        const count = (result.length > 0) ? result[0].total : 0;
        console.log("count", count);
        data.totalpage = Math.ceil(count / per_page);
        console.log("data.totalpage", data.totalpage);
        cb(undefined, data);
        console.log("product by id result ", result);
      })
      .catch((err) => {
        console.log(`${err}`);
        cb(err, undefined);
      });
  }

  public viewcount(args: any, cb: Function) {
    const productid: any = args.productid;
    let viewcount: number = 1;
    RestApi.getKnex().raw(`UPDATE product SET viewcount = viewcount + ${viewcount} WHERE product.id = '${productid}'`)
      .then((result) => {
        RestApi.getDb('product').select('viewcount').where({ id: productid }).first()
          .then((viewcount) => {
            cb(undefined, {
              message: "Success",
              viewcount: viewcount.viewcount
            });
          })
          .catch((err) => {
            cb(undefined, {
              error: {
                message: err.message || "View Count Error"
              }
            });
          });
      })
      .catch((err) => {
        cb(undefined, {
          error: {
            message: err.message || "View Count Error"
          }
        });
      });
  }

  public getProductCode(args: any, cb: Function) {

    RestApi.getDb("product")
      .where("productcode", args.productcode)
      .andWhere("id", "!=", args.recordid)
      .select('productcode')
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

  public getProductReport(args: any, cb: Function) {
    const startDate = Utils.toSqlDate(args.startdate);
    const endDate = Utils.toSqlDate(args.enddate);
    console.log("startDate >>", startDate);
    console.log("endDate >>", endDate);

    RestApi.getDb("product")
      .select("product.productcode", "product.productname", "product.viewcount", "category.category", "sub_category.sub_category", "productorder.soldoutqty")
      .leftJoin("category", "product.categoryid", "category.id")
      .leftJoin("sub_category", "product.subcategoryid", "sub_category.id")
      .leftJoin(RestApi.getKnex().raw(`(SELECT SUM(replyqty) AS soldoutqty, productid FROM \`order_items\`
        LEFT JOIN \`order\` ON \`order\`.id = \`order_items\`.orderid
        LEFT JOIN \`product\` ON \`product\`.id = \`order_items\`.productid
        Where \`order\`.date Between '${startDate}' And '${endDate}'
        GROUP BY productid 
        ) AS productorder`),
        "product.id", "productorder.productid")
      .groupBy("product.productcode", "product.productname", "product.viewcount", "category.category", "sub_category.sub_category", "productorder.soldoutqty")
      .orderBy("productorder.soldoutqty", "desc")
      .then((result) => {
        console.log("result ", result);
        if (result.length > 0) {
          result.forEach((res) => {
            if (!res.soldoutqty) {
              res.soldoutqty += 0;
            }
          });
        }
        cb(undefined, {
          data: result
        });
      })
      .catch((err) => {
        cb(undefined, {
          error: err.message || "Product Report Error"
        })
      });
  }

  public getProductPriceByID(args: any, cb: Function) {
    const productId = args.productid;
    RestApi.getDb("product")
      .select("product.price")
      .where({ "product.id": productId })
      .first()
      .then((result) => {
        cb(undefined, result);
        console.log("product by id result ", result);
      })
      .catch((err) => {
        console.log(`${err}`);
        cb(err, undefined);
      });
  }
}

export default new ProductView();