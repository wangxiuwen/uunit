const WorkerFramework = require('./worker.cjs');
const { ResourceFixer } = require('./resourceFixerMaster.cjs');
const logger = require('./logger.cjs');

class FixerWorker extends WorkerFramework {
  constructor() {
    super();
    this.fixer = null;
  }

  async start() {
    await super.start();
    this.fixer = new ResourceFixer();
    // 启动后立即开始执行任务
    await this.executeTask();
  }

  async stop() {
    this.isRunning = false;
    await super.stop();
  }

  async executeTask() {
    if (!this.isRunning || !this.fixer) {
      throw new Error('Worker is not running or fixer is not initialized');
    }

    while (this.isRunning) {
      try {
        await this.fixer.fixResources();
        // 等待一段时间再继续下一轮修复
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        this.sendMessage('error', { message: `任务执行失败: ${error.message}` });
        // 发生错误时休眠10秒后继续
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
}

// 创建worker实例
const worker = new FixerWorker();