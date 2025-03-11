const log4js = require('log4js');
const path = require('path');
const os = require('os');
const fs = require('fs');

class Logger {
    constructor() {
        this.logDir = path.join(os.homedir(), '.uuint', 'logs');
        this.initLogger();
    }

    initLogger() {
        // 确保日志目录存在
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }

        // 配置log4js
        log4js.configure({
            appenders: {
                console: { 
                    type: 'console',
                    layout: {
                        type: 'pattern',
                        pattern: '[%d{yyyy-MM-dd hh:mm:ss}] [%p] [%c] - %m'
                    }
                },
                file: {
                    type: 'dateFile',
                    filename: path.join(this.logDir, 'app.log'),
                    pattern: 'yyyy-MM-dd',
                    compress: true,
                    keepFileExt: true,
                    numBackups: 7,
                    layout: {
                        type: 'pattern',
                        pattern: '[%d{yyyy-MM-dd hh:mm:ss}] [%p] [%c] - %m'
                    }
                }
            },
            categories: {
                default: {
                    appenders: ['console', 'file'],
                    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info'
                },
                crawler: {
                    appenders: ['console', 'file'],
                    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info'
                },
                fixer: {
                    appenders: ['console', 'file'],
                    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info'
                }
            }
        });
    }

    getCallerCategory() {
        const error = new Error();
        const stack = error.stack.split('\n');
        // 获取调用者的文件名
        const callerLine = stack[3]; // 0是Error, 1是当前函数, 2是info/error等方法, 3是实际调用者
        const match = callerLine.match(/\((.+?)\)/) || callerLine.match(/at (.+?):\d+/);
        if (match) {
            const filePath = match[1];
            const fileName = path.basename(filePath, '.cjs');
            return fileName;
        }
        return 'default';
    }

    info(message) {
        const category = this.getCallerCategory();
        const logger = log4js.getLogger(category);
        logger.info(message);
    }

    error(message, error) {
        const category = this.getCallerCategory();
        const logger = log4js.getLogger(category);
        if (error) {
            logger.error(`${message}: ${error.message}\n${error.stack}`);
        } else {
            logger.error(message);
        }
    }
}

module.exports = new Logger();