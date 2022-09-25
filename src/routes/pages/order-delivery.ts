/**
 * Order Delivery Routes
 */
import * as express from "express";
import * as uuid from "uuid";
import { ExpressRouter } from "../../lib/express-application";
import { Utils } from "../../lib/utils";
import config from "../../../data/config.json";
import * as RestApi from "../../lib/restapi";
import * as comfunc from "../../lib/comfunc";
import { Notification } from "../../lib/firebase-msg";
import { Permission } from "../../lib/permission";
// import axios from 'axios';
// import qs from 'querystring';

const jwtCredentialId = config.jwt.defCredentialId;

class OrderDeliveryRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/order-delivery").all(Permission.onLoad).get(this.getList);
    this.route("/order-delivery/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/order-delivery/detail/:id").all(Permission.onLoad).get(this.getDeliveryDetail);
    this.route("/order-delivery/detail/item-detail/:id/:deliveryid").all(Permission.onLoad).get(this.getDeliveryItemDetail);
    this.route("/delivery-list").all(Permission.onLoad).get(this.getDelList);
    this.route("/delivery-list/detail/:id").all(Permission.onLoad).get(this.getDelListDetail);
  }

  public onLoad(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.redirect(`/login?url=${req.url}`);
    }
  }

  public getList(req: express.Request, res: express.Response, next: express.NextFunction) {
    // let params: any = { title: config.appname, user: req.user.username, postUrl: "/order-delivery", params: {} };
    let params: any = { title: config.appname, user: req.user.username}
    params = Permission.getMenuParams(params, req, res);

    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/order-delivery", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/order-delivery", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/order-delivery/entry", params: {}, listUrl: "/order-delivery" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("order_delivery")
      .select()
      .then((result) => {
        params.orders_array = [];
        console.log("params ", params);

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          res.render("dashboard/order-delivery-entry", params);
        }
      })
      .then((result: string) => {
        params.token = result;
        res.render("dashboard/order-delivery-entry", params);
      })
      .catch((err: any) => {
        next(err);
      });
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let notilogData: any = {}, notimessage: any, orderCodes: any, orderCode: any[] = [], orders_result: any[] = [];
    let carGate: any, count: number = 0;
    const prefix = "DEL", notilogDataId: any = uuid.v4();
    const noti = new Notification();
    const datecode = Utils.toDateCode(new Date());

    const data = comfunc.fillDefaultFields(req.body);
    data.id = uuid.v4();
    data.date = Utils.toSqlDateTime(new Date());
    data.userid = req.user.id;
    data.deliverycode = "";
    delete data.list_length;
    delete data.select_all;
    
    let parcelQty = "(" + data.parcelqty + ")";
    const orders_arr = JSON.parse(data.orders_array);
    
    // orders_arr.forEach((item: any) => {
    //   if (data.take_way === 'self') {
    //     RestApi.getDb("order")
    //     .update({ "status": "delivered", "date": Utils.toSqlDateTime(new Date()) }, "id")
    //     .where({ id: item })
    //     .then((result) => {
    //       console.log("update order delivered ", result);
    //     })
    //     .catch((err) => {
    //       console.log("update order items failed");
    //     });
    //   } else {
    //     RestApi.getDb("order")
    //     .update({ "status": "delivered", "cargate": data.cargateid, "date": Utils.toSqlDateTime(new Date()) }, "id")
    //     .where({ id: item })
    //     .then((result) => {
    //       console.log("update order delivered ", result);
    //     })
    //     .catch((err) => {
    //       console.log("update order items failed");
    //     });
    //   }
    // });

    // order codes for noti message
    orders_arr.forEach((item: any) => {
      RestApi.getDb("order")
        .select("ordercode")
        .where({ id: item })
        .then((result) => {
          orderCode.push(' '+result[0].ordercode);
          orderCodes = orderCode.toString();
          console.log("select ordercode success");
        })
        .catch((err) => {
          console.log("select ordercode fail");
        });
    });
    
  
    orders_arr.forEach((order: any) => {
      let order_items: any = {};
      order_items.id = uuid.v4();
      order_items.orderdeliveryid = data.id;
      console.log("order id", order);
      order_items.orderid = order;
      order_items.createddate = Utils.toSqlDate(new Date());
      order_items.updateddate = Utils.toSqlDate(new Date());
      orders_result.push(order_items);
    });
    delete data.orders_array;
    // console.log("orders_result ", orders_result);
    RestApi.getDb("autogenerate").select("*").where("prefix", prefix)
      .then((autogen) => {
        if (autogen[0].datecode == datecode) {
          count = autogen[0].count + 1;
        } else {
          count++;
          autogen[0].datecode = datecode;
        }
        autogen[0].count = count;
        autogen[0].updateddate = Utils.toSqlDate(new Date());
        const autogenId = autogen[0].id;
        delete (autogen[0].id);
        let deliverycount: any;
        if (count < 10) {
          deliverycount = "000" + count;
        } else if (count > 9 && count < 100) {
          deliverycount = "00" + count;
        } else if (count > 99 && count < 1000) {
          deliverycount = "0" + count;
        }
        const deliverycode = prefix + deliverycount + datecode;
        data.deliverycode = deliverycode;

        return RestApi.getDb("autogenerate").where("id", autogenId).update(autogen[0], "id");
      })
      .then((result) => {
        if (data.take_way === 'self'){
          delete (data.cargateid);
        }
        console.log("order delivery data >> ", data);
        return RestApi.getDb("order_delivery").insert(data, "id");
      })
      .then((result) => {
        return RestApi.getKnex().batchInsert("orderdelivery_items", orders_result);
      })
      .then((items_result) => {
        if (data.take_way === 'bus'){
          return RestApi.getDb("car_gate")
               .select("cargatename")
               .leftJoin("order_delivery", "order_delivery.cargateid", "car_gate.id")
               .where({"order_delivery.cargateid": data.cargateid})
               .first();
        }
      })
      .then((cargate_result) => {
        if(data.take_way === 'self'){
          return RestApi.getDb("order_noti").select().where({ status: "Delivery-Self" });
        } else {
          carGate = cargate_result.cargatename;
          console.log("carGate ", carGate);
          return RestApi.getDb("order_noti").select().where({ status: "Delivery-Bus" });
        }
      })
      .then((result_order_noti) => {
        console.log("order noti ", result_order_noti);
        notimessage = result_order_noti.length > 0 ? result_order_noti[0].notiformat.toString() : "";
        notimessage = notimessage.replace("OrderNo", "Order No."+orderCodes);
        notimessage = notimessage.replace("Cargate", carGate);
        notimessage = notimessage.replace("Quantity", parcelQty);
        return RestApi.getDb("customer_values").select().where({ customerid: data.customerid });
      })
      .then((result) => {
        console.log("customer values ", result);
        if (result && result.length > 0) {
          const token: string = result[0].firebase_token;
          if (token && token != "") {
            return noti.sendToDevice({
              token: token,
              title: "J Mahar",
              message: notimessage,
              click_action: "FLUTTER_NOTIFICATION_CLICK",
              type: "order-delivered",
              notilotid: notilogDataId
            });
          }
        } else {
          console.log("No Customer Values");
          return undefined;
        }
      })
      .then((result) => {
        notilogData.id = notilogDataId;
        notilogData.customerid = data.customerid;
        notilogData.date = Utils.toSqlDateTime(new Date());
        notilogData.type = "order-delivered";
        notilogData.notimessage = notimessage;
        notilogData.createddate = Utils.toSqlDate(new Date());
        notilogData.updateddate = Utils.toSqlDate(new Date());
        return RestApi.getDb("ordernoti_log").insert(notilogData, "id");
      })
      .then((result) => {
        const notilogData: any = result;
        orders_arr.forEach((item: any) => {
          if (data.take_way === 'self') {
            RestApi.getDb("order")
            .update({ "status": "delivered", "date": Utils.toSqlDateTime(new Date()), "delnoti_remark": notimessage }, "id")
            .where({ id: item })
            .then((result) => {
              console.log("update order delivered ", result);
            })
            .catch((err) => {
              console.log("update order items failed");
            });
          } else {
            RestApi.getDb("order")
            .update({ "status": "delivered", "cargate": data.cargateid, "date": Utils.toSqlDateTime(new Date()), "delnoti_remark": notimessage }, "id")
            .where({ id: item })
            .then((result) => {
              console.log("update order delivered ", result);
            })
            .catch((err) => {
              console.log("update order items failed");
            });
          }
        });
        return notilogData;
      })
      // .then((result) => {
      //   return RestApi.getDb("customer").select('mobile').where({ id: data.customerid })
      // })
      // .then((result) => {
      //   let mobile = result[0].mobile;
      //   console.log("mobile >>", mobile);
      //   if(mobile.charAt(0) === '0'){
      //     mobile = mobile.slice(1);
      //   }
      //   console.log("mobile ", mobile);
      //   const smsData = { 
      //     MobileNo: mobile,
      //     APIKey: '44DBFLpdls1r6WaMiQYra3wAI4hon28Eu4ZWCrOvU+Y=',
      //     SchduleDate: '',
      //     EmailId: 'info@newwave-tech.com',
      //     SMSType: 'T',
      //     SenderCode: 'J-Mahar',
      //     Message: notimessage
      //   };
      //   console.log("smsData ", smsData);
      //   const config = {
      //     headers: {
      //         'Content-Type': 'application/x-www-form-urlencoded'
      //     }
      //   };
      //   axios.post('https://digitxt.yellowstone.com.mm/Services/SMSSerivce.asmx/SendBulkSMS', qs.stringify(smsData), config)
      //   .then((res) => {
      //       console.log(`Status: ${res.status}`);
      //       console.log('Body: ', res.data);
      //   }).catch((err) => {
      //       console.log(err);
      //   });
      //   res.json({ "success": result });
      // })
      .then((result) => {
        console.log("result ", result);
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }

  public getDeliveryDetail(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(next);
    }
    
    let params: any = { title: config.appname, user: req.user.username, listUrl: "/order-delivery", params: data };
    params = Permission.getMenuParams(params, req, res);
    RestApi.getDb("order_delivery")
      .select("order_delivery.*", "customer.name", "car_gate.cargatename")
      .leftJoin("customer", "order_delivery.customerid", "customer.id")
      .leftJoin("car_gate", "order_delivery.cargateid", "car_gate.id")
      .where("order_delivery.id", data.id)
      .then((result) => {
        params.params = Utils.mixin(data, result[0]);
        params.params.date = Utils.toDisplayDate(params.params.date);
        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/order-delivery-detail", params);
        console.log("result >>", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public getDeliveryItemDetail(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id, deliveryid: req.params.deliveryid };
    let total: number = 0;
    let order_items: any = [];
    console.log("data ",data);
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(next);
    }
    
    let params: any = { title: config.appname, user: req.user.username, listUrl: "/order-delivery/detail/"+data.deliveryid, params: data };
    console.log("params1 ", params);
    params = Permission.getMenuParams(params, req, res);
    console.log("params2 ", params);
    RestApi.getDb("order")
      .leftJoin("customer", "order.customerid", "customer.id")
      .leftJoin("car_gate", "order.cargate", "car_gate.id")
      .where("order.id", data.id)
      .select("order.*", "customer.name", "car_gate.cargatename")
      .then((result) => {
        params.params = Utils.mixin(data, result[0]);
        params.params.orderdate = Utils.toDisplayDate(params.params.orderdate);
        params.params.netamount = Utils.numberWithCommas(params.params.netamount);
        return RestApi.getDb("order_items as oi")
          .select("oi.id as orderitemid", "oi.orderid", "oi.productid", "oi.price", "oi.orderqty", "oi.replyqty", "product.id","product.productcode", "product.productname", "product.price", "product.itemcount")
          .leftJoin("product", "oi.productid", "product.id")
          .where("oi.orderid", data.id);
      })
      .then((order_items_result) => {
        order_items = order_items_result;
        order_items.forEach((order_item: any) => {
          order_item.qty = order_item.replyqty;
          total = order_item.price * order_item.replyqty;
          order_item.total = Utils.numberWithCommas(total);
          order_item.price = Utils.numberWithCommas(order_item.price);
        });
        params.params.details = order_items;
        return RestApi.getDb("customer").select().where("id", params.params.customerid);
      })
      .then((customer) => {
        params.params.customer = customer;

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/order-delivery-item-detail", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public getDelList(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/delivery-list", params: {} };
    params = Permission.getMenuParams(params, req, res);

    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/delivery-list", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/delivery-list", params);
    }
  }

  public getDelListDetail(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    let total: number = 0;
    let order_items: any = [];
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(next);
    }
    const postUrl = `/delivery-list/details/${data.id}`;
    let params: any = { title: config.appname, postUrl: postUrl, listUrl: "/delivery-list", params: data };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("order")
      .leftJoin("customer", "order.customerid", "customer.id")
      .leftJoin("car_gate", "order.cargate", "car_gate.id")
      .where("order.id", data.id)
      .select("order.*", "customer.name", "car_gate.cargatename")
      .then((result) => {
        params.params = Utils.mixin(data, result[0]);
        params.params.netamount = Utils.numberWithCommas(params.params.netamount);
        return RestApi.getDb("order_items as oi")
          .select("oi.id as orderitemid", "oi.orderid", "oi.productid", "oi.price", "oi.orderqty", "oi.replyqty", "product.id", "product.productcode", "product.productname", "product.price", "product.itemcount")
          .leftJoin("product", "oi.productid", "product.id")
          .where("oi.orderid", data.id);
      })
      .then((order_items_result) => {
        order_items = order_items_result;
        order_items.forEach((order_item: any) => {
            order_item.qty = order_item.replyqty;
            total = order_item.price * order_item.replyqty;
            order_item.total = Utils.numberWithCommas(total);
            order_item.price = Utils.numberWithCommas(order_item.price);
        });
        params.params.details = order_items;
        return RestApi.getDb("customer").select().where("id", params.params.customerid);
      })
      .then((customer) => {
        params.params.customer = customer;

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/delivery-list-details", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

}

export default new OrderDeliveryRouter();