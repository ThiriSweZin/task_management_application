"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase = __importStar(require("firebase-admin"));
// import serviceAccount from "../../data/service-account.debug.json";
const service_account_json_1 = __importDefault(require("../../data/service-account.json"));
const DATABASE_URL = `https://${service_account_json_1.default.project_id}.firebaseio.com`;
class Notification {
    constructor() {
        if (firebase.apps.length == 0) {
            this.app = firebase.initializeApp({
                credential: firebase.credential.cert(service_account_json_1.default),
                databaseURL: DATABASE_URL
            });
        }
    }
    sendToTopic(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const topic = "jmahar";
            const payload = {
                data: data
            };
            // console.log(payload);
            if (data) {
                // Send a message to devices subscribed to the provided topic.
                return yield firebase.messaging().sendToTopic(topic, payload);
            }
            else {
                throw new Error("Invalid data" + data);
            }
        });
    }
    sendToDevice(data) {
        const token = data.token || undefined;
        const options = {
            priority: 'high'
        };
        console.log("data >>", data);
        if (!token) {
            throw new Error("Require 'token' in data.");
        }
        const payload = {};
        if (data.body) {
            payload.notification = {
                title: data.title,
                body: data.message,
                sound: "default"
            };
        }
        else {
            delete data.token;
            payload.data = data;
        }
        console.log("payload data >>", payload);
        console.log("token >>", token);
        return firebase.messaging().sendToDevice(token, payload, options);
    }
    send(data) {
        const token = data.token || undefined;
        const topic = data.topic || undefined;
        const payload = {};
        console.log("data in firebase ", data.body);
        if (data.body) {
            console.log("if ");
            payload.notification = {
                title: data.title,
                body: data.message,
                sound: "default"
            };
        }
        else {
            console.log("else ");
            payload.data = data;
            if (token) {
                delete payload.data.token;
                payload.token = token;
            }
            else {
                delete payload.data.topic;
                payload.topic = topic;
            }
        }
        console.log("playload in firebase ", payload);
        return firebase.messaging().send(payload);
    }
}
exports.Notification = Notification;
//# sourceMappingURL=firebase-msg.js.map