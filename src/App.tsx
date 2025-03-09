import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Container, Typography, Box, CssBaseline } from '@mui/material';
import Navbar from './components/Navbar';
import MovieList from './components/MovieList';
import MovieDetail from './components/MovieDetail';
import Settings from './components/Settings';
import './App.css';
import { Movie } from './types/global';

function App() {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (window.electron && window.electron.onOpenSettings) {
            window.electron.onOpenSettings(() => {
                setSettingsOpen(true);
            });
        }

        // 初始加载随机电影
        const loadRandomMovies = async () => {
            try {
                setLoading(true);
                setError('');
                const { movies: results, totalPages: pages } = await window.electron.database.searchMovies('', 1, 12);
                const mappedResults = results.map((movie: Movie) => ({
                    id: movie.id,
                    tmdbId: movie.tmdbId,
                    title: movie.title,
                    overview: movie.overview || '',
                    posterPath: movie.posterPath || '',
                    backdropPath: movie.backdropPath,
                    releaseDate: movie.releaseDate,
                    voteAverage: movie.voteAverage || 0,
                    voteCount: movie.voteCount || 0,
                    popularity: movie.popularity || 0,
                    genres: movie.genres || '未分类',
                    originalTitle: movie.originalTitle || movie.title,
                    originalLanguage: movie.originalLanguage || '',
                    runtime: movie.runtime,
                    status: movie.status,
                    video: movie.video || false,
                    adult: movie.adult || false,
                    magnet: movie.magnet
                }));
                setMovies(mappedResults);
                setCurrentPage(1);
                setTotalPages(pages);
            } catch (err) {
                console.error('加载电影失败:', err);
                setError('加载电影失败，请稍后重试');
            } finally {
                setLoading(false);
            }
        };

        loadRandomMovies();
    }, []);

    const handleSearch = async (query: string) => {
        try {
            setLoading(true);
            setError('');
            setSearchQuery(query); // 保存搜索关键词
            const { movies: results, totalPages: pages } = await window.electron.database.searchMovies(query, 1, 12);
            const mappedResults = results.map((movie: Movie) => ({
                id: movie.id,
                tmdbId: movie.tmdbId,
                title: movie.title,
                overview: movie.overview || '',
                posterPath: movie.posterPath || '',
                backdropPath: movie.backdropPath,
                releaseDate: movie.releaseDate,
                voteAverage: movie.voteAverage || 0,
                voteCount: movie.voteCount || 0,
                popularity: movie.popularity || 0,
                genres: movie.genres || '未分类',
                originalTitle: movie.originalTitle || movie.title,
                originalLanguage: movie.originalLanguage || '',
                runtime: movie.runtime,
                status: movie.status,
                video: movie.video || false,
                adult: movie.adult || false,
                magnet: movie.magnet
            }));
            setMovies(mappedResults);
            setCurrentPage(1);
            setTotalPages(pages);
        } catch (err) {
            console.error('搜索电影失败:', err);
            setError('搜索电影失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = async (page: number) => {
        try {
            setLoading(true);
            setError('');
            const { movies: results, totalPages: pages } = await window.electron.database.searchMovies(searchQuery, page, 12);
            const mappedResults = results.map((movie: Movie) => ({
                id: movie.id,
                tmdbId: movie.tmdbId,
                title: movie.title,
                overview: movie.overview || '',
                posterPath: movie.posterPath || '',
                backdropPath: movie.backdropPath,
                releaseDate: movie.releaseDate,
                voteAverage: movie.voteAverage || 0,
                voteCount: movie.voteCount || 0,
                popularity: movie.popularity || 0,
                genres: movie.genres || '未分类',
                originalTitle: movie.originalTitle || movie.title,
                originalLanguage: movie.originalLanguage || '',
                runtime: movie.runtime,
                status: movie.status,
                video: movie.video || false,
                adult: movie.adult || false,
                magnet: movie.magnet
            }));
            setCurrentPage(page);
            setTotalPages(pages);
            setMovies(mappedResults);
        } catch (err) {
            console.error('加载电影失败:', err);
            setError('加载电影失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Router>
            <CssBaseline />
            <Box sx={{ display: 'flex', flexGrow: 1, flexDirection: 'column', height: '100vh' }}>
                <Navbar onSearch={handleSearch} onSettingsClick={() => setSettingsOpen(true)} />
                <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />

                <Routes>
                    <Route path="*" element={
                        <Container component="main" maxWidth={false} sx={{ flexGrow: 1, py: 3, mt: 8 }}>
                            <Routes>
                                <Route path="/" element={
                                    <>
                                        {error && (
                                            <Box sx={{ mt: 2, textAlign: 'center' }}>
                                                <Typography color="error">{error}</Typography>
                                            </Box>
                                        )}
                                        <MovieList
                                            movies={movies}
                                            loading={loading}
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            onPageChange={handlePageChange}
                                        />
                                    </>
                                } />
                                <Route path="/movie/:id" element={<MovieDetail />} />
                            </Routes>
                        </Container>
                    } />
                </Routes>

                <Box component="footer" sx={{ py: 3, bgcolor: 'background.paper', mt: 'auto' }}>
                    <Container maxWidth="lg">
                        <Typography variant="body2" color="text.secondary" align="center">
                            © {new Date().getFullYear()} 电影搜索应用
                        </Typography>
                    </Container>
                </Box>
            </Box>
        </Router>
    );
}

export default App;
