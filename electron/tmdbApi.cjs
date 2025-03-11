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
        
        // 获取每个电影的演员信息
        let cast = [];
        try {
          const creditsResponse = await axiosInstance.get(`/movie/${result.id}/credits`, {
            params: {
              api_key: await this.getApiKey(),
              language: 'zh-CN'
            }
          });
          cast = creditsResponse.data.cast
        } catch (error) {
          console.error(`获取电影 ${result.id} 的演员信息失败:`, error);
        }
        
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
          status: null,
          cast: cast
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
      const [movieResponse, creditsResponse] = await Promise.all([
        axiosInstance.get(`/movie/${id}`, {
          params: {
            api_key: await this.getApiKey(),
            language: 'zh-CN'
          }
        }),
        axiosInstance.get(`/movie/${id}/credits`, {
          params: {
            api_key: await this.getApiKey(),
            language: 'zh-CN'
          }
        })
      ]);

      const cast = creditsResponse.data.cast.slice(0, 10).map(actor => ({
        id: actor.id,
        name: actor.name,
        character: actor.character,
        profile_path: actor.profile_path ? IMAGE_BASE_URL + actor.profile_path : null
      }));

      return {
        id: movieResponse.data.id,
        title: movieResponse.data.title,
        overview: movieResponse.data.overview,
        posterPath: movieResponse.data.poster_path ? IMAGE_BASE_URL + movieResponse.data.poster_path : null,
        releaseDate: movieResponse.data.release_date || '',
        voteAverage: movieResponse.data.vote_average || 0,
        genres: movieResponse.data.genres.map(genre => genre.name).join(', '),
        originalLanguage: movieResponse.data.original_language,
        originalTitle: movieResponse.data.original_title,
        popularity: movieResponse.data.popularity,
        video: movieResponse.data.video,
        voteCount: movieResponse.data.vote_count,
        adult: movieResponse.data.adult,
        backdropPath: movieResponse.data.backdrop_path ? IMAGE_BASE_URL + movieResponse.data.backdrop_path : null,
        runtime: movieResponse.data.runtime,
        status: movieResponse.data.status,
        cast: cast
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
