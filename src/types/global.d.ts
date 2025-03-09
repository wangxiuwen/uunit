interface Movie {
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

export { type Movie };
declare global {
    interface Window {
        electron: {
            appPath: {
                getAppPath: () =>  Promise<string>,
            },
            openDevTools(): unknown;
            aiservice: {
                call: (prompt: string) => Promise<string>;
                getModels: () => Promise<string[]>;
            };
            crawler: {
                updateStatus: (params: { enabled: boolean; crawlerSites: Map[] }) => Promise<{ success: boolean }>;
            };
            fixer: {
                updateStatus: (params: { enabled: boolean }) => Promise<{ success: boolean }>;
            };
            tmdb: {
                searchMovies: (query: string) => Promise<Movie[]>;
                searchLocalMovies: (query: string, page?: number, pageSize?: number) => Promise<{ movies: Movie[]; totalPages: number; totalCount: number; }>;
                getMovieById: (id: number) => Promise<Movie | null>;
            };
            onOpenSettings: (callback: () => void) => void;
            database: {
                init: () => Promise<void>;
                searchMovies: (query: string, page?: number, pageSize?: number) => Promise<{ movies: Movie[]; totalPages: number; totalCount: number; }>;
                searchLocalMovies: (query: string, page?: number, pageSize?: number) => Promise<{ movies: Movie[]; totalPages: number; totalCount: number; }>;
                getMovie: (id: number) => Promise<Movie | null>;
                saveMovie: (movieData: Omit<Movie, 'id'>) => Promise<Movie>;
                getSetting: (key: string) => Promise<string | null>;
                saveSetting: (key: string, value: string) => Promise<void>;
            };
        };
    }
}