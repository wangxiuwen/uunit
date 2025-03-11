import { Movie, saveMovie } from '../models/Movie';

// 搜索电影
export const searchMovies = async (query: string): Promise<Movie[]> => {
  try {
    const movies = await window.electron.tmdb.searchMovies(query);
    // 将返回的电影数据保存到本地数据库
    const savedMovies = await Promise.all(
      movies.map(movie => saveMovie({
        tmdbId: movie.id,
        title: movie.title,
        overview: movie.overview,
        posterPath: movie.posterPath,
        releaseDate: movie.releaseDate,
        voteAverage: movie.voteAverage,
        genres: movie.genres,
        video: movie.video || false,
        originalTitle: movie.originalTitle,
        originalLanguage: movie.originalLanguage,
        backdropPath: movie.backdropPath,
        runtime: movie.runtime,
        status: movie.status,
        popularity: movie.popularity,
        voteCount: movie.voteCount,
        adult: movie.adult || false,
        cast: movie.cast || []
      }))
    );
    return savedMovies;
  } catch (error) {
    console.error('搜索电影失败:', error);
    return [];
  }
};

// 根据ID获取电影详情
export const getMovieById = async (id: number): Promise<Movie | null> => {
  try {
    const movie = await window.electron.tmdb.getMovieById(id);
    if (movie) {
      return movie;
    }
    return null;
  } catch (error) {
    console.error('获取电影详情失败:', error);
    return null;
  }
};