"use strict";
/**
 * https://github.com/guyht/notp
 */
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = __importStar(require("crypto"));
/**
 * convert an integer to a byte array
 * @param {Integer} num
 * @return {Array} bytes
 */
function intToBytes(num) {
    const bytes = [];
    for (let i = 7; i >= 0; --i) {
        bytes[i] = num & (255);
        num = num >> 8;
    }
    return bytes;
}
/**
 * convert a hex value to a byte array
 * @param {String} hex string of hex to convert to a byte array
 * @return {Array} bytes
 */
function hexToBytes(hex) {
    const bytes = [];
    for (let c = 0, C = hex.length; c < C; c += 2) {
        bytes.push(parseInt(hex.substr(c, 2), 16));
    }
    return bytes;
}
/**
 * Counter based One Time Password
 */
class Hotp {
    /**
     * Generate a counter based One Time Password
     * @param key Key for the one time password.  This should be unique and secret for
     *            every user as this is the seed that is used to calculate the HMAC
     * @param opt options
     * @return {String} the one time password
     */
    gen(key = "", opt = {}) {
        const counter = opt.counter || 0;
        const p = opt.length || 6;
        // Create the byte array
        const b = new Buffer(intToBytes(counter));
        const hmac = crypto.createHmac("sha1", new Buffer(key));
        // Update the HMAC with the byte array
        const digest = hmac.update(b).digest("hex");
        // Get byte array
        const h = hexToBytes(digest);
        // Truncate
        const offset = h[19] & 0xf;
        let v = (h[offset] & 0x7f) << 24 |
            (h[offset + 1] & 0xff) << 16 |
            (h[offset + 2] & 0xff) << 8 |
            (h[offset + 3] & 0xff);
        const z = Array(p + 1).join("0");
        const o = parseInt(`1${z}`);
        v = (v % o);
        return (z + v).slice(-p);
    }
    /**
     * Check a One Time Password based on a counter.
     * @param token Passcode to validate.
     * @param key Key for the one time password.  This should be unique and secret for
     *            every user as it is the seed used to calculate the HMAC
     * @param opt options
     * @return {Object} null if failure, { delta: # } on success
     *  delta is the time step difference between the client and the server
     */
    verify(token, key = "", opt = {}) {
        const window = opt.window || 50;
        const counter = opt.counter || 0;
        // Now loop through from C to C + W to determine if there is
        // a correct code
        for (let i = counter - window; i <= counter + window; ++i) {
            opt.counter = i;
            if (this.gen(key, opt) === token) {
                // We have found a matching code, trigger callback
                // and pass offset
                return { delta: i - counter };
            }
        }
        // If we get to here then no codes have matched, return null
        return undefined;
    }
}
exports.Hotp = Hotp;
/**
 * Time based One Time Password
 */
class Totp {
    constructor() {
        this.hotp = new Hotp();
    }
    /**
     * Generate a time based One Time Password
     * @param key Key for the one time password.  This should be unique and secret for
     *            every user as it is the seed used to calculate the HMAC
     * @param opt Options
     * @return {String} the one time password
     */
    gen(key = "", opt = {}) {
        const time = opt.time || 30;
        let _t = Date.now();
        // Time has been overwritten.
        if (opt._t) {
            if (process.env.NODE_ENV != "test") {
                throw new Error("cannot overwrite time in non-test environment!");
            }
            _t = opt._t;
        }
        // Determine the value of the counter, C
        // This is the number of time steps in seconds since T0
        opt.counter = Math.floor((_t / 1000) / time);
        return this.hotp.gen(key, opt);
    }
    /**
     * Check a One Time Password based on a timer.
     * @param token Passcode to validate.
     * @param key Key for the one time password.  This should be unique and secret for
     *            every user as it is the seed used to calculate the HMAC
     * @param opt Options
     * @return {Object} null if failure, { delta: # } on success
     * delta is the time step difference between the client and the server
     */
    verify(token, key = "", opt = {}) {
        const time = opt.time || 30;
        let _t = Date.now();
        // Time has been overwritten.
        if (opt._t) {
            if (process.env.NODE_ENV != "test") {
                throw new Error("cannot overwrite time in non-test environment!");
            }
            _t = opt._t;
        }
        // Determine the value of the counter, C
        // This is the number of time steps in seconds since T0
        opt.counter = Math.floor((_t / 1000) / time);
        return this.hotp.verify(token, key, opt);
    }
}
exports.Totp = Totp;
//# sourceMappingURL=notp.js.map