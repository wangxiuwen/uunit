const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const { initDatabase } = require('./database.cjs');
require('./tmdbApi.cjs');

// 初始化数据库
app.whenReady().then(async () => {
  await initDatabase();
});

let mainWindow;

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    title: 'uunit',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });
  
  // 创建应用菜单
  const template = [
    {
      label: 'uu',
      submenu: [
        {
          label: '设置',
          click: () => {
            // 通知渲染进程打开设置
            mainWindow.webContents.send('open-settings');
          }
        },
        { type: 'separator' },
        { role: 'quit', label: '退出' }
      ]
    }
  ];
  
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
    // 生产环境下加载打包后的index.html
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 当窗口关闭时触发
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(createWindow);

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