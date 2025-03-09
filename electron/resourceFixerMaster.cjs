const { ipcMain } = require('electron');
const path = require('path');
const { Worker } = require('worker_threads');
const logger = require('./logger.cjs');
const {getFixEnabled} = require('./database.cjs');
let worker = null;

async function startResourceFixer() {

    if (!worker) {

        worker = new Worker(path.join(__dirname, 'resourceFixerWorker.cjs'));
        
        worker.on('message', (message) => {
          const { type, data } = message;
          switch (type) {
            case 'started':
              logger.info(`削刮Worker已启动`);
              break;
            case 'stopped':
              logger.info(`削刮Worker已停止`);
              break;
            case 'error':
              logger.error(`削刮Worker错误`, data);
              break;
            case 'info':
              logger.info(`削刮Worker信息 ${data.message}`);
              break;
            default:
              logger.info(`未知消息类型: ${type}, ${JSON.stringify(data)}`);
          }
        });
    
        worker.on('exit', (code) => {
          if (code !== 0) {
            console.error(`削刮Worker异常退出， 退出码: ${code}`);
          }
        });
      }
      worker.postMessage({ type: 'start'});
      worker.postMessage({ type: 'task'});
}

async function stopResourceFixer() {
    if (worker) {
      worker.postMessage({ type: 'stop' });
    }
}

async function updateFixerStatus(enabled) {
    if (enabled) {
        await startResourceFixer();
    } else {
        await stopResourceFixer();
    }
}

// 监听来自渲染进程的修复器控制消息
ipcMain.handle('fixer:updateStatus', async (event, { enabled }) => {
  await updateFixerStatus(enabled);
  return { success: true };
});
// 确保数据库初始化完成后再开始定时任务
async function wakeUpFixer() {
    let enabled = await getFixEnabled();
    await updateFixerStatus(enabled);
}
  
module.exports = {
    startResourceFixer,
    stopResourceFixer,
    updateFixerStatus,
    wakeUpFixer
};

