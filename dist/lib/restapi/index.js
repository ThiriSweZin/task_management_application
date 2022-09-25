"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * REST API index
 */
const api_1 = require("./api");
let api;
/**
 * Create and initialize Rest api.
 *
 * @param {object} config
 * @return {function}
 * @public
 */
function init(config, cb) {
    api = new api_1.RestApi(config);
    api.init()
        .then((obj) => { cb(undefined, obj); })
        .catch((err) => { cb(err); });
    return api.handle();
}
exports.init = init;
/**
 * Get current database connection.
 *
 * @param {string} tableName
 * @return {KNEX}
 * @public
 */
function getDb(tableName) {
    if (!api) {
        throw new Error("Not initialized.");
    }
    if (tableName) {
        return api.getDb()(tableName);
    }
    return api.getDb();
}
exports.getDb = getDb;
function getKnex() {
    if (!api) {
        throw new Error("Not initialized.");
    }
    return api.getDb();
}
exports.getKnex = getKnex;
/**
 * Apply custom models to api.
 *
 * @param {object|string} models
 * @public
 */
function applyModel(...args) {
    if (!api) {
        throw new Error("Not initialized.");
    }
    api.applyModel(args);
}
exports.applyModel = applyModel;
/**
 * Execute call.
 *
 * @param {object} objName Table name or model name.
 * @return {Promise}
 * @public
 */
function execute(objName) {
    return api.execute(objName);
}
exports.execute = execute;
exports.default = api;
//# sourceMappingURL=index.js.map