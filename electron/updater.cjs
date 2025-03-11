const { autoUpdater } = require('electron-updater');
const { app, ipcMain, dialog } = require('electron');
const logger = require('./logger.cjs');

class Updater {
    constructor(mainWindow) {
        this.mainWindow = mainWindow;
        this.initialize();
    }

    initialize() {
        // 配置自动更新
        autoUpdater.autoDownload = false;
        autoUpdater.logger = logger;

        // 检查更新
        autoUpdater.on('checking-for-update', () => {
            this.sendStatusToWindow('checking-for-update', '正在检查更新...');
        });

        // 有可用更新
        autoUpdater.on('update-available', (info) => {
            this.sendStatusToWindow('update-available', '发现新版本', info);
            dialog.showMessageBox(this.mainWindow, {
                type: 'info',
                title: '发现新版本',
                message: `发现新版本 ${info.version}\n是否现在下载？`,
                buttons: ['下载', '取消'],
                cancelId: 1
            }).then(({ response }) => {
                if (response === 0) {
                    autoUpdater.downloadUpdate();
                }
            });
        });

        // 没有可用更新
        autoUpdater.on('update-not-available', (info) => {
            this.sendStatusToWindow('update-not-available', '当前已是最新版本', info);
            dialog.showMessageBox(this.mainWindow, {
                type: 'info',
                title: '检查更新',
                message: '当前已是最新版本',
                buttons: ['确定']
            });
        });

        // 更新下载进度
        autoUpdater.on('download-progress', (progressObj) => {
            this.sendStatusToWindow('download-progress', '正在下载更新...', progressObj);
        });

        // 更新下载完成
        autoUpdater.on('update-downloaded', (info) => {
            this.sendStatusToWindow('update-downloaded', '更新已下载，重启应用后生效', info);
            dialog.showMessageBox(this.mainWindow, {
                type: 'info',
                title: '更新已就绪',
                message: '更新已下载完成，是否现在重启应用？',
                buttons: ['重启', '稍后'],
                cancelId: 1
            }).then(({ response }) => {
                if (response === 0) {
                    autoUpdater.quitAndInstall();
                }
            });
        });

        // 更新错误
        autoUpdater.on('error', (err) => {
            this.sendStatusToWindow('error', '更新出错', err);
            dialog.showMessageBox(this.mainWindow, {
                type: 'error',
                title: '更新错误',
                message: `检查更新失败：${err.message}`,
                buttons: ['确定']
            });
        });

        // 处理来自渲染进程的更新请求
        try {
            ipcMain.removeHandler('check-for-update');
            ipcMain.removeHandler('download-update');
            ipcMain.removeHandler('quit-and-install');
        } catch (error) {
            // 忽略移除不存在的处理程序时的错误
        }

        ipcMain.handle('check-for-update', () => {
            return this.checkForUpdates();
        });

        ipcMain.handle('download-update', () => {
            return autoUpdater.downloadUpdate();
        });

        ipcMain.handle('quit-and-install', () => {
            autoUpdater.quitAndInstall();
        });
    }

    sendStatusToWindow(status, message, data = null) {
        this.mainWindow.webContents.send('update-message', {
            status,
            message,
            data
        });
    }

    // 检查更新
    checkForUpdates() {
        if (process.env.NODE_ENV === 'development') {
            this.sendStatusToWindow('error', '开发环境不支持自动更新');
            dialog.showMessageBox(this.mainWindow, {
                type: 'info',
                title: '检查更新',
                message: '开发环境不支持自动更新',
                buttons: ['确定']
            });
            return;
        }
        // 避免重复检查更新
        if (this._isChecking) return;
        this._isChecking = true;
        autoUpdater.checkForUpdates().finally(() => {
            this._isChecking = false;
        });
    }
}

module.exports = Updater;