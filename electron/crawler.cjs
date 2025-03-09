const { chromium } = require('playwright');

class Crawler {
  constructor() {
    this.browser = null;
  }

  async initialize() {
    if (!this.browser) {
      const { getSetting } = require('./database.cjs');
      const useProxy = await getSetting('use_proxy') === '1';
      const proxyUrl = await getSetting('proxy_url');

      const launchOptions = {
        headless: true,
        proxy: useProxy ? {
          server: proxyUrl,
        } : null
      };

      this.browser = await chromium.launch(launchOptions);
    }
  }

  getRandomUserAgent() {
    const userAgents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0 Safari/537.36'
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  async createContext() {
    const context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: this.getRandomUserAgent(),
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai',
      deviceScaleFactor: 2,
      hasTouch: false,
      javaScriptEnabled: true,
      bypassCSP: true,
      ignoreHTTPSErrors: true,
      permissions: ['geolocation']
    });

    // 禁用WebGL指纹
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) return 'Intel Open Source Technology Center';
        if (parameter === 37446) return 'Mesa DRI Intel(R) Iris(R) Plus Graphics (ICL GT2)';
        return getParameter.apply(this, arguments);
      };
    });

    return context;
  }

  async getContent(url) {
    try {
      await this.initialize();
      const context = await this.createContext();
      const page = await context.newPage();
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 60000
      });
      const title = await page.title();
      const content = await page.content();
      await context.close();
      return {title, content};
    } catch (error) {
      console.error('Error fetching content:', error);
      throw error;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = Crawler;