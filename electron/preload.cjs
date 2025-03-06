const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electron', {
  // 提供与主进程通信的方法
  database: {
    getSetting: (key) => ipcRenderer.invoke('db:getSetting', key),
    saveSetting: (key, value) => ipcRenderer.invoke('db:saveSetting', key, value)
  },
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
  }
});

// 清理监听器
ipcRenderer.on('open-settings', () => {});