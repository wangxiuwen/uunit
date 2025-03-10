const { Worker } = require('worker_threads');
const path = require('path');
const { ipcMain } = require('electron');
const logger = require('./logger.cjs');
let workers = new Map(); // 存储每个起始链接的worker实例

async function initCrawlers(crawlerSites) {

    for (const crawlerSite of crawlerSites) {
        const siteUrl = crawlerSite.url;
        console.log(`000000000`, siteUrl)
        if (!siteUrl) {
            logger.error(`无效的爬虫配置: ${JSON.stringify(crawlerSite)}`);
            continue;
        }

        if (!workers.has(siteUrl)) {
            logger.info(`创建爬虫: ${JSON.stringify(crawlerSite)}`)
            const worker = new Worker(path.join(__dirname, 'crawlerWorker.cjs'));
            
            worker.on('message', (message) => {
              const { type, data } = message;
              switch (type) {
                case 'started':
                  logger.info(`爬虫Worker已启动: ${siteUrl}`);
                  break;
                case 'stopped':
                  logger.info(`爬虫Worker已停止: ${siteUrl}`);
                  break;
                case 'error':
                  logger.error(`爬虫Worker错误 ${siteUrl}:`, data);
                  break;
                case 'info':
                  logger.info(`爬虫Worker信息 ${siteUrl}: ${data.message}`);
                  break;
                default:
                  logger.info(`未知消息类型: ${type}, ${JSON.stringify(data)}`);
              }
            });
        
            worker.on('exit', (code) => {
              if (code !== 0) {
                console.error(`爬虫Worker异常退出 (${siteUrl}), 退出码: ${code}`);
              }
              workers.delete(siteUrl);
            });

            workers.set(siteUrl, worker);
            logger.info(`创建 worker: ${JSON.stringify(crawlerSite)}`)
        }
    }

    // 监听来自渲染进程的爬虫控制消息
    ipcMain.handle('crawler:start', async (event, {crawlSites}) => {
        await startCrawlers(crawlSites);
        return { success: true };
    });

    ipcMain.handle('crawler:stop', async (event, { crawlSites }) => {
        await stopCrawlers(crawlSites);
        return { success: true };
    });
}

// 启动爬虫任务
async function startCrawlers(crawlSites) {
    for (const crawlerSite of crawlSites) {
        const siteUrl = crawlerSite.url;
        if (!siteUrl) {
            logger.error(`无效的爬虫配置: ${JSON.stringify(crawlerSite)}`);
            continue;
        }
        const worker = workers.get(siteUrl);
        if (!worker) {
            logger.error(`找不到爬虫Worker: ${siteUrl}`);
            continue;
        }
        worker.postMessage({ type: 'start', data: {crawlerSite} });
    }
}

// 停止爬虫任务
async function stopCrawlers(crawlSites) {
    for (const crawlerSite of crawlSites) {
        const siteUrl = crawlerSite.url;
        if (!siteUrl) continue;
        const worker = workers.get(siteUrl);
        if (worker) {
            worker.postMessage({ type: 'stop' });
        }
    }
}

module.exports = {
  initCrawlers,
  startCrawlers,
  stopCrawlers,
}