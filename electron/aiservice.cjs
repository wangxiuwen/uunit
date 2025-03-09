const { OpenAI } = require('openai');
const { Settings } = require('./database.cjs');
const logger = require('./logger.cjs');

class AiService {
    
    constructor() {
        this.client = null;
        this.model = null;
    }
    
    async initialize() {
        if (this.client) {
            return;
        }
        const endpoint = await Settings.findByPk('ai_endpoint');
        const baseURL = endpoint && endpoint.value ? endpoint.value : 'http://127.0.0.1:11434/v1';
        const apiKey = await Settings.findByPk('ai_apikey');
        const aiModel = await Settings.findByPk('ai_model');
        this.model = aiModel ? aiModel.value : 'qwen2.5:latest';
        
        const config = {
            baseURL: baseURL
        }
        if (apiKey) {
            config.apiKey = apiKey.value;
        }
        this.client = new OpenAI(config);
      }

  // 使用 OpenAI 客户端请求 Ollama 模型
  async call(prompt) {
    await this.initialize()
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error calling API:', error);
      throw error;
    }
  }
  async getModels() {
    await this.initialize();
    try {
      const response = await this.client.models.list();
      const models = response.data.map(model => model.id);
      
      // 如果没有保存的模型设置，使用第一个可用模型
      if (!this.model && models.length > 0) {
        this.model = models[0];
        await Settings.upsert({ key: 'ai_model', value: this.model });
      }
      
      return models;
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }
}

module.exports = {
    AiService
};

