const { contextBridge, ipcRenderer } = require('electron');
const { startCrawlers, stopCrawlers } = require('./crawlerMaster.cjs');

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electron', {
  // 获取应用路径
  appPath: {
    getAppPath: () => ipcRenderer.invoke('app:getAppPath'),
    getPath: (name) => ipcRenderer.invoke('app:getPath', name)
  },
  // 提供与主进程通信的方法
  database: {
    getSetting: (key) => ipcRenderer.invoke('db:getSetting', key),
    saveSetting: (key, value) => ipcRenderer.invoke('db:saveSetting', key, value),
    searchMovies: (query, page = 1, pageSize = 12) => ipcRenderer.invoke('db:searchMovies', query, page, pageSize),
    getMovie: (id) => ipcRenderer.invoke('db:getMovie', id)
  },
  aiservice: {
    getModels: (id) => ipcRenderer.invoke('aiservice:getModels', id)

  },
  // 打开开发者工具
  openDevTools: () => ipcRenderer.invoke('app:openDevTools'),
  
  // 暴露版本信息
  versions: {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
  },
  // 添加监听器
  onOpenSettings: (callback) => {
    ipcRenderer.on('open-settings', () => callback());
  },
  // TMDB API 相关功能
  tmdb: {
    searchMovies: (query) => ipcRenderer.invoke('tmdb:searchMovies', query),
    getMovieById: (id) => ipcRenderer.invoke('tmdb:getMovieById', id)
  },
  // 爬虫控制相关功能
  crawler: {
    startCrawlers: (data) => ipcRenderer.invoke('crawler:start', data),
    stopCrawlers: (data) => ipcRenderer.invoke('crawler:stop', data)
  },
  // 修复器控制相关功能
  fixer: {
    startFixer: ({  }) => ipcRenderer.invoke('fixer:start', {  }),
    stopFixer: ({  }) => ipcRenderer.invoke('fixer:stop', {  }),
    task: (data) => ipcRenderer.invoke('fixer:task', data)
  }
});