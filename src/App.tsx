import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

    // 初始化数据库
    useEffect(() => {
        // 监听Electron菜单中的设置选项点击事件
        if (window.electron && window.electron.onOpenSettings) {
            window.electron.onOpenSettings(() => {
                setSettingsOpen(true);
            });
        }
    }, []);

    const handleSearch = async (query: string) => {
        try {
            setLoading(true);
            setError('');
            const results = await window.electron.tmdb.searchMovies(query);
            setMovies(results);
        } catch (err) {
            console.error('搜索电影失败:', err);
            // 检查是否是 API 密钥错误
            if (err instanceof Error && err.message.includes('API 密钥')) {
                setError(err.message + '，请点击右上角设置按钮进行配置');
                setSettingsOpen(true); // 自动打开设置对话框
            } else {
                setError('搜索电影失败，请稍后重试');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Router>
            <CssBaseline />
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <Navbar onSearch={handleSearch} onSettingsClick={() => setSettingsOpen(true)} />
                {/* 设置对话框 */}
                <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />

                <Container component="main" sx={{ flexGrow: 1, py: 3, mt: 8 }}>
                    <Routes>
                        <Route path="/" element={
                            <>
                                {error && (
                                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                                        <Typography color="error">{error}</Typography>
                                    </Box>
                                )}
                                <MovieList movies={movies} loading={loading} />
                            </>
                        } />
                        <Route path="/movie/:id" element={<MovieDetail />} />
                    </Routes>
                </Container>

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
