/**
 * Feedback View Model
 */
import * as RestApi from "../lib/restapi";
import { Utils } from "../lib/utils";
import * as uuid from "uuid";

export class FeedbackView {
  constructor() { }

  public index(args: any, cb: Function) {

    console.log("args", args.content);
    const search = args.content;
    console.log("string ", [...search]);
    console.log("string length ", search.length);
    console.log(" 0 :", search[0]); 
    console.log(" 1 :", search[1]);
    console.log(" 2 :", search[2]); 
    console.log(" 3 :", search[3]);
    console.log(" 4 :", search[4]); 
    console.log(" 5 :", search[5]);
    console.log(" 6 :", search[6]); 
    console.log(" 7 :", search[7]);
    console.log(" 8 :", search[8]); 
    console.log(" 9 :", search[9]);
    console.log(" 10 :", search[10]); 
    console.log(" 11 :", search[11]);
    console.log(" 12 :", search[12]);
  
    const id = uuid.v4();
    const customerid = args.customerid;
    const type = args.type;
    const content = args.content;
    const images = args.images;
    const createddate = Utils.toSqlDate(new Date());
    const updateddate = Utils.toSqlDate(new Date());
    const data = {
        id,
        customerid,
        type,
        content,
        images,
        createddate,
        updateddate
    };

    RestApi.getDb("feedback")
    .insert(data)
    .then((result) => {
        console.log(`result feedback ${result}`);
        cb(undefined, { success: {
            message: "Feedback Success",
            data: data
        }});
    })
    .catch((err) => {
        console.log(`error ${err}`);
        cb(undefined, err);
    })
  }
}

export default new FeedbackView();