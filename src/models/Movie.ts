// 定义电影类型接口
export interface Movie {
  id: number;
  tmdbId: number;
  title: string;
  overview: string;
  posterPath: string;
  backdropPath: string | null;
  releaseDate: string;
  voteAverage: number;
  voteCount: number;
  popularity: number;
  genres: string;
  originalTitle: string;
  originalLanguage: string;
  runtime: number | null;
  status: string | null;
  video: boolean;
  adult: boolean;
  magnet?: string;
}

// 定义设置相关方法
export const getSetting = async (key: string): Promise<string | null> => {
  return await window.electron.database.getSetting(key);
};

export const saveSetting = async (key: string, value: string): Promise<void> => {
  await window.electron.database.saveSetting(key, value);
};

// 初始化数据库
export const initDatabase = async () => {
  try {
    await window.electron.database.init();
    console.log('数据库初始化成功');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
};

// 搜索电影
export const searchMovies = async (query: string): Promise<{ movies: Movie[]; totalPages: number; totalCount: number }> => {
  return await window.electron.database.searchMovies(query);
};

// 获取电影详情
export const getMovie = async (id: number): Promise<Movie | null> => {
  return await window.electron.database.getMovie(id);
};

// 保存电影
export const saveMovie = async (movieData: Omit<Movie, 'id'>): Promise<Movie> => {
  return await window.electron.database.saveMovie(movieData);
};