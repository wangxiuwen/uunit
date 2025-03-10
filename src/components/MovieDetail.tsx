import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Container, Typography, Grid, Paper, Skeleton, IconButton, Snackbar, Button } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Movie } from '../types/global';

const MovieDetail = () => {
    const { id } = useParams<{ id: string }>();
    const [movie, setMovie] = useState<Movie | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [appPath, setAppPath] = useState<string>('');

    const fixMovie = async () => {
        if (!movie?.id) return;
        try {
            setLoading(true);
            await window.electron.fixer.task({ id: movie.id });
            const updatedMovie = await window.electron.database.getMovie(movie.id);
            setMovie(updatedMovie);
            setSnackbarMessage('电影信息更新成功');
            setSnackbarOpen(true);
        } catch (err) {
            console.error('更新电影信息失败:', err);
            setSnackbarMessage('更新电影信息失败，请稍后重试');
            setSnackbarOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyMagnet = async () => {
        if (movie?.magnet) {
            try {
                await navigator.clipboard.writeText(movie.magnet);
                setSnackbarMessage('链接已复制到剪贴板');
                setSnackbarOpen(true);
            } catch (err) {
                console.error('复制失败:', err);
            }
        }
    };

    useEffect(() => {
        const fetchMovieDetail = async () => {
            if (!id) return;
            try {
                setLoading(true);
                setError('');
                const movieData = await window.electron.database.getMovie(Number(id));
                if (movieData) {
                    setMovie(movieData);
                } else {
                    setError('未找到电影信息');
                }
            } catch (err) {
                console.error('获取电影详情失败:', err);
                setError('获取电影详情失败，请稍后重试');
            } finally {
                setLoading(false);
            }
        };

        fetchMovieDetail();
    }, [id]);

    useEffect(() => {
        const loadAppPath = async () => {
            try {
                const currentAppPath = await window.electron.appPath.getAppPath();
                setAppPath(currentAppPath);
            } catch (error) {
                console.error('获取应用路径失败:', error);
                setAppPath("");
            }
        };

        loadAppPath();
    }, []);

    if (loading) {
        return (
            <Container sx={{ mt: 4 }}>
                <Grid container spacing={4}>
                    <Grid item xs={12} md={4}>
                        <Skeleton variant="rectangular" height={450} />
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <Skeleton variant="text" height={60} sx={{ mb: 2 }} />
                        <Skeleton variant="text" height={30} sx={{ mb: 1 }} />
                        <Skeleton variant="text" height={30} sx={{ mb: 1 }} />
                        <Skeleton variant="text" height={120} />
                    </Grid>
                </Grid>
            </Container>
        );
    }

    if (error) {
        return (
            <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Typography color="error" variant="h6">{error}</Typography>
            </Box>
        );
    }

    if (!movie) {
        return (
            <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Typography variant="h6">未找到电影信息</Typography>
            </Box>
        );
    }

    return (
        <Container sx={{ mt: 4 }}>
            <Grid container spacing={4}>
                <Grid item xs={12} md={4}>
                    <Paper elevation={3}>
                        <Box
                            component="img"
                            src={movie.posterPath ? movie.posterPath : (import.meta.env.DEV ? '/placeholder.png' : (appPath + "/dist/placeholder.png"))}
                            alt={movie.title}
                            sx={{
                                width: '100%',
                                height: 'auto',
                                display: 'block',
                                borderRadius: 1
                            }}
                        />
                    </Paper>
                </Grid>
                <Grid item xs={12} md={8}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h4" component="h1">
                            {movie.originalTitle}
                        </Typography>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={fixMovie}
                            disabled={loading}
                        >
                            更新信息
                        </Button>
                    </Box>
                    {movie.title && movie.title !== movie.originalTitle && (
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            {movie.title}
                        </Typography>
                    )}
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                        {movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : '未知年份'} | {movie.genres || '未分类'}
                    </Typography>
                    <Typography variant="body1" paragraph sx={{ mt: 2 }}>
                        {movie.overview || '暂无简介'}
                    </Typography>
                    {movie.voteAverage > 0 && (
                        <Typography variant="subtitle1" color="text.secondary">
                            评分：{movie.voteAverage.toFixed(1)}/10
                        </Typography>
                    )}
                    {movie.magnet && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                下载链接
                            </Typography>
                            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                    <Typography
                                        variant="body2"
                                        component="div"
                                        sx={{
                                            wordBreak: 'break-all',
                                            fontFamily: 'monospace',
                                            cursor: 'text',
                                            userSelect: 'text',
                                            flex: 1
                                        }}
                                    >
                                        {movie.magnet}
                                    </Typography>
                                    <IconButton
                                        onClick={handleCopyMagnet}
                                        size="small"
                                        sx={{ mt: -0.5 }}
                                        title="复制链接"
                                    >
                                        <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Paper>
                        </Box>
                    )}
                </Grid>
            </Grid>
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
                message={snackbarMessage}
            />
        </Container>
    );
};

export default MovieDetail;