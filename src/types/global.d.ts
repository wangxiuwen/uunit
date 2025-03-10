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
                getAppPath: () => Promise<string>,
                getPath: (name: string) => Promise<string>,
            },
            openDevTools: () => Promise<{ success: boolean, isOpen: boolean }>,
            aiservice: {
                getModels: () => Promise<string[]>,
            },
            crawler: {
                startCrawlers: (params: { crawlerSites: Array<{ url: string }> }) => Promise<Map<boolean>>,
                stopCrawlers: (params: { crawlerSites: Array<{ url: string }> }) => Promise<Map<boolean>>,
            },
            fixer: {
                startFixer: () => Promise<void>,
                stopFixer: () => Promise<void>,
                task: (params: {id: number}) => Promise<void>,
            },
            tmdb: {
                searchMovies: (query: string) => Promise<Movie[]>,
                getMovieById: (id: number) => Promise<Movie | null>,
            },
            onOpenSettings: (callback: () => void) => void,
            database: {
                getSetting: (key: string) => Promise<string | null>,
                saveSetting: (key: string, value: string) => Promise<void>,
                searchMovies: (query: string, page?: number, pageSize?: number) => Promise<{ movies: Movie[]; totalPages: number; totalCount: number; }>,
                getMovie: (id: number) => Promise<Movie | null>,
            },
        };
    }
}