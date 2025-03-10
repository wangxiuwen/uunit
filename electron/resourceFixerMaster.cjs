const { ipcMain } = require('electron');
const path = require('path');
const { Worker } = require('worker_threads');
const logger = require('./logger.cjs');
let worker = null;

async function initResourceFixer() {

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

      ipcMain.handle('fixer:start', async (event, { }) => {
        await startResourceFixer();
        return { success: true };
    });
    
    ipcMain.handle('fixer:stop', async (event, { }) => {
        await stopResourceFixer();
        return { success: true };
    });

    ipcMain.handle('fixer:task', async (event, {id}) => {
        worker.postMessage({ type: 'task', data: {id}});
        return { success: true };
    });
}

async function startResourceFixer() {
      worker.postMessage({ type: 'start'});
}

async function stopResourceFixer() {
    if (worker) {
      worker.postMessage({ type: 'stop' });
    }
}


  
module.exports = {
    initResourceFixer,
    startResourceFixer,
    stopResourceFixer
};

