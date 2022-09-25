/**
 * Cargate
 */
import * as RestApi from "../lib/restapi";

export class CargateView {
  constructor() { }

  public index(args: any, cb: Function) {
    cb(undefined, {
      error: {
        message: "Not Working..."
      }
    });
  }

  public getCargateList(args: any, cb: Function) {
    const customerid = args.customerid;
    const data: any = {
      data: {}
    };

    RestApi.getDb("car_gate")
      .leftJoin("customer", "car_gate.cityid", "customer.cityid")
      .where({ "customer.id": customerid })
      .select("car_gate.id","car_gate.cargatename")
      .then((result) => {
        data.data = result;
        cb(undefined, data);
        console.log("cargate name result ", result);
      })
      .catch((err) => {
        console.log(`${err}`);
        cb(err, undefined);
      });
  }

  public checkCargateName(args: any, cb: Function) {
    console.log("cargate args ", args);
    RestApi.getDb("car_gate")
      .where("cargatename", args.cargatename)
      .andWhere("cityid", args.cityid)
      .andWhere("id", "!=", args.recordid)
      .select()
      .then((result) => {
        console.log("cargate view ", result);
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

export default new CargateView();