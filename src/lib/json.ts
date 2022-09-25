/**
 * JSON file loader
 */
import * as fs from "fs";
import * as pathModule from "path";

const __root = (function getRootPath() {
  if (process.env.APP_ROOT_PATH) {
    return process.env.APP_ROOT_PATH;
  }
  const getRoot = function(dir: string): string {
    try {
      const isPkgJson = fs.accessSync(pathModule.join(dir, "./package.json"));
      const is_node_modules = fs.accessSync(pathModule.join(dir, "./node_modules"));
    } catch (e) {
      if (dir === "/") {
        throw new Error("Project root (package.json & node_modules location)");
      }
      return getRoot(pathModule.join(dir, ".."));
    }
    return dir;
  };

  return getRoot(__dirname);
})();

export function load(fileName: string, dir: string = __root): any {
  const filePath = pathModule.resolve(dir, fileName);
  if (fs.existsSync(filePath)) {
    const buffer = fs.readFileSync(filePath, "utf8");
    try {
      return JSON.parse(buffer.toString());
    } catch (e) { }
  }
  return {};
}