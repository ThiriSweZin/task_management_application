"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * JSON file loader
 */
const fs = __importStar(require("fs"));
const pathModule = __importStar(require("path"));
const __root = (function getRootPath() {
    if (process.env.APP_ROOT_PATH) {
        return process.env.APP_ROOT_PATH;
    }
    const getRoot = function (dir) {
        try {
            const isPkgJson = fs.accessSync(pathModule.join(dir, "./package.json"));
            const is_node_modules = fs.accessSync(pathModule.join(dir, "./node_modules"));
        }
        catch (e) {
            if (dir === "/") {
                throw new Error("Project root (package.json & node_modules location)");
            }
            return getRoot(pathModule.join(dir, ".."));
        }
        return dir;
    };
    return getRoot(__dirname);
})();
function load(fileName, dir = __root) {
    const filePath = pathModule.resolve(dir, fileName);
    if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath, "utf8");
        try {
            return JSON.parse(buffer.toString());
        }
        catch (e) { }
    }
    return {};
}
exports.load = load;
//# sourceMappingURL=json.js.map