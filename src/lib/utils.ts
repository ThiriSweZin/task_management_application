/**
 * Utils
 */
import * as crypto from "crypto";
import * as fs from "fs";
import * as pathModule from "path";
import * as DateFormat from "./date-and-time";
import moment = require("moment");

export class PathfinderError extends Error {
  public findPath: string;

  constructor(findPath: string, message?: string | undefined) {
      super(message);
      this.findPath = findPath;
  }
}

export class Utils {
  private static date = DateFormat.default;

  constructor() {}

  public static mixin(dest: any, src: any, redefine: boolean = true) {
    if (!dest) {
      throw new TypeError("argument dest is required");
    }
    if (!src) {
      throw new TypeError("argument src is required");
    }
    const hasOwnProperty = Object.prototype.hasOwnProperty;
    Object.getOwnPropertyNames(src).forEach((name) => {
      if (!redefine && hasOwnProperty.call(dest, name)) {
        return;
      }
      const descriptor = Object.getOwnPropertyDescriptor(src, name);
      Object.defineProperty(dest, name, descriptor);
    });
    return dest;
  }

  public static encodeUrl(url: string): string {
    return url.replace(/%/g, "%25")
        .replace(/\n/g, "%0A")
        .replace(/\r/g, "%0D")
        .replace(/\s/g, "%20")
        .replace(/[!#$&'\(\)\*\+,/:;=\?@\[\]\"\-.<>\\^_`\{|\}~]/g, function(x) {
          return `%${x.charCodeAt(0).toString(16)}`;
        });
  }

  public static decodeUrl(url: string): string {
    url = `${url}`;
    try {
      url = decodeURIComponent(url);
    } catch (err) { }
    url = url.replace(/%([0-9A-F]{2})/g, (x, x1) => {
      return String.fromCharCode(parseInt(x1, 16));
    });
    return url;
  }

  public static isEmpty(obj: any): boolean {
    if (typeof obj === "undefined") return true;
    if (!obj) return true;
    if (typeof obj === "number" && isNaN(obj)) return true;
    if (typeof obj === "string" && obj == "") return true;
    if (typeof obj === "object") {
      if (Array.isArray(obj) && obj.length == 0) {
        return true;
      } else {
        const temp = JSON.stringify(obj).replace(/[\{\}\[\]\s]/g, "");
        return (temp === "");
      }
    }
    return false;
  }

  public static tryGet(obj: any|any[], key: string|number, defVal: any = {}) {
    if (!obj || typeof obj != "object") return defVal;
    if ((!key && key != 0) || typeof key == "undefined") return defVal;
    if (typeof key == "string" && key == "") return defVal;
    if (typeof key == "number" && key < 0) return defVal;
    if (typeof obj[key] !== "undefined") {
      return obj[key];
    }
    return defVal;
  }

  public static tryParseInt(val: any, def: number = 0): number {
    let v = `${val}`;
    const regex = new RegExp("[^0-9]", "g");
    v = v.replace(regex, "");
    try {
      return parseInt(v);
    } catch {
    }
    return def;
  }

  public static tryParseBoolean(val: any): boolean {
    const v = `${val}`;
    const match = /^(true|false|[\d]+)$/i.exec(v);
    if (!match) {
      const temp = JSON.stringify(val).replace(/[\{\}\[\]\s\"\']/g, "");
      return (temp.length > 0);
    } else if (/[0-9]+/.test(`${match[1]}`)) {
      const v1 = `${match[1]}`;
      try {
        return (parseInt(v1) > 0);
      } catch {
      }
      return false;
    } else {
      return (match[1].toLowerCase() != "false");
    }
  }

  public static toSqlDate(dateVal?: any, fromFormat: string = "DD/MM/YYYY") {
    if (!dateVal) {
      return "";
    }
    let dateObj: Date = new Date();
    if (typeof dateVal === "string") {
      dateVal = dateVal.replace(/^(\d{2,4}-\d{1,2}-\d{1,2})T(\d{1,2}:\d{1,2}:\d{1,2}.\d{1,3})(.*)$/, "$1");
      dateObj = Utils.date.parse(dateVal, fromFormat);
    } else if (typeof dateVal === "object" && typeof dateVal.getTime == "function") {
      dateObj = new Date(dateVal.getTime());
    }
    if (typeof dateObj.getTime !== "function") {
      return "";
    }
    return Utils.date.format(dateObj, "YYYY-MM-DD");
  }

  public static toSqlDateWithM(dateVal?: any, fromFormat: string = "DD/MMM/YYYY") {
    if (!dateVal) return "";
    let dateObj: Date = new Date();
    if (typeof dateVal === "string") {
      dateVal = dateVal.replace(/^(\d{2,4}-\d{1,2}-\d{1,2})T(\d{1,2}:\d{1,2}:\d{1,2}.\d{1,3})(.*)$/, "$1");
      dateObj = Utils.date.parse(dateVal, fromFormat);
    } else if (typeof dateVal === "object" && typeof dateVal.getTime == "function") {
      dateObj = new Date(dateVal.getTime());
    }
    if (typeof dateObj.getTime !== "function") return "";
    return Utils.date.format(dateObj, "YYYY-MM-DD");
  }

  public static toSqlDateMMMM(dateVal?: any, fromFormat: string = "D/MMMM/YYYY") {
    if (!dateVal) {
      return "";
    }
    let dateObj: Date = new Date();
    if (typeof dateVal === "string") {
      dateVal = dateVal.replace(/^(\d{2,4}-\d{1,2}-\d{1,2})T(\d{1,2}:\d{1,2}:\d{1,2}.\d{1,3})(.*)$/, "$1");
      dateObj = Utils.date.parse(dateVal, fromFormat);
    } else if (typeof dateVal === "object" && typeof dateVal.getTime == "function") {
      dateObj = new Date(dateVal.getTime());
    }
    if (typeof dateObj.getTime !== "function") {
      return "";
    }
    return Utils.date.format(dateObj, "YYYY-MM-DD");
  }

  public static toSqlDateDDMMYYYY(dateVal?: any, fromFormat: string = "DD-MM-YYYY") {
    if (!dateVal) {
      return "";
    }
    let dateObj: Date = new Date();
    if (typeof dateVal === "string") {
      dateVal = dateVal.replace(/^(\d{2,4}-\d{1,2}-\d{1,2})T(\d{1,2}:\d{1,2}:\d{1,2}.\d{1,3})(.*)$/, "$1");
      dateObj = Utils.date.parse(dateVal, fromFormat);
    } else if (typeof dateVal === "object" && typeof dateVal.getTime == "function") {
      dateObj = new Date(dateVal.getTime());
    }
    if (typeof dateObj.getTime !== "function") {
      return "";
    }
    return Utils.date.format(dateObj, "YYYY-MM-DD");
  }

  public static numberWithCommas(number: number) {
    const parts = number.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }

  public static toSqlDateTime(dateVal?: any, fromFormat: string = "DD/MM/YYYY") {
    if (!dateVal) {
      return "";
    }
    let dateObj: Date = new Date();
    if (typeof dateVal === "string") {
      dateVal = dateVal.replace(/^(\d{2,4}-\d{1,2}-\d{1,2})T(\d{1,2}:\d{1,2}:\d{1,2}.\d{1,3})(.*)$/, "$1");
      dateObj = Utils.date.parse(dateVal, fromFormat);
    } else if (typeof dateVal === "object" && typeof dateVal.getTime == "function") {
      dateObj = new Date(dateVal.getTime());
    }
    if (typeof dateObj.getTime !== "function") {
      return "";
    }
    return Utils.date.format(dateObj, "YYYY-MM-DD HH:mm");
  }

  public static toSqlTime(dateVal?: any, fromFormat: string = "HH:mm") {
    if (!dateVal) {
      return "";
    }
    let dateObj: any;
    dateObj = moment(dateVal, "hh:mm a").format("HH:mm");
    console.log("dateObj 1 ", dateObj);
    return dateObj;
  }

  public static toDateCode(dateVal?: any, fromFormat: string = "DD/MM/YYYY") {
    if (!dateVal) {
      return "";
    }
    let dateObj: Date = new Date();
    if (typeof dateVal === "string") {
      dateVal = dateVal.replace(/^(\d{2,4}-\d{1,2}-\d{1,2})T(\d{1,2}:\d{1,2}:\d{1,2}.\d{1,3})(.*)$/, "$1");
      dateObj = Utils.date.parse(dateVal, fromFormat);
    } else if (typeof dateVal === "object" && typeof dateVal.getTime == "function") {
      dateObj = new Date(dateVal.getTime());
    }
    if (typeof dateObj.getTime !== "function") {
      return "";
    }
    return Utils.date.format(dateObj, "DDMMYYYY");
  }

  public static toDisplayDate(dateVal?: any, fromFormat: string = "YYYY-MM-DD") {
    if (!dateVal) {
      return "";
    }
    let dateObj = new Date();
    if (typeof dateVal === "string") {
      dateVal = dateVal.replace(/^(\d{2,4}-\d{1,2}-\d{1,2})T(\d{1,2}:\d{1,2}:\d{1,2}.\d{1,3})(.*)$/, "$1");
      dateObj = Utils.date.parse(dateVal, fromFormat);
    } else if (typeof dateVal === "object" && typeof dateVal.getTime == "function") {
      dateObj = new Date(dateVal.getTime());
    }
    if (typeof dateObj.getTime !== "function") {
      return "";
    }
    // return Utils.date.format(dateObj, "DD/MMM/YYYY");
    return Utils.date.format(dateObj, "DD/MM/YYYY");
  }

  public static toDisplayDateTime(dateVal?: any, fromFormat: string = "YYYY-MM-DD HH:mm") {
    if (!dateVal) {
      return "";
    }
    let dateObj = new Date();
    if (typeof dateVal === "string") {
      dateVal = dateVal.replace(/^(\d{2,4}-\d{1,2}-\d{1,2})T(\d{1,2}:\d{1,2}:\d{1,2}.\d{1,3})(.*)$/, "$1");
      dateObj = Utils.date.parse(dateVal, fromFormat);
    } else if (typeof dateVal === "object" && typeof dateVal.getTime == "function") {
      dateObj = new Date(dateVal.getTime());
      // dateObj = dateVal.parse(dateVal, "YYYY-MM-DD HH:mm:ss");
    }
    if (typeof dateObj.getTime !== "function") {
      return "";
    }
    const diff = ((6 * 60) + 30) * 60000;
    const current = new Date(dateObj.getTime() + diff);
    return Utils.date.format(current, "DD/MM/YYYY HH:mm", true);
  }

  public static checksum(value: string | Buffer, options: any = {}) {
    options.algorithm = options.algorithm || "sha1";
    options.encoding = options.encoding || "hex";

    const hash = crypto.createHash(options.algorithm);
    if (!hash.write) {
      hash.update(value);
    } else {
      hash.write(value);
    }
    return hash.digest(options.encoding);
  }

  public static md5(value: string | Buffer) {
    const hash = crypto.createHash("md5");
    if (!hash.write) {
      hash.update(value);
    } else {
      hash.write(value);
    }
    return hash.digest("hex").toUpperCase();
  }

  public static deleteFile(dir: string, fileName: string, errIgnore: boolean = false) {
    return new Promise((resolve, reject) => {
      if (typeof fileName === "string" && fileName != "") {
        const filePath = pathModule.join(dir, fileName);
        if (fs.existsSync(filePath)) {
          fs.unlink(filePath, (err) => {
            if (err) {
              if (errIgnore) {
                resolve(err.message || err);
              } else {
                reject(err);
              }
            } else {
              resolve(filePath);
            }
          });
        } else {
          if (errIgnore) {
            resolve("File not found.");
          } else {
            reject(new Error("File not found."));
          }
        }
      } else {
        if (errIgnore) {
          resolve("File is empty.");
        } else {
          reject(new Error("File is empty."));
        }
      }
    });
  }

  public static promisify(fn: Function, argsNum?: number) {
    return (thisArgs: any, ...args: any[]) => {
      if (argsNum && args.length > argsNum) {
        args = args.slice(0, argsNum);
      }

      const promise = new Promise((resolve, reject) => {
        if (!args) {
          args = [];
        }
        args.push((err: any, result: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });

        try {
          fn.call(thisArgs, ...args);
        } catch (err) {
          reject(err);
        }
      });
      return promise;
    };
  }

  public static getAllUserFuncs(obj: any): string[] {
    const buildInFuncs = [
      "constructor",
      "__defineGetter__",
      "__defineSetter__",
      "hasOwnProperty",
      "__lookupGetter__",
      "__lookupSetter__",
      "isPrototypeOf",
      "propertyIsEnumerable",
      "toString",
      "valueOf",
      "__proto__",
      "toLocaleString"
    ];
    let props: string[] = [];
    if (!obj) return props;
    let objProto: any = obj;
    do {
      props = props.concat(Object.getOwnPropertyNames(objProto));
    } while (objProto = Object.getPrototypeOf(objProto));

    return props.filter((e, i, arr) => {
      if (!!~buildInFuncs.indexOf(e)) return false;
      return (e != arr[i + 1] && typeof obj[e] == "function");
    });
  }

  public static isMobileClient(userAgent: string) {
    let isMobile = false;
    // device detection
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(userAgent)
        || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(userAgent.substr(0, 4)))
      isMobile = true;

    return isMobile;
  }

  public static isEmail(email: string) {
    return /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i.test(email);
  }

}