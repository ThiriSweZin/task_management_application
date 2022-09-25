/**
 * Data Import Routes
 */
import e, * as express from "express";
import * as path from "path";
import * as fs from "fs";
import { ExpressRouter } from "../../lib/express-application";
import * as XLSX from "xlsx";
import { Utils } from "../../lib/utils";
import config from "../../../data/config.json";
import * as RestApi from "../../lib/restapi";
import * as comfunc from "../../lib/comfunc";
import { v4 as uuid } from "uuid";
import { Permission } from "../../lib/permission";
import * as pathModule from "path";
import * as formidable from "formidable";
import * as localStorage from "local-storage";
import { promises } from "dns";

const jwtCredentialId = config.jwt.defCredentialId;

class TableImportRouter extends ExpressRouter {
    public static publicDir: string;

    constructor() {
        super();

        this.route("/productimport")
            .all(Permission.onLoad)
            .get(this.getTableImport)
            .post(this.postTableImport);
    }

    public onLoad(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) {
        if (req.isAuthenticated()) {
            next();
        } else {
            res.redirect(`/login?url=${req.url}`);
        }
    }

    public getTableImport(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) {
        let params: any = {
            title: config.appname,
            user: req.user.username,
            postUrl: "/productimport",
            params: {},
            listUrl: "/productimport"
        };
        params = Permission.getMenuParams(params, req, res);

        if (typeof (<any>req).jwtToken == "function") {
            (<any>req).jwtToken(jwtCredentialId)
                .then((result: string) => {
                    params.token = result;
                    res.render("dashboard/productimport", params);
                })
                .catch((err: any) => {
                    next(err);
                });

        } else {
            res.render("dashboard/productimport", params);
        }
    }

    public postTableImport(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) {
        const data = req.body.data;
        console.log(" PRODUCT IMPORT ");
        const type = (<any>req).params.type;
        const file = data.files[0];
        console.log("file ", file);
        const origFileName = file.substring(24, 16);
        console.log("origFileName ", origFileName);

        TableImportRouter.publicDir = TableImportRouter.findPublic(__dirname);
        const realfilepath = path.join(TableImportRouter.publicDir, file);
        if (!fs.existsSync(path.join(TableImportRouter.publicDir, file))) {
            throw new Error("import file not found!");
        }
        const workbook = XLSX.readFile(realfilepath);
        const sheet_name_list = workbook.SheetNames;
        const exceldata: any = XLSX.utils.sheet_to_json(
            workbook.Sheets[sheet_name_list[0]]
        );
        const product_array: any = [];
        const product_temp_array: any = [];
        const product_queries: any = [];
        // const pur_queries: any = [];
        // const purdetail_queries: any = [];
        // const pur_temp_array: any = ["0"];
        // const purdetail_temp_array: any = ["0"];
        for (let j = 0; j < exceldata.length; j++) {
            const product: any = {};

            if (exceldata[j].Item_Count == "" || exceldata[j].Item_Count == null || exceldata[j].Item_Count == undefined) {
                exceldata[j].Item_Count = 0;
            }

            if (typeof exceldata[j].Package_Type === "undefined") {
                exceldata[j].Package_Type = "undefined";
            }
            if (exceldata[j].Package_Type === "item" || exceldata[j].Package_Type === "package") {
                exceldata[j].Package_Type = exceldata[j].Package_Type;
            }
            else {
                exceldata[j].Package_Type = "another";
            }

            RestApi.getDb()
                .select("*")
                .from("category")
                .then((category_record) => {
                    if (category_record && category_record.length > 0) {
                        category_record.forEach((category_detail) => {
                            // category_temp_array.push(category_detail);
                            let isExist = 0;
                            if (isExist == 0) {
                                if (exceldata[j].Category == category_detail.category) {
                                    product["categoryid"] = category_detail.id;
                                    isExist = 1;
                                    // console.log("category id ", product["categoryid"]);
                                }
                            }
                        });
                    }
                }) as PromiseLike<any>;

            RestApi.getDb()
                .select("id")
                .from("sub_category")
                .where({ "sub_category": exceldata[j].Sub_Category })
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

            // RestApi.getDb()
            //     .select("*")
            //     .from("sub_category")
            //     .then((subcategory_record) => {
            //         if (subcategory_record && subcategory_record.length > 0) {
            //             subcategory_record.forEach((subcategory_detail) => {
            //                 let isExist = 0;
            //                 if (isExist == 0) {
            //                     if (exceldata[j].Sub_Category == subcategory_detail.sub_category) {
            //                         product["subcategoryid"] = subcategory_detail.id;
            //                         isExist = 1;
            //                         // console.log("subcategoryid id ", product["subcategoryid"]);
            //                     }
            //                 }
            //             });
            //         }
            //     }) as PromiseLike<any>;

            product["id"] = uuid();
            product["productcode"] = exceldata[j].Product_Code;
            product["productname"] = exceldata[j].Product_Name;
            product["description"] = exceldata[j].Description;
            product["ifpackage"] = exceldata[j].Package_Type;
            product["itemcount"] = exceldata[j].Item_Count;
            product["price"] = exceldata[j].Price;
            product["updateddate"] = Utils.toSqlDate(new Date());
            product["createddate"] = Utils.toSqlDate(new Date());
            product_array.push(product);
        }

        RestApi.getDb()
            .select("*")
            .from("product")
            .then((product_record) => {
                if (product_record && product_record.length > 0) {
                    product_record.forEach((pur) => {
                        product_temp_array.push(pur.productcode);
                    });
                }
                let product_query: any = [];
                // console.log("product_array ", product_array);
                for (const i in product_array) {
                    let temp_number: number = 0;
                    for (let l = 0; l < product_temp_array.length; l++) {
                        if (product_temp_array[l].Product_Code == product_array[i].Product_Code || product_array[i].Package_Type === "another") {
                            temp_number = 1;
                        }
                    }
                    // console.log("temp_number ", temp_number);
                    if (temp_number != 1) {
                        product_query = product_array;
                    }
                }
                // console.log("product_query ", product_query);
                product_queries.push(RestApi.getKnex().batchInsert("product", product_query));
                console.log("product_queries ", product_queries);
                RestApi.getKnex().transaction(function (trx) {
                    Promise.all(product_queries)
                        .then(trx.commit)
                        .catch(trx.rollback);
                }) as PromiseLike<any>;
                res.json({ "Success": " Import Successful !!" });
            });
    }

    public static findPublic(dir: string): string {
        const t = path.dirname(dir);
        const pubDir = path.join(t, "public");
        if (!fs.existsSync(pubDir)) {
            const p = path.join(t, "package.json");
            if (fs.existsSync(p)) {
                throw new Error("Public directory not found!");
            }
            return this.findPublic(t);
        }
        return pubDir;
    }
}

export default new TableImportRouter();