const axios = require('axios');
const { Settings } = require('./database.cjs');
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

class TMDBApi {
  constructor() {
  }

  async getApiKey() {
    const apiKeySetting = await Settings.findByPk('tmdb_api_key');
    if (!apiKeySetting || !apiKeySetting.value) {
      throw new Error('请在设置中配置 TMDB API 密钥');
    }
    return apiKeySetting.value;
  }

  async createAxiosInstance() {
    const config = {
      baseURL: 'https://api.themoviedb.org/3',
      timeout: 30000
    };

    const dnsServer = await Settings.findByPk('dns_server');
    if (dnsServer && dnsServer.value) {
      const dns = require('dns');
      config.lookup = (hostname, options, callback) => {
        dns.lookup(hostname, { ...options, servers: [dnsServer.value] }, callback);
      };
    }

    const use_proxy = await Settings.findByPk('use_proxy');
    const proxyUrl = await Settings.findByPk('proxy_url');

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
  }

  async getGenres() {
    try {
      const axiosInstance = await this.createAxiosInstance();
      const response = await axiosInstance.get('/genre/movie/list', {
        params: {
          api_key: await this.getApiKey(),
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
  }

  async searchMovies(query) {
    try {
      if (!query || typeof query !== 'string') {
        return [];
      }
      
      const cleanedQuery = query.trim();
      if (!cleanedQuery) {
        return [];
      }
      const axiosInstance = await this.createAxiosInstance();
      const response = await axiosInstance.get('/search/movie', {
        params: {
          api_key: await this.getApiKey(),
          query: cleanedQuery,
        }
      });
      
      const genreMap = await this.getGenres();
      const movies = [];
      
      for (const result of response.data.results) {
        const genreNames = (result.genre_ids || [])
          .map(id => genreMap.get(id) || '')
          .filter(name => name !== '');
        
        const movie = {
          id: result.id,
          title: result.title,
          overview: result.overview,
          posterPath: result.poster_path ? IMAGE_BASE_URL + result.poster_path : null,
          backdropPath: result.backdrop_path ? IMAGE_BASE_URL + result.backdrop_path : null,
          releaseDate: result.release_date || '',
          voteAverage: result.vote_average || 0,
          voteCount: result.vote_count,
          popularity: result.popularity,
          genres: genreNames.join(', '),
          originalTitle: result.original_title,
          runtime: null,
          status: null
        };
        
        movies.push(movie);
      }
      
      return movies;
    } catch (error) {
      console.error('搜索电影失败:', error);
      return [];
    }
  }

  async getMovieById(id) {
    try {
      const axiosInstance = await this.createAxiosInstance();
      const response = await axiosInstance.get(`/movie/${id}`, {
        params: {
          api_key: await this.getApiKey(),
          language: 'zh-CN'
        }
      });

      return {
        id: response.data.id,
        title: response.data.title,
        overview: response.data.overview,
        posterPath: response.data.poster_path ? IMAGE_BASE_URL + response.data.poster_path : null,
        releaseDate: response.data.release_date || '',
        voteAverage: response.data.vote_average || 0,
        genres: response.data.genres.map(genre => genre.name).join(', '),
        originalLanguage: response.data.original_language,
        originalTitle: response.data.original_title,
        popularity: response.data.popularity,
        video: response.data.video,
        voteCount: response.data.vote_count,
        adult: response.data.adult,
        backdropPath: response.data.backdrop_path ? IMAGE_BASE_URL + response.data.backdrop_path : null,
        runtime: response.data.runtime,
        status: response.data.status
      };
    } catch (error) {
      console.error('获取电影详情失败:', error);
      return null;
    }
  }
}



module.exports = {
  TMDBApi
};
