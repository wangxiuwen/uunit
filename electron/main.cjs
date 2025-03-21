const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const logger = require('./logger.cjs');
const { initDatabase } = require('./database.cjs');
const { AiService } = require('./aiservice.cjs');
const { initCrawlers, startCrawlers } = require('./crawlerMaster.cjs');
const { initResourceFixer, startResourceFixer } = require('./resourceFixerMaster.cjs');
const {getFixerEnabled, getCrawlerEnabled, getCrawlSites} = require('./database.cjs');
const Updater = require('./updater.cjs');

let mainWindow = null;
const aiService = new AiService();

async function createWindow() {

  mainWindow = new BrowserWindow({
      width: 1280,
      height: 800,
      show: true,
      webPreferences: {
          nodeIntegration: true,
          contextIsolation: true,
          preload: path.join(__dirname, 'preload.cjs'),
          webviewTag: true,
      }
  });
  
  // 创建应用菜单
  const template = [{
    label: 'uu',
    submenu: [
      {
        label: '设置',
        click: () => {
          mainWindow.webContents.send('open-settings');
        }
      },
      {
        label: '编辑',
        submenu: [
          { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
          { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
          { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
          { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
          { label: '重做', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
          { label: '全选', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
        ]
      },
      { type: 'separator' },
      {
        label: '版本信息',
        click: () => {
          const { dialog } = require('electron');
          const packageJson = require('../package.json');
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: '版本信息',
            message: `uunit ${packageJson.version}`,
            buttons: ['确定']
          });
        }
      },
      {
        label: '检查更新',
        click: async () => {
          const updater = new Updater(mainWindow);
          await updater.checkForUpdates();
        }
      },
      { role: 'quit', label: '退出' }
    ]
  }];
  
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // 设置Content-Security-Policy
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' https://api.themoviedb.org https://image.tmdb.org;",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline';",
          "img-src 'self' https://image.tmdb.org data: blob: 'unsafe-inline';",
          "style-src 'self' 'unsafe-inline';",
          "connect-src 'self' https://api.themoviedb.org;"
        ].join(' ')
      }
    });
  });

  if (process.env.NODE_ENV === 'development') {
    // 开发环境下加载开发服务器地址
    mainWindow.loadURL('http://localhost:5173');
    // 打开开发者工具
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 当窗口关闭时触发
  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  // 初始化自动更新
  const updater = new Updater(mainWindow);
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(async () => {
  try {
    logger.info('应用程序启动');

    try {
        await initDatabase();
        logger.info('数据库初始化完成');
        
        await initCrawlers(await getCrawlSites());
        let crawlerEnabled = await getCrawlerEnabled();
        if (crawlerEnabled) {
            await startCrawlers(await getCrawlSites());
        }

        await initResourceFixer();
        let fixerEnabled = await getFixerEnabled();
        if (fixerEnabled) {
            await startResourceFixer();
        }
      logger.info('系统模块加载完成......');
    } catch (moduleError) {
      logger.error('模块加载失败:', moduleError);
      throw moduleError;
    }

    if (mainWindow === null) {
      createWindow();
    }
  } catch (error) {
    logger.error('应用程序初始化失败:', error);
    app.quit();
  }
});

// 注册IPC处理程序
ipcMain.handle('aiservice:getModels', async () => {
  return await aiService.getModels();
});

// 注册app路径相关的IPC处理程序
ipcMain.handle('app:getAppPath', () => {
  return app.getAppPath();
});

ipcMain.handle('app:getPath', (event, name) => {
  return app.getPath(name);
});

// 注册打开开发者工具的IPC处理程序
ipcMain.handle('app:openDevTools', () => {
  if (mainWindow) {
    // 检查开发者工具是否已打开
    if (mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
      return { success: true, isOpen: false };
    } else {
      mainWindow.webContents.openDevTools();
      return { success: true, isOpen: true };
    }
  }
  return { success: false, error: '主窗口未初始化' };
});

// 当所有窗口关闭时退出应用
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
