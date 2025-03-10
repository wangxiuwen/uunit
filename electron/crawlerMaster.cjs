const { Worker } = require('worker_threads');
const path = require('path');
const { ipcMain } = require('electron');
const logger = require('./logger.cjs');
let workers = new Map(); // 存储每个起始链接的worker实例

async function initCrawlers(crawlerSites) {

    for (const crawlerSite of crawlerSites) {

        if (!workers.has(crawlerSite)) {

            logger.info(`创建爬虫: ${JSON.stringify(crawlerSite)}`)
            const worker = new Worker(path.join(__dirname, 'crawlerWorker.cjs'));
            
            worker.on('message', (message) => {
              const { type, data } = message;
              switch (type) {
                case 'started':
                  logger.info(`爬虫Worker已启动: ${JSON.stringify(crawlerSite)}`);
                  break;
                case 'stopped':
                  logger.info(`爬虫Worker已停止: ${JSON.stringify(crawlerSite)}`);
                  break;
                case 'error':
                  logger.error(`爬虫Worker错误 ${JSON.stringify(crawlerSite)}:`, data);
                  break;
                case 'info':
                  logger.info(`爬虫Worker信息 ${JSON.stringify(crawlerSite)}: ${data.message}`);
                  break;
                default:
                  logger.info(`未知消息类型: ${type}, ${JSON.stringify(data)}`);
              }
            });
        
            worker.on('exit', (code) => {
              if (code !== 0) {
                console.error(`爬虫Worker异常退出 (${JSON.stringify(crawlerSite)}), 退出码: ${code}`);
              }
              workers.delete(crawlerSite);
            });
            workers.set(crawlerSite, worker);
            logger.info(`创建 worker: ${JSON.stringify(crawlerSite)}`)
        }
    }

    // 监听来自渲染进程的爬虫控制消息
    ipcMain.handle('crawler:start', async (event, data) => {
        console.log(`startCrawlers:datadatadata ${JSON.stringify(data)}`)
        await startCrawlers(data.crawlSites);
        return { success: true };
    });

    ipcMain.handle('crawler:stop', async (event, { crawlSites }) => {
        await stopCrawlers(crawlSites);
        return { success: true };
    });
}

// 启动爬虫任务
async function startCrawlers(crawlSites) {
    console.log(`startCrawlers: ${JSON.stringify(crawlSites)}`)
    for (const crawlSite of crawlSites) {
        const worker = workers.get(crawlSite);
        if (worker) {
            worker.postMessage({ type: 'start', data: {crawlerSite} });
        }
    }
}

// 停止爬虫任务
async function stopCrawlers(crawlSites) {

  const worker = workers.get(crawlSites);
  if (worker) {
    worker.postMessage({ type: 'stop' });
    workers.delete(crawlSites);
  }
}

module.exports = {
  initCrawlers,
  startCrawlers,
  stopCrawlers,
}