const WorkerFramework = require('./worker.cjs');
const cheerio = require('cheerio');
const { CrawlTasks, Resource, Op } = require('./database.cjs');
const logger = require('./logger.cjs');

class CrawlerWorker extends WorkerFramework {
  constructor() {
    super();
    this.crawler = null;
    this.crawlerSite = null;
  }

  async start(config) {
    super.start(config);
    if (config && config.crawlerSite && config.crawlerSite.url) {
        this.crawlerSite = config.crawlerSite;
        const Crawler = require('./crawler.cjs');
        this.crawler = new Crawler();
        await this.crawler.initialize();
    }
  }

  async stop() {
    if (this.crawler) {
      await this.crawler.close();
      this.crawler = null;
    }
    await super.stop();
  }

  extractLinks(html) {
    const $ = cheerio.load(html);
    let links = [];
    try {
      $('a').each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          const cleanUrl = href.split('#')[0];
          if (cleanUrl && !cleanUrl.startsWith("magnet:?xt=urn:btih:")) {
            links.push(cleanUrl);
          }
        }
      });
      return links;
    } catch (error) {
      logger.error('获取链接失败:', error);
      return [];
    }
  }

  extractMagnets(html) {
    const $ = cheerio.load(html);
    let magnets = [];
    $('a[href^="magnet:?xt=urn:btih:"]').each((_, element) => {
      const link = $(element).attr('href').replace(/["']/g, '');
      magnets.push({
        link: link,
        name: $(element).text().trim()
      });
    });
    return magnets;
  }

  extractFtpLinks(html) {
    const $ = cheerio.load(html);
    let ftpLinks = [];
    $('a[href^="ftp://"]').each((_, element) => {
      const link = $(element).attr('href');
      const name = this.extractNameFromFtpLink(link);
      ftpLinks.push({
        link: link,
        name: name
      });
    });
    return ftpLinks;
  }

  extractNameFromFtpLink(ftpLink) {
    try {
      const fileName = ftpLink.split('/').pop();
      return fileName
        .replace(/\[.*?\]/g, '')
        .replace(/\.(mp4|mkv|avi|rmvb)$/i, '')
        .replace(/\./g, ' ')
        .trim();
    } catch (error) {
      return '';
    }
  }

  async executeTask() {

    if (!this.crawlerSite || !this.crawlerSite.url) {
      throw new Error('无效的爬虫配置：缺少crawlerSite参数');
    }
    const crawlerSiteDomain = new URL(this.crawlerSite.url).hostname;

    while (this.isRunning) {
      try {
        const nextTask = await CrawlTasks.findOne({
          where: { 
            status: 0,
            url: {
              [Op.like]: `%${crawlerSiteDomain}%`
            }
          },
          order: [['id', 'ASC']]
        });
        if (!nextTask) {
          // 检查起始URL是否已存在
          const existingStartUrl = await CrawlTasks.findOne({
            where: { url: this.crawlerSite.url }
          });

          if (!existingStartUrl) {
            await CrawlTasks.create({
              url: this.crawlerSite.url,
              status: 0
            });
            logger.info(`添加起始URL到任务队列: ${this.crawlerSite.url}`);
            this.sendMessage('info', { message: `添加起始URL到任务队列: ${this.crawlerSite.url}` });
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        const url = nextTask.url;
        if (!url) {
          throw new Error('任务URL为空');
        }

        const { origin } = new URL(url);
        logger.info(`开始处理任务：${url}`);
        this.sendMessage('info', { message: `开始处理任务：${url}` });

        let { title, content } = await this.crawler.getContent(url);
        if (!content) {
          throw new Error(`获取页面内容失败: ${url}`);
        }

        // 处理链接
        const links = this.extractLinks(content);
        for (let i = 0; i < links.length; i++) {
          if (!links[i].startsWith('https://') && !links[i].startsWith('http://')) {
            const relativeUrl = links[i].startsWith('/') ? links[i].substring(1) : links[i];
            links[i] = origin + (origin.endsWith('/') ? '' : '/') + relativeUrl;
          }
        }

        // 保存新链接
        for (const link of links) {
          try {
            if (!link) continue;
            
            const existingTask = await CrawlTasks.findOne({
              where: { url: link }
            });

            if (!existingTask) {
              await CrawlTasks.create({
                url: link,
                status: 0
              });
              this.sendMessage('info', { message: `新链接已添加到任务队列: ${link}` });
            }
          } catch (error) {
            logger.error(`保存链接失败: ${link}`, error);
            this.sendMessage('error', { 
              message: `保存链接失败: ${link}`, 
              error: error.message,
              stack: error.stack
            });
          }
        }

        // 更新任务状态
        await nextTask.update({ status: 1 });
        this.sendMessage('info', { message: `任务状态已更新: ${url}` });

        const magnets = this.extractMagnets(content);
        const ftpLinks = this.extractFtpLinks(content);

        if (magnets.length === 0 && ftpLinks.length === 0) {
          this.sendMessage('info', { message: `未找到磁力链接或FTP链接: ${title || url}` });
        } else {
          // 保存资源
          for (const magnet of magnets) {
            try {
              let resourceTitle = `${title || ''} ${magnet.name}`.trim();
              await Resource.create({
                title: resourceTitle,
                magnet: magnet.link
              });
              this.sendMessage('info', { 
                message: `资源已保存: ${resourceTitle}`,
                data: { title: resourceTitle, magnet: magnet.link }
              });
            } catch (error) {
              this.sendMessage('error', { 
                message: `保存资源失败: ${magnet.link}`,
                error: error.message,
                stack: error.stack
              });
            }
          }

          // 保存FTP链接
          for (const ftpLink of ftpLinks) {
            try {
              let resourceTitle = `${title || ''} ${ftpLink.name}`.trim();
              await Resource.create({
                title: resourceTitle,
                ftp_link: ftpLink.link
              });
              this.sendMessage('info', { 
                message: `FTP资源已保存: ${resourceTitle}`,
                data: { title: resourceTitle, ftp_link: ftpLink.link }
              });
            } catch (error) {
              this.sendMessage('error', { 
                message: `保存FTP资源失败: ${ftpLink.link}`,
                error: error.message,
                stack: error.stack
              });
            }
          }
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        this.sendMessage('error', { 
          message: `任务执行失败: ${error.message}`,
          error: error.message,
          stack: error.stack
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
}

// 创建worker实例
const worker = new CrawlerWorker();