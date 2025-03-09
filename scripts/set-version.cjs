const fs = require('fs');
const execSync = require('child_process').execSync;
const path = require("path");

let version;
try {
  version = execSync('git describe --tags').toString().trim();
} catch (e) {
  version = '0.0.0';  // 如果没有标签，使用默认版本号
}
// 获取最新的 Git 标签
const packageJson = require('../package.json');

// 更新 version 字段为 Git 标签
packageJson.version = version;
fs.writeFileSync(path.resolve(__dirname, '../package.json'), JSON.stringify(packageJson, null, 2));
console.log(`Using version: ${version}`);