/**
 * Auth
 */
import * as RestApi from "../lib/restapi";
import * as uuid from "uuid";
import { Utils } from "../lib/utils";

export class Auth {
  constructor() { }

  public index(args: any, cb: Function) {
    cb(undefined, {
      error: {
        message: "Not Working..."
      }
    });
  }

  public login(args: any, cb: Function) {
    const id = uuid.v4();
    const data = {
      id: id,
      customerid: "",
      firebase_token: args.firebase_token,
      createddate: Utils.toSqlDate(new Date()),
      updateddate: Utils.toSqlDate(new Date())
    };
    console.log("args.password", args.password);

    RestApi.getDb("customer")
      .where({"username": args.username, "password": args.password, "is_active": 1})
      .select()
      .then((result) => {
        console.log("customer data ", result);
        if (result.length > 0) {
          cb(undefined, {
            success: {
              id: result[0].id,
              message: "Login Successful"
            }
          });
          RestApi.getDb("customer_values").where({"customerid": result[0].id}).select()
          .then((old_customer) => {
            if(old_customer.length == 0) {
              data.customerid = result[0].id;
              return RestApi.getDb("customer_values").insert(data);
            } else {
              return RestApi.getDb("customer_values").update({"firebase_token": args.firebase_token}, "id")
              .where({"customerid": result[0].id});
            }
          })
          
        } else {
          cb(undefined, {
            success: {
              id: result[0].id,
              message: "Login Failed!"
            }
          });
        }
      })
      .catch((err) => {
        cb(undefined, {
          error: {
            message: "Login Failed"
          }
        });
      });
  }

  public refreshToken(args: any, cb: Function) {
    const customerid: any = args.customerid;
    const firebase_token: any = args.firebase_token;
    RestApi.getDb("customer_values").where({"customerid": customerid}).select()
    .then((result) => {
      console.log("then");
      cb(undefined, {
        data: result[0].id
      });
      if(result && result.length != 0){
        return RestApi.getDb("customer_values")
        .update({"firebase_token": firebase_token}, "id")
        .where({"customerid": customerid});
      }
    })
    .catch((err) => {
      console.log("catch");
      cb(undefined, {
        error: {
          message: err.message || "Is Exists error"
        }
      });
    });
  }
  
}

export default new Auth();
