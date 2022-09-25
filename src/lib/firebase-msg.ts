import * as firebase from "firebase-admin";
// import serviceAccount from "../../data/service-account.debug.json";
import serviceAccount from "../../data/service-account.json";

const DATABASE_URL = `https://${serviceAccount.project_id}.firebaseio.com`;

export class Notification {
  public app: firebase.app.App;

  constructor() {
    if (firebase.apps.length == 0) {
      this.app = firebase.initializeApp({
        credential: firebase.credential.cert(serviceAccount),
        databaseURL: DATABASE_URL
      });
    }
  }

  public async sendToTopic(data: any) {
    const topic = "jmahar";
    const payload = {
      data: data
    };
    // console.log(payload);
    if (data) {
      // Send a message to devices subscribed to the provided topic.
      return await firebase.messaging().sendToTopic(topic, payload);
    } else {
      throw new Error("Invalid data" + data);
    }
  }

  public sendToDevice(data: any): Promise<firebase.messaging.MessagingDevicesResponse> {
    const token = data.token || undefined;
    const options = {
      priority: 'high'
    };
    console.log("data >>", data);
    if (!token) {
      throw new Error("Require 'token' in data.");
    }
    const payload: any = {};
    if (data.body) {
      payload.notification = {
        title: data.title,
        body: data.message,
        sound: "default"
      };
    } else {
      delete data.token;
      payload.data = data;
    }
    console.log("payload data >>", payload);
    console.log("token >>", token);
    return firebase.messaging().sendToDevice(token, payload, options);
  }

  public send(data: any): Promise<string> {
    const token = data.token || undefined;
    const topic = data.topic || undefined;
    const payload: any = {};
    
    console.log("data in firebase ", data.body);
    if (data.body) {
      console.log("if ");
      payload.notification = {
        title: data.title,
        body: data.message,
        sound: "default"
      };
    } else {
      console.log("else ");
      payload.data = data;
      
      if (token) {
        delete payload.data.token;
        payload.token = token;
      } else {
        delete payload.data.topic;
        payload.topic = topic;
      }
    }
    console.log("playload in firebase ", payload);

    return firebase.messaging().send(payload);
  }
  
}
