const axios = require('axios');
const { ipcMain } = require('electron');
const { db } = require('./database.cjs');
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// TheMovieDB API配置
const getApiKey = async () => {
  const stmt = db.prepare('SELECT value FROM Settings WHERE key = ?');
  const apiKeySetting = stmt.get('tmdb_api_key');
  if (!apiKeySetting || !apiKeySetting.value) {
    throw new Error('请在设置中配置 TMDB API 密钥');
  }
  return apiKeySetting.value;
};

// 创建axios实例并配置代理
const createAxiosInstance = async () => {
  const config = {
    baseURL: 'https://api.themoviedb.org/3',
    lookup: undefined
  };

  // 配置 DNS 服务器
  const stmt = db.prepare('SELECT value FROM Settings WHERE key = ?');
  const dnsServer = stmt.get('dns_server');
  if (dnsServer && dnsServer.value) {
    const dns = require('dns');
    config.lookup = (hostname, options, callback) => {
      dns.lookup(hostname, { ...options, servers: [dnsServer.value] }, callback);
    };
  }

  const use_proxy = stmt.get('use_proxy');

  // 获取代理配置
  const proxyUrl = stmt.get('proxy_url');

  if (use_proxy && use_proxy.value === '1' && proxyUrl && proxyUrl.value) {
    try {
      const { HttpsProxyAgent } = require('https-proxy-agent');
      const { SocksProxyAgent } = require('socks-proxy-agent');
      const url = new URL(proxyUrl.value);

      if (url.protocol.startsWith('socks')) {
        config.httpsAgent = new SocksProxyAgent(proxyUrl.value);
      } else if (url.protocol.startsWith('http')) {
        config.httpsAgent = new HttpsProxyAgent(proxyUrl.value);
      }
    } catch (error) {
      console.error('代理配置错误:', error);
    }
  }

  return axios.create(config);
};


// 获取电影类型列表
const getGenres = async () => {
  try {
    const axiosInstance = await createAxiosInstance();
    const response = await axiosInstance.get('/genre/movie/list', {
      params: {
        api_key: await getApiKey(),
        language: 'zh-CN'
      }
    });
    
    const genreMap = new Map();
    response.data.genres.forEach(genre => {
      genreMap.set(genre.id, genre.name);
    });
    
    return genreMap;
  } catch (error) {
    console.error('获取电影类型失败:', error);
    return new Map();
  }
};

// 搜索电影
ipcMain.handle('tmdb:searchMovies', async (event, query) => {
  try {
    const axiosInstance = await createAxiosInstance();
    const response = await axiosInstance.get('/search/movie', {
      params: {
        api_key: await getApiKey(),
        query,
        language: 'zh-CN'
      }
    });
    
    const genreMap = await getGenres();
    const movies = [];
    
    for (const result of response.data.results) {
      // 将电影类型ID转换为名称
      const genreNames = result.genre_ids
        .map(id => genreMap.get(id) || '')
        .filter(name => name !== '');
      
      const movie = {
        id: result.id,
        title: result.title,
        overview: result.overview,
        posterPath: result.poster_path ? IMAGE_BASE_URL + result.poster_path : null,
        releaseDate: result.release_date || '',
        voteAverage: result.vote_average || 0,
        genres: genreNames.join(', '),
        originalLanguage: result.original_language,
        originalTitle: result.original_title,
        popularity: result.popularity,
        video: result.video,
        voteCount: result.vote_count,
        adult: result.adult,
        backdropPath: result.backdrop_path ? IMAGE_BASE_URL + result.backdrop_path : null
      };
      
      movies.push(movie);
    }
    
    return movies;
  } catch (error) {
    console.error('搜索电影失败:', error);
    return [];
  }
});

// 根据ID获取电影详情
ipcMain.handle('tmdb:getMovieById', async (event, id) => {
  try {
    const axiosInstance = await createAxiosInstance();
    const response = await axiosInstance.get(`/movie/${id}`, {
      params: {
        api_key: await getApiKey(),
        language: 'zh-CN'
      }
    });

    const movie = {
      id: response.data.id,
      title: response.data.title,
      overview: response.data.overview,
      posterPath: response.data.poster_path ? IMAGE_BASE_URL + response.data.poster_path : '/placeholder.png',
      releaseDate: response.data.release_date || '',
      voteAverage: response.data.vote_average || 0,
      genres: response.data.genres.map(genre => genre.name).join(', '),
      originalLanguage: response.data.original_language,
      originalTitle: response.data.original_title,
      popularity: response.data.popularity,
      video: response.data.video,
      voteCount: response.data.vote_count,
      adult: response.data.adult,
      backdropPath: response.data.backdrop_path ? IMAGE_BASE_URL + response.data.backdrop_path : null
    };

    return movie;
  } catch (error) {
    console.error('获取电影详情失败:', error);
    return null;
  }
});

module.exports = {
  getApiKey,
  createAxiosInstance,
  getGenres
};
