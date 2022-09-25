/**
 * https://github.com/guyht/notp
 */

import * as crypto from "crypto";

/**
 * convert an integer to a byte array
 * @param {Integer} num
 * @return {Array} bytes
 */
function intToBytes(num: number) {
  const bytes = [];

  for (let i = 7 ; i >= 0 ; --i) {
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
function hexToBytes(hex: string) {
  const bytes = [];
  for (let c = 0, C = hex.length; c < C; c += 2) {
    bytes.push(parseInt(hex.substr(c, 2), 16));
  }
  return bytes;
}

export interface IHotpOptions {
  /**
   * Counter value.  This should be stored by the application, must
   * be user specific, and be incremented for each request.
   */
  counter?: number;
  /**
   * Length of otp code. Default - 6
   */
  length?: number;
  /**
   * The allowable margin for the counter.  The function will check
   *         'W' codes in the future against the provided passcode.  Note,
   *         it is the calling applications responsibility to keep track of
   *         'W' and increment it for each password check, and also to adjust
   *         it accordingly in the case where the client and server become
   *         out of sync (second argument returns non zero).
   *         E.g. if W = 100, and C = 5, this function will check the passcode
   *         against all One Time Passcodes between 5 and 105.
   *
   *         Default - 50
   */
  window?: number;
}

export interface ITotpOptions extends IHotpOptions {
  /**
   * The time step of the counter.  This must be the same for
   * every request and is used to calculat C.
   * Default - 30
   */
  time?: number;
  _t?: number;
}

export interface IVerifyResult {
  delta: number;
}

/**
 * Counter based One Time Password
 */
export class Hotp {
  /**
   * Generate a counter based One Time Password
   * @param key Key for the one time password.  This should be unique and secret for
   *            every user as this is the seed that is used to calculate the HMAC
   * @param opt options
   * @return {String} the one time password
   */
  gen(key: string = "", opt: IHotpOptions = {}): string {
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
      (h[offset + 2] & 0xff) << 8  |
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
  verify(token: string, key: string = "", opt: IHotpOptions = {}): IVerifyResult {
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

/**
 * Time based One Time Password
 */
export class Totp {
  private hotp: Hotp;

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
  gen(key: string = "", opt: ITotpOptions = {}): string {
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
  verify(token: string, key: string = "", opt: ITotpOptions = {}): IVerifyResult {
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