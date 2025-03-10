const { parentPort } = require('worker_threads');
const EventEmitter = require('events');

class WorkerFramework extends EventEmitter {
  constructor() {
    super();
    this.isRunning = false;
    this.initialize();
  }

  initialize() {
    if (!parentPort) {
      throw new Error('This module must be run as a worker thread');
    }

    // 设置消息处理器
    parentPort.on('message', (message) => {
      this.handleMessage(message);
    });

    // 错误处理
    process.on('uncaughtException', (error) => {
      this.handleError('uncaughtException', error);
    });

    process.on('unhandledRejection', (error) => {
      this.handleError('unhandledRejection', error);
    });
  }

  handleMessage(message) {
    try {
      const { type, data } = message;
      
      switch (type) {
        case 'start':
          this.start(data);
          break;
        case 'stop':
          this.stop(data);
          break;
        case 'task':
          this.executeTask(data);
          break;
        default:
          throw new Error(`Unknown message type: ${type}`);
      }
    } catch (error) {
      this.handleError('messageHandling', error);
    }
  }

  handleError(type, error) {
    const errorMessage = {
      type: 'error',
      data: {
        type,
        message: error.message,
        stack: error.stack
      }
    };
    parentPort.postMessage(errorMessage);
  }

  sendMessage(type, data) {
    parentPort.postMessage({ type, data });
  }

  start(config) {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    this.config = config;
    this.sendMessage('started', { timestamp: Date.now() });
  }

  stop() {
    if (!this.isRunning) {
      return;
    }
    this.isRunning = false;
    this.sendMessage('stopped', { timestamp: Date.now() });
  }

  async executeTask(task) {
    if (!this.isRunning) {
      throw new Error('Worker is not running');
    }

    try {
      // 这里将由具体的业务实现类来重写
      throw new Error('executeTask must be implemented by subclass');
    } catch (error) {
      this.handleError('taskExecution', error);
    }
  }
}

module.exports = WorkerFramework;