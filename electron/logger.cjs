const path = require('path');
const fs = require('fs');
let chalk;
(async () => {
    chalk = (await import('chalk')).default;})();
const os = require('os');

class Logger {
    constructor() {
        // 初始化颜色配置
        this.colors = {};
        this.isInitialized = false;
        this.initializePromise = this.initColors();
    }

    async initColors() {
        try {
            // 等待chalk模块加载完成
            while (!chalk) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            this.colors = {
                info: chalk.blue,
                warn: chalk.yellow,
                error: chalk.red,
                debug: chalk.gray
            };

            // 设置日志目录
            this.logDir = path.join(os.homedir(), '.uuint', 'logs');
            await this.initLogDir();

            // 当前日志文件路径
            this.currentLogFile = path.join(this.logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
            
            // 日志文件大小限制（10MB）
            this.maxLogSize = 10 * 1024 * 1024;
            
            // 保留的日志文件数量
            this.maxLogFiles = 7;
            this.isInitialized = true;
        } catch (error) {
            console.error('Error initializing logger colors:', error);
            // 设置默认颜色（无颜色）
            this.colors = {
                info: text => text,
                warn: text => text,
                error: text => text,
                debug: text => text
            };
            this.isInitialized = true;
        }
    }

    // 初始化日志目录
    async initLogDir() {
        // 确保日志目录存在
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }

        // 设置当前日志文件路径
        this.currentLogFile = path.join(this.logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
        
        // 日志文件大小限制（10MB）
        this.maxLogSize = 10 * 1024 * 1024;
        
        // 保留的日志文件数量
        this.maxLogFiles = 7;
    }



    // 写入日志
    async _writeLog(level, message) {
        // 确保初始化完成
        if (!this.isInitialized) {
            await this.initializePromise;
        }

        const timestamp = new Date().toISOString();
        const coloredLevel = this.colors[level] ? this.colors[level](level) : level;
        const logEntry = `[${timestamp}] [${level}] ${message}\n`;
        const consoleEntry = `[${timestamp}] [${coloredLevel}] ${message}`;

        try {
            // 检查文件大小
            if (fs.existsSync(this.currentLogFile)) {
                const stats = fs.statSync(this.currentLogFile);
                if (stats.size >= this.maxLogSize) {
                    this._rotateLog();
                }
            }

            // 写入日志
            fs.appendFileSync(this.currentLogFile, logEntry);

            // 在开发环境下同时输出到控制台（带颜色）
            if (process.env.NODE_ENV === 'development') {
                console.log(consoleEntry);
            }
        } catch (error) {
            console.error('Error writing to log file:', error);
        }
    }

    // 日志轮转
    _rotateLog() {
        // 获取所有日志文件
        const logFiles = fs.readdirSync(this.logDir)
            .filter(file => file.startsWith('app-'))
            .sort();

        // 如果超过最大文件数，删除最旧的文件
        while (logFiles.length >= this.maxLogFiles) {
            const oldestFile = logFiles.shift();
            fs.unlinkSync(path.join(this.logDir, oldestFile));
        }

        // 创建新的日志文件
        this.currentLogFile = path.join(this.logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
    }

    // 日志级别方法
    async info(message) {
        await this._writeLog('info', message);
    }

    async warn(message) {
        await this._writeLog('warn', message);
    }

    async error(message) {
        await this._writeLog('error', message);
    }

    async debug(message) {
        await this._writeLog('debug', message);
    }
}

// 创建单例实例
const logger = new Logger();

module.exports = logger;