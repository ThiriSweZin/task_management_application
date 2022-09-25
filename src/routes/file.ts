/**
 * File Router
 */
import * as fs from "fs";
import * as pathModule from "path";
import * as formidable from "formidable";
import * as XLSX from "xlsx";
import { IncomingMessage, ServerResponse } from "http";
import * as mediaserver from "../lib/mediaserver";
import * as RestApi from "../lib/restapi";
import * as comfunc from "../lib/comfunc";
import { Utils } from "../lib/utils";
import { v4 as uuid } from "uuid";
import { Recoverable } from "repl";
import Knex = require("knex");


class FileRouter {
  static MAX_UPLOAD_SIZE = 15 * 1024 * 1024; // 15MB
  private publicDir: string;

  constructor() { }

  private static decodeUrl(url: string): string {
    url = `${url}`;
    try {
      url = decodeURIComponent(url);
    } catch (err) { }
    url = url.replace(/%([0-9A-F]{2})/g, (x, x1) => {
      return String.fromCharCode(parseInt(x1, 16));
    });
    return url;
  }

  public init(options?: any) {
    console.log("init");
    if (!options) {
      options = {};
    }
    this.publicDir = this.findPublic(__dirname);

    return (req: IncomingMessage, res: ServerResponse, next: Function) => {
      const url = req.url;
      if (/^\/upload\/.*/i.test(url)) {
        const params: any = {};
        const keys = ["type"];
        const match = /^\/upload\/([^\/]+)/i.exec(url);
        if (match) {
          for (const i in keys) {
            let value = `${match[parseInt(i) + 1]}`;
            if (typeof value === "string" || typeof value === "number") {
              value = FileRouter.decodeUrl(value);
              const queryMatch = /^([^\?]+)?(.*)$/.exec(value);
              params[keys[i]] = queryMatch ? queryMatch[1] : value;
            }
          }
        }

        (<any>req).params = params;
        this.upload(req, res, next);

      } else if (/^\/bundleimport\/.*/i.test(url)) {
        const params: any = {};
        const keys = ["type"];
        const match = /^\/bundleimport\/([^\/]+)/i.exec(url);
        if (match) {
          for (const i in keys) {
            let value = `${match[parseInt(i) + 1]}`;
            if (typeof value === "string" || typeof value === "number") {
              value = FileRouter.decodeUrl(value);
              const queryMatch = /^([^\?]+)?(.*)$/.exec(value);
              params[keys[i]] = queryMatch ? queryMatch[1] : value;
            }
          }
        }
        (<any>req).params = params;
        this.import(req, res, next);

      } else if (/^\/tableimport\/.*/i.test(url)) {
        const params: any = {};
        const keys = ["type"];
        const match = /^\/tableimport\/([^\/]+)/i.exec(url);
        if (match) {
          for (const i in keys) {
            let value = `${match[parseInt(i) + 1]}`;
            if (typeof value === "string" || typeof value === "number") {
              value = FileRouter.decodeUrl(value);
              const queryMatch = /^([^\?]+)?(.*)$/.exec(value);
              params[keys[i]] = queryMatch ? queryMatch[1] : value;
            }
          }
        }
        (<any>req).params = params;
        this.import(req, res, next);

      } else if (/^\/productimports\/.*/i.test(url)) {
        const params: any = {};
        const keys = ["type"];
        const match = /^\/productimports\/([^\/]+)/i.exec(url);
        if (match) {
          for (const i in keys) {
            let value = `${match[parseInt(i) + 1]}`;
            if (typeof value === "string" || typeof value === "number") {
              value = FileRouter.decodeUrl(value);
              const queryMatch = /^([^\?]+)?(.*)$/.exec(value);
              params[keys[i]] = queryMatch ? queryMatch[1] : value;
            }
          }
        }
        (<any>req).params = params;
        this.productimports(req, res, next);

      } else if (/^\/delete/i.test(url)) {
        this.delete(req, res, next);

      } else if (/^\/stream/i.test(url)) {
        this.stream(req, res, next);
      } else {
        next();
      }
    };
  }

  private findPublic(dir: string): string {
    const t = pathModule.dirname(dir);
    const pubDir = pathModule.join(t, "public");
    if (!fs.existsSync(pubDir)) {
      const p = pathModule.join(t, "package.json");
      if (fs.existsSync(p)) {
        throw new Error("Public directory not found!");
      }
      return this.findPublic(t);
    }
    return pubDir;
  }

  public upload(req: IncomingMessage, res: ServerResponse, next: Function) {
    console.log("upload image ");
    const headers: any = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": 1728000
    };
    if (req.method == "OPTIONS") {
      res.writeHead(200, headers);
      return res.end();
    }
    headers["Content-Type"] = "application/json";

    const type = (<any>req).params.type;
    const uploadDir = pathModule.join(this.publicDir, "upload", type);
    console.log(`file: ${uploadDir}`);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    const form = new formidable.IncomingForm();
    const uploads: string[] = [];
    let fileName: any;
    form.maxFieldsSize = FileRouter.MAX_UPLOAD_SIZE;
    form.multiples = true;
    form.uploadDir = uploadDir;
    form.on("file", function (field, file) {
      fileName = file.name.replace(/\s/g, "-");
      const origFileName = fileName;
      let count = 0;
      while (fs.existsSync(pathModule.join(uploadDir, fileName))) {
        count++;
        const match = origFileName.match(/^(.*)\.([^\.]+)$/);
        if (match) {
          fileName = `${match[1]}-(${count}).${match[2]}`;
        } else {
          fileName = `${origFileName}-(${count})`;
        }
      }
      fs.rename(file.path, pathModule.join(uploadDir, fileName), (err) => { });
      const filePath = `./upload/${type}/${fileName}`;
      console.log("UPLOAD " + filePath);
      uploads.push(filePath);
    });
    form.on("error", function (err) {
      console.log(`An error has occured: \n${err}`);
      res.writeHead(200, headers);
      res.end(JSON.stringify({ "message": "error", "error": err.message }));
    });
    form.on("end", function () {
      res.writeHead(200, headers);
      // res.end(JSON.stringify({ "message": "success", "files": uploads, "files_name": fileName }));
      res.end(JSON.stringify({ "message": "success", "files": uploads, "link": uploads[0] }));
    });
    form.parse(req);
  }

  // public import(req: IncomingMessage, res: ServerResponse, next: Function) {
  //   const headers: any = {
  //     "Access-Control-Allow-Origin": "*",
  //     "Access-Control-Allow-Headers": "*",
  //     "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  //     "Access-Control-Allow-Credentials": "true",
  //     "Access-Control-Max-Age": 1728000
  //   };
  //   if (req.method == "OPTIONS") {
  //     res.writeHead(200, headers);
  //     return res.end();
  //   }
  //   headers["Content-Type"] = "application/json";

  //   const type = (<any>req).params.type;
  //   const uploadDir = pathModule.join(this.publicDir, "upload", type);
  //   if (!fs.existsSync(uploadDir)) {
  //     fs.mkdirSync(uploadDir);
  //   }
  //   const form = new formidable.IncomingForm();
  //   const uploads: string[] = [];
  //   form.maxFieldsSize = FileRouter.MAX_UPLOAD_SIZE;
  //   form.multiples = true;
  //   form.uploadDir = uploadDir;
  //   form.on("file", function (field, file, err) {
  //     let fileName = file.name.replace(/\s/g, "-");
  //     const origFileName = fileName;
  //     let count = 0;
  //     while (fs.existsSync(pathModule.join(uploadDir, fileName))) {
  //       count++;
  //       const match = origFileName.match(/^(.*)\.([^\.]+)$/);
  //       if (match) {
  //         fileName = `${match[1]}-(${count}).${match[2]}`;
  //       } else {
  //         fileName = `${origFileName}-(${count})`;
  //       }
  //     }

  //     fs.rename(file.path, pathModule.join(uploadDir, fileName), (err) => { });
  //     const filePath = `./upload/${type}/${fileName}`;
  //     // console.log("filePath", filePath);
  //     uploads.push(filePath);

  //     if (err) {
  //       console.log("Err Excel Upload", err);
  //     } else {
  //       const exactPath = pathModule.join("public", "upload", type, fileName);
  //       console.log("exactPath", exactPath);

  //       // Get Data From Excel
  //       const workbook = XLSX.readFile(exactPath);
  //       const sheet_name_list = workbook.SheetNames;
  //       const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
  //       console.log("data", data);

  //       const query: any = [];
  //       const updateddate = Utils.toSqlDate(new Date());
  //       for (const key in data) {
  //         const value = data[key];
  //         const realdata = comfunc.fillDefaultFields(value);
  //         query.push(RestApi.getDb("bundle").where("productcode", realdata.productcode).update({ balance: realdata.balance, updateddate: realdata.updateddate }));
  //       }
  //       Promise.all(query)
  //         .then((result) => {
  //           // res.json({ "success": result });
  //           // res.render("dashboard/bundle", params);
  //         })
  //         .catch((err) => {
  //           console.log("err in importing balance ", `${err}`);
  //           // res.json({ "error": err });
  //         });
  //     }
  //   });
  //   form.on("error", function (err) {
  //     res.writeHead(200, headers);
  //     res.end(JSON.stringify({ "message": "error", "error": err.message }));
  //   });
  //   form.on("end", function () {
  //     res.writeHead(200, headers);
  //     res.end(JSON.stringify({ "message": "success", "files": uploads }));
  //   });
  //   form.parse(req);
  // }

  public import(req: IncomingMessage, res: ServerResponse, next: Function, fromFormat: string = "YYYY/MM/DD") {
    console.log("table import");
    const headers: any = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": 1728000
    };
    if (req.method == "OPTIONS") {
      res.writeHead(200, headers);
      return res.end();
    }
    headers["Content-Type"] = "application/json";

    const type = (<any>req).params.type;
    console.log("type ", type);
    const uploadDir = pathModule.join(this.publicDir, "upload", type);
    console.log("uplodaDir ", uploadDir);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    const form = new formidable.IncomingForm();
    const uploads: string[] = [];
    form.maxFieldsSize = FileRouter.MAX_UPLOAD_SIZE;
    form.multiples = true;
    form.uploadDir = uploadDir;
    console.log("uploadDir ", uploadDir);
    form.on("file", function (field, file, err) {
      let fileName = file.name.replace(/\s/g, "-");
      console.log("filename ", fileName);
      const origFileName = fileName;
      let count = 0;
      while (fs.existsSync(pathModule.join(uploadDir, fileName))) {
        count++;
        const match = origFileName.match(/^(.*)\.([^\.]+)$/);
        if (match) {
          fileName = `${match[1]}-(${count}).${match[2]}`;
        } else {
          fileName = `${origFileName}-(${count})`;
        }
      }
      console.log("uploadDir2 ", uploadDir);
      // Get Table
      const table = origFileName.split(".").slice(0, -1).join(".");
      console.log("table", table);


      // fs.rename(file.path, pathModule.join(uploadDir, fileName), (err) => { });
      const filePath = `./upload/${type}/${fileName}`;
      console.log("filePath", filePath);
      uploads.push(filePath);
      console.log("upload finished ", uploads);
      if (err) {
        console.log("Err Excel Upload", err);
      } else {
        const exactPath = pathModule.join("public", "upload", type, fileName);
        console.log("exactPath ", exactPath);
        // Get Data From Excel
        const workbook = XLSX.readFile(file.path);
        const sheet_name_list = workbook.SheetNames;
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
        const customer_query: any = [];
        const customer_queries: any = [];
        for (const key in data) {
          const value = data[key];
          const db = RestApi.getDb(table);
          const record = comfunc.fillDefaultFields(value);
          // let customer = {
          //   id: uuid(),
          //   name: record.Name,
          //   code: record.Code,
          //   mobile: record.mobile,
          //   phone: record.Phone,
          //   email: record.Email,
          //   regionid: record.Region,
          //   cityid: record.City,
          //   address: record.Address,
          //   username: record.Username,
          //   password: record.Password,
          //   createddate: record.createddate,
          //   updateddate: record.updateddate
          // };
          const customer: any = {};
          RestApi.getDb()
            .select("id")
            .from("region")
            .where("region", record.Region)
            .then((record) => {
              if (record && record.length > 0) {
                record.forEach((detail) => {
                  customer["regionid"] = detail.id;
                  console.log("category ", customer["regionid"]);
                });
              }
            }
            ) as PromiseLike<any>;
          RestApi.getDb()
            .select("id")
            .from("city")
            .where({ "cityname": record.City })
            .then((record) => {
              if (record && record.length > 0) {
                record.forEach((detail) => {
                  customer["cityid"] = detail.id;
                  console.log("subcategory ", customer["cityid"]);
                });
              }
            }
            ) as PromiseLike<any>;
          console.log("mobile", record.Mobile);
          customer["code"] = record.Code;
          customer["name"] = record.Name;
          customer["mobile"] = record.Mobile;
          customer["phone"] = record.Phone;
          customer["email"] = record.Email;
          customer["address"] = record.Address;
          customer["username"] = record.UserName;
          customer["password"] = record.Password;
          customer["updateddate"] = Utils.toSqlDate(new Date());
          customer["createddate"] = Utils.toSqlDate(new Date());
          customer["id"] = uuid();
          customer_query.push(customer);
        }
        console.group("customer_query ", customer_query);
        customer_queries.push(RestApi.getKnex().batchInsert("customer", customer_query));
        console.group("customer_queries ", customer_queries);
        RestApi.getKnex().transaction(function (trx) {
          Promise.all(customer_queries)
            .then(trx.commit)
            .catch(trx.rollback);
        });
      }
    });
    form.on("error", function (err) {
      res.writeHead(200, headers);
      res.end(JSON.stringify({ "message": "error", "error": err.message }));
    });
    form.on("end", function () {
      res.writeHead(200, headers);
      res.end(JSON.stringify({ "message": "success", "files": uploads }));
    });
    form.parse(req);
  }

  // 03/11/2020
  public productimports(req: IncomingMessage, res: ServerResponse, next: Function, fromFormat: string = "YYYY/MM/DD") {
    console.log("productimports");
    const headers: any = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": 1728000
    };
    if (req.method == "OPTIONS") {
      res.writeHead(200, headers);
      return res.end();
    }
    headers["Content-Type"] = "application/json";

    const type = (<any>req).params.type;
    const uploadDir = pathModule.join(this.publicDir, "upload", type);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    const form = new formidable.IncomingForm();
    const uploads: string[] = [];
    const product_queries: any = [];
    form.maxFieldsSize = FileRouter.MAX_UPLOAD_SIZE;
    form.multiples = true;
    form.uploadDir = uploadDir;
    form.on("file", function (field, file, err) {
      let fileName = file.name.replace(/\s/g, "-");
      const origFileName = fileName;
      let count = 0;
      while (fs.existsSync(pathModule.join(uploadDir, fileName))) {
        count++;
        const match = origFileName.match(/^(.*)\.([^\.]+)$/);
        if (match) {
          fileName = `${match[1]}-(${count}).${match[2]}`;
        } else {
          fileName = `${origFileName}-(${count})`;
        }
      }

      // Get Table
      const table = origFileName.split(".").slice(0, -1).join(".");
      const filePath = `./upload/${type}/${fileName}`;
      uploads.push(filePath);

      if (err) {
        console.log("Err Excel Upload", err);
      } else {
        const exactPath = pathModule.join("public", "upload", type, fileName);
        // Get Data From Excel
        const workbook = XLSX.readFile(file.path);
        const sheet_name_list = workbook.SheetNames;
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
        // console.log("data", data);

        const category_query: any = [];
        const subcategor_query: any = [];

        const product_array: any = [];
        const category_array: any = [];
        const subcategory_array: any = [];

        let product_temp_array: any = [];
        let category_temp_array: any = [];
        let subcategor_temp_array: any = [];


        for (const key in data) {
          const value = data[key];
          const db = RestApi.getDb(table);
          const record = comfunc.fillDefaultFields(value);
          // let product = {
          //   id: "",
          //   productcode: "",
          //   categoryid: "",
          //   subcategoryid: "",
          //   productname: "",
          //   description: "",
          //   ifpackage: "",
          //   itemcount: "",
          //   price: "",
          //   createddate: "",
          //   updateddate: ""
          // };


          if (record.Item_Count == "" || record.Item_Count == null) {
            record.Item_Count = 0;
          }
          if (record.Product_Code != "") {
            product_array.push(record);
          }
          if (typeof record.Package_Type === "undefined") {
            record.Package_Type = "undefined";
          }
          if (record.Package_Type === 'item' || record.Package_Type === 'package') {
            record.Package_Type = record.Package_Type;
          }
          else {
            record.Package_Type = "another";
          }


        }
        // end for loop 

        RestApi.getDb()
          .select("*")
          .from("product")
          .then((product_record) => {
            if (product_record && product_record.length > 0) {
              product_record.forEach((dlr) => {
                product_temp_array.push(dlr.productcode);
              });
            }

            const product_query: any = [];
            for (const i in product_array) {
              let product: any = {};
              let temp_number: number = 0;
              for (let l = 0; l < product_temp_array.length; l++) {
                if (product_temp_array[l] == product_array[i].Product_Code || product_array[i].Package_Type === 'another') {
                  temp_number = 1;
                }
              }
              // console.log("temp_number ", temp_number);
              if (temp_number != 1) {
                // console.log(" temp_number = 0 ");
                product["id"] = uuid();

                // if (category_array && category_array.length > 0) {
                //   category_array.forEach((item: any) => {
                //     if (item.category == product_array[i].Category) {
                //       product["categoryid"] = item.id;
                //       console.log("category ", product["categoryid"]);

                //     }
                //   })
                // }

                RestApi.getDb()
                  .select("*")
                  .from("category")
                  .then((category_record) => {
                    if (category_record && category_record.length > 0) {
                      category_record.forEach((category_detail) => {
                        // category_temp_array.push(category_detail);
                        let isExist = 0;
                        if (isExist == 0) {
                          product_array.forEach((product: any) => {
                            if (product.Category == category_detail.category) {
                              product["categoryid"] = category_detail.id;
                              isExist = 1;
                              // console.log("category id ", product['categoryid']);
                            }
                          });
                        }
                      });
                      // console.log("prduct with category id ", product_array);
                    }
                    // for (const i in product_array) {
                    //   const category: any = {};
                    //   for (let k = 0; k < category_temp_array.length; k++) {
                    //     if (category_temp_array[k].category == product_array[i].Category) {
                    //       category["id"] = category_temp_array[k].id;
                    //       category["category"] = category_temp_array[k].category;
                    //       category_array.push(category);
                    //     }
                    //   }
                    // }
                  }) as PromiseLike<any>;

                if (product_array && product_array.length > 0) {
                  RestApi.getDb()
                    .select("id")
                    .from("sub_category")
                    .where({ "sub_category": product_array[i].Sub_Category })
                    .then((record) => {
                      if (record && record.length > 0) {
                        record.forEach((detail) => {
                          product["subcategoryid"] = detail.id;
                          // console.log("subcategory ", product["subcategoryid"]);
                        });
                      }
                    })
                    .catch((err) => {
                      console.log(`${err}`);
                    });
                }
                // product['categoryid'] = product_array[i].categoryid;
                product["productcode"] = product_array[i].Product_Code;
                product["productname"] = product_array[i].Product_Name;
                product["description"] = product_array[i].Description;
                product["ifpackage"] = product_array[i].Package_Type;
                product["itemcount"] = product_array[i].Item_Count;
                product["price"] = product_array[i].Price;
                product["updateddate"] = Utils.toSqlDate(new Date());
                product["createddate"] = Utils.toSqlDate(new Date());
                // if(product["categoryid"] == undefined || product["categoryid"] == "" || product["categoryid"] == null)
                // product["categoryid"] == uuid();
                // console.log("new product ", product);
                product_query.push(product);
                temp_number = 0;
                // console.log("product query in loop ", product_query);
              }
            }
            // end for loop
            // console.log(" product_query out loop ", product_query);
            product_queries.push(RestApi.getKnex().batchInsert("product", product_query));
            // RestApi.getKnex().transaction(function (trx) {
            //   Promise.all(product_queries)
            //     .then(trx.commit)
            //     .catch(trx.rollback);
            // }) as PromiseLike<any>;
          });
        console.log(" product_queries ", product_queries);
        Promise.all(product_queries)
          .then((result) => {
            const data: any = [];
            data.isSuccess = true;
            data.message = "success";
          })
          .catch((err) => {
            console.log("err in importing product ", `${err}`);
          });
      } //else
    });
    form.on("error", function (err) {
      res.writeHead(200, headers);
      res.end(JSON.stringify({ "message": "error", "error": err.message }));
    });
    form.on("aborted", function (err) {
      res.writeHead(200, headers);
      res.end(JSON.stringify({ "message": "error", "error": err.message }));
    });
    form.on("end", function () {
      res.writeHead(200, headers);
      res.end(JSON.stringify({ "message": "success", "files": uploads }));
    });
    form.parse(req);
  }

  public delete(req: any, res: any, next: Function = undefined) {
    const headers: any = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": 1728000
    };
    if (req.method == "OPTIONS") {
      res.writeHead(200, headers);
      return res.end();
    }
    headers["Content-Type"] = "application/json";

    const file = (typeof req == "string") ? req : (<any>req).body.file;
    if (typeof file === "string" && file != "") {
      const filePath = pathModule.join(this.publicDir, file);
      console.log(`DELETE ${file}`);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          let msg: any = { "message": "success", "file": file };
          if (err) {
            msg = { "message": "error", "file": file, "error": err.message };
          }
          if (typeof res == "function") {
            res(undefined, "success");
          } else {
            res.writeHead(200, headers);
            res.end(JSON.stringify(msg));
          }
        });
      } else {
        if (typeof res == "function") {
          res("error");
        } else {
          res.writeHead(200, headers);
          res.end(JSON.stringify({ "message": "error", "file": file, "error": "File not found!" }));
        }
      }
    } else {
      if (typeof res == "function") {
        res("error");
      } else {
        res.writeHead(200, headers);
        res.end(JSON.stringify({ "message": "error", "file": file, "error": "File not found!" }));
      }
    }
  }

  public stream(req: IncomingMessage, res: ServerResponse, next: Function) {
    const reqData = (req.method == "POST") ? (<any>req).body : (<any>req).query;
    const file = reqData.file;
    if (typeof file === "string" && file != "") {
      const filePath = pathModule.join(this.publicDir, file);
      console.log(`STREAM ${file}`);
      if (fs.existsSync(filePath)) {
        const ms = new mediaserver.MediaServer();
        ms.pipe(req, res, filePath);
      } else {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ "message": "error", "file": file, "error": "File not found!" }));
      }
    } else {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ "message": "error", "file": file, "error": "File not found!" }));
    }
  }
}

export default new FileRouter();
