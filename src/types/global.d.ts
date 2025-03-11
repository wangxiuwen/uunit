interface Cast {
    id: number;
    name: string;
    character: string;
    profilePath: string | null;
    order: number;
}

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
    ftpLink?: string;
    cast?: Cast[];
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
                startCrawlers: (params: {crawlSites: { url: string }[]}) => Promise<{ success: boolean }>,
                stopCrawlers: (params: {crawlSites: { url: string }[]}) => Promise<{ success: boolean }>,
            },
            fixer: {
                startFixer: () => Promise<{ success: boolean }>,
                stopFixer: () => Promise<{ success: boolean }>,
                task: (params: {id: number}) => Promise<{ success: boolean }>,
            },
            tmdb: {
                searchMovies: (query: string) => Promise<Movie[]>,
                getMovieById: (id: number) => Promise<Movie | null>,
            },
            onOpenSettings: (callback: () => void) => void,
            database: {
                init: () => Promise<void>,
                getSetting: (key: string) => Promise<string | null>,
                saveSetting: (key: string, value: string) => Promise<void>,
                searchMovies: (query: string, page?: number, pageSize?: number) => Promise<{ movies: Movie[]; totalPages: number; totalCount: number; }>,
                getMovie: (id: number) => Promise<Movie | null>,
                saveMovie: (movie: Omit<Movie, 'id'>) => Promise<Movie>,
            },
        };
    }
}