interface Movie {
    id: number;
    tmdbId: number;
    title: string;
    overview: string;
    posterPath: string;
    releaseDate: string;
    voteAverage: number;
    genres: string;
}

export { type Movie };
declare global {
    interface Window {
        electron: {
            tmdb: {
                searchMovies: (query: string) => Promise<Movie[]>;
                getMovieById: (id: number) => Promise<Movie | null>;
            };
            onOpenSettings: (callback: () => void) => void;
            database: {
                init: () => Promise<void>;
                searchMovies: (query: string) => Promise<Movie[]>;
                getMovie: (id: number) => Promise<Movie | null>;
                saveMovie: (movieData: Omit<Movie, 'id'>) => Promise<Movie>;
                getSetting: (key: string) => Promise<string | null>;
                saveSetting: (key: string, value: string) => Promise<void>;
            };
        };
    }
}