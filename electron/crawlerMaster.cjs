const { Worker } = require('worker_threads');
const path = require('path');
const { ipcMain } = require('electron');
const { getCrawlerStatus, getCrawlSites } = require('./database.cjs');
const logger = require('./logger.cjs');
let workers = new Map(); // 存储每个起始链接的worker实例

// 启动爬虫任务
async function startCrawler(crawlerSite) {
  if (!workers.has(crawlerSite)) {

    logger.info(`启动爬虫任务: ${JSON.stringify(crawlerSite)}`)
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
    
    // 启动worker
    logger.info(`启动worker: ${JSON.stringify(crawlerSite)}`)
    worker.postMessage({ type: 'start', data: {crawlerSite} });
    worker.postMessage({ type: 'task'});
  }
}

// 停止爬虫任务
async function stopCrawler(crawlerSite) {
  const worker = workers.get(crawlerSite);
  if (worker) {
    worker.postMessage({ type: 'stop' });
    workers.delete(crawlerSite);
  }
}

// 更新爬虫状态
async function updateCrawlerStatus(enabled, crawlerSites = []) {
  
  if (enabled) {
    // 启动新的爬虫任务
    for (const crawlerSite of crawlerSites) {
      logger.info(`wakeUpCrawler: ${JSON.stringify(crawlerSite)}`)
      await startCrawler(crawlerSite);
    }
  } else {
    // 停止所有爬虫任务
    for (const [crawlerSite, worker] of workers) {
      await stopCrawler(crawlerSite);
    }
  }
}

// 监听来自渲染进程的爬虫控制消息
ipcMain.handle('crawler:updateStatus', async (event, { enabled, crawlerSites }) => {
    await updateCrawlerStatus(enabled, crawlerSites);
    return { success: true };
});

// 确保数据库初始化完成后再开始定时任务
async function wakeUpCrawler() {
  await updateCrawlerStatus(await getCrawlerStatus(), await getCrawlSites())
};

module.exports = {
  startCrawler,
  stopCrawler,
  updateCrawlerStatus,
  wakeUpCrawler
};