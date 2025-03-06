const Database = require('better-sqlite3');
const path = require('path');
const { ipcMain } = require('electron');
const os = require('os');

// 创建数据库目录（如果不存在）
const dbDir = path.join(os.homedir(), '.uuint');
if (!require('fs').existsSync(dbDir)) {
  require('fs').mkdirSync(dbDir, { recursive: true });
}

// 创建数据库连接
const db = new Database(path.join(dbDir, 'database.sqlite'));

// 创建设置表
db.exec(`
  CREATE TABLE IF NOT EXISTS Settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    createdAt DATETIME,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 初始化数据库
const initDatabase = async () => {
  try {
    console.log('数据库连接成功');
  } catch (error) {
    console.error('数据库初始化失败:', error);
  }
};

// 获取设置值
ipcMain.handle('db:getSetting', async (event, key) => {
  try {
    const stmt = db.prepare('SELECT value FROM Settings WHERE key = ?');
    const result = stmt.get(key);
    return result ? result.value : null;
  } catch (error) {
    console.error('获取设置失败:', error);
    throw error;
  }
});

// 保存设置值
ipcMain.handle('db:saveSetting', async (event, key, value) => {
  try {
    const stmt = db.prepare('INSERT OR REPLACE INTO Settings (key, value, createdAt, updatedAt) VALUES (?, ?, COALESCE((SELECT createdAt FROM Settings WHERE key = ?), CURRENT_TIMESTAMP), CURRENT_TIMESTAMP)');
    stmt.run(key, value, key);
    return { success: true };
  } catch (error) {
    console.error('保存设置失败:', error);
    throw error;
  }
});

// 关闭数据库连接
process.on('exit', () => {
  db.close();
});

module.exports = {
  db,
  initDatabase
};
