const { Sequelize, DataTypes, Op } = require('sequelize');
const path = require('path');
const os = require('os');
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// 创建数据库目录（如果不存在）
const dbDir = path.join(os.homedir(), '.uuint');
if (!require('fs').existsSync(dbDir)) {
  require('fs').mkdirSync(dbDir, { recursive: true });
}

// 创建数据库连接
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(dbDir, 'database.sqlite'),
    logging: false
});

// 定义设置模型
const Settings = sequelize.define('Settings', {
  key: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  value: {
    type: DataTypes.TEXT
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'Settings',
  timestamps: true
});

// 定义爬虫任务模型
const CrawlTasks = sequelize.define('CrawlTasks', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  url: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'CrawlTasks',
  timestamps: true
});

// 定义资源模型
const Resource = sequelize.define('Resource', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  original_title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  overview: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  poster_path: {
    type: DataTypes.STRING,
    allowNull: true
  },
  backdrop_path: {
    type: DataTypes.STRING,
    allowNull: true
  },
  release_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  vote_average: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  vote_count: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  popularity: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  genres: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('genres');
      return rawValue ? JSON.parse(rawValue) : null;
    },
    set(value) {
      this.setDataValue('genres', JSON.stringify(value));
    }
  },
  runtime: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tmdb_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    unique: false
  },
  failed_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  magnet: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('magnet');
      return rawValue ? JSON.parse(rawValue) : null;
    },
    set(value) {
      this.setDataValue('magnet', JSON.stringify(value));
    }
  },
  ftp_link: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'Resource',
  timestamps: true
});


// 初始化数据库
const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    const logger = require('./logger.cjs');
    logger.info('数据库连接成功');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
};

// 关闭数据库连接
const closeDatabase = async () => {
  try {
    await sequelize.close();
    const logger = require('./logger.cjs');
    logger.info('数据库连接已关闭');
  } catch (error) {
    console.error('关闭数据库连接失败:', error);
    throw error;
  }
};

// 获取设置值
async function getSetting(key) {
  try {
    const setting = await Settings.findByPk(key);
    return setting ? setting.value : null;
  } catch (error) {
    console.error('获取设置失败:', error);
    throw error;
  }
}

// 保存设置值
async function saveSetting(key, value) {
  try {
    await Settings.upsert({
      key,
      value
    });
    return { success: true };
  } catch (error) {
    console.error('保存设置失败:', error);
    throw error;
  }
}

// 搜索电影（带分页）
async function searchMovies(query, page = 1, pageSize = 12) {
  try {
    const offset = (page - 1) * pageSize;
    const where = query ? {
      [Op.or]: [
        { title: { [Op.like]: `%${query}%` } },
        { original_title: { [Op.like]: `%${query}%` } }
      ]
    } : {};

    const { count, rows } = await Resource.findAndCountAll({
      where,
      limit: pageSize,
      offset,
      order: [['createdAt', 'DESC']]
    });

    return {
      movies: rows.map(resource => ({
        id: resource.id,
        title: resource.title,
        originalTitle: resource.original_title,
        overview: resource.overview,
        posterPath: resource.poster_path ? resource.poster_path : null,
        backdropPath: resource.backdrop_path ? resource.backdrop_path : null,
        releaseDate: resource.release_date,
        voteAverage: resource.vote_average,
        voteCount: resource.vote_count,
        popularity: resource.popularity,
        genres: resource.genres,
        runtime: resource.runtime,
        status: resource.status,
        tmdbId: resource.tmdb_id,
        magnet: resource.magnet,
        createdAt: resource.createdAt,
        updatedAt: resource.updatedAt
      })),
      totalPages: Math.ceil(count / pageSize),
      totalCount: count
    };
  } catch (error) {
    console.error('搜索电影失败:', error);
    throw error;
  }
}

// 获取电影详情
async function getMovie(id) {
  try {
    const resource = await Resource.findByPk(id);
    if (!resource) return null;
    if (resource.poster_path != null) {
        resource.poster_path = IMAGE_BASE_URL + resource.poster_path || null; 
    }

    return {
      id: resource.id,
      title: resource.title,
      overview: resource.overview || '',
      posterPath: resource.poster_path,
      backdropPath: resource.backdrop_path || null,
      releaseDate: resource.release_date || resource.createdAt,
      voteAverage: resource.vote_average || 0,
      genres: resource.genres || '资源',
      magnet: resource.magnet,
      originalTitle: resource.original_title,
      voteCount: resource.vote_count,
      popularity: resource.popularity,
      runtime: resource.runtime,
      status: resource.status
    };
  } catch (error) {
    console.error('获取电影详情失败:', error);
    throw error;
  }
}

// 只在主进程中注册IPC处理程序
if (process.type === 'browser') {
  const { ipcMain } = require('electron');
  ipcMain.handle('db:getSetting', async (event, key) => getSetting(key));
  ipcMain.handle('db:saveSetting', async (event, key, value) => saveSetting(key, value));
  ipcMain.handle('db:searchMovies', async (event, query, page, pageSize) => searchMovies(query, page, pageSize));
  ipcMain.handle('db:getMovie', async (event, id) => getMovie(id));
}

// 关闭数据库连接
process.on('exit', async () => {
  await sequelize.close();
});

// 获取爬虫状态
async function getCrawlerStatus() {
  try {
    const setting = await Settings.findByPk('crawler_enabled');
    return setting && setting.value === '1' ? true : false;
  } catch (error) {
    console.error('获取爬虫状态失败:', error);
    return false;
  }
}


async function getFixEnabled() {
    try {
      const setting = await Settings.findByPk('fixer_enabled');
      return setting && setting.value === '1' ? true : false;
    } catch (error) {
      console.error('获取爬虫状态失败:', error);
      return false;
    }
}

// 保存爬虫状态
async function saveCrawlerStatus(enabled) {
  try {
    await Settings.upsert({
      key: 'crawler_enabled',
      value: enabled.toString()
    });
    return true;
  } catch (error) {
    console.error('保存爬虫状态失败:', error);
    return false;
  }
}

async function getCrawlSites() {
  const logger = require('./logger.cjs');
  try {
    const setting = await Settings.findByPk('crawl_sites');
    if (!setting || !setting.value) {
      logger.info('未找到爬虫站点配置，返回默认空数组');
      return [];
    }
    const sites = JSON.parse(setting.value);
    logger.info(`成功获取爬虫站点配置：${sites.length} 个站点`);
    for (const site of sites || []) {
        logger.info(`爬虫站点：${JSON.stringify(site)}`);
    }
    return sites;
  } catch (error) {
    logger.error('获取起始URL列表失败:', error);
    return [];
  }
}

async function saveCrawlSites(urls) {
  try {
    await Settings.upsert({
      key: 'crawl_sites',
      value: JSON.stringify(urls)
    });
  } catch (error) {
    console.error('保存起始URL列表失败:', error);
  }
}

module.exports = {
  getSetting,
  initDatabase,
  closeDatabase,
  getFixEnabled,
  Settings,
  CrawlTasks,
  Resource,
  Op,
  getCrawlerStatus,
  saveCrawlerStatus,
  getCrawlSites
};
