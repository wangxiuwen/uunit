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
            const { success } = await window.electron.fixer.task({ id: movie.id });
            if (success) {
                setSnackbarMessage('电影信息更新中...');
                const updatedMovie = await window.electron.database.getMovie(movie.id);
                setMovie(updatedMovie);
                setSnackbarOpen(true);
            } else {
                setSnackbarMessage('电影信息更新失败');
                setSnackbarOpen(true);
            }
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
                console.log(movieData)
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
        <Container maxWidth="lg" sx={{ mt: 6, mb: 4, display: 'flex', justifyContent: 'center' }}>
            {error ? (
                <Typography color="error" variant="h6" align="center">{error}</Typography>
            ) : movie ? (
                <Grid container spacing={4} sx={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <Grid item xs={12} md={4}>
                        <Box sx={{
                            position: 'sticky',
                            top: 88,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            alignItems: 'center'
                        }}>
                            <Paper
                                elevation={3}
                                sx={{
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    position: 'relative'
                                }}
                            >
                                <Box
                                    component="img"
                                    src={movie.posterPath ? movie.posterPath : (import.meta.env.DEV ? '/placeholder.png' : (appPath + "/dist/placeholder.png"))}
                                    alt={movie.title}
                                    sx={{
                                        width: '100%',
                                        aspectRatio: '2/3',
                                        objectFit: 'cover'
                                    }}
                                />
                            </Paper>
                            {movie.magnet && (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<ContentCopyIcon />}
                                    onClick={handleCopyMagnet}
                                    fullWidth
                                    sx={{
                                        py: 1.5,
                                        borderRadius: 2,
                                        bgcolor: '#4e6ef2',
                                        '&:hover': {
                                            bgcolor: '#4662D9'
                                        }
                                    }}
                                >
                                    复制下载链接
                                </Button>
                            )}
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                                        {movie.title}
                                    </Typography>
                                    {movie.originalTitle && movie.originalTitle !== movie.title && (
                                        <Typography variant="h6" color="text.secondary" gutterBottom>
                                            {movie.originalTitle}
                                        </Typography>
                                    )}
                                </Box>
                                <IconButton
                                    onClick={fixMovie}
                                    sx={{
                                        bgcolor: 'action.hover',
                                        '&:hover': { bgcolor: 'action.selected' }
                                    }}
                                >
                                    <RefreshIcon />
                                </IconButton>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                                <Typography variant="body1" color="text.secondary">
                                    {movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : '未知年份'}
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    {movie.runtime ? `${movie.runtime}分钟` : '片长未知'}
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    {movie.genres || '未分类'}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#4e6ef2' }}>
                                    电影信息
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body1" color="text.secondary">
                                            评分：{movie.voteAverage?.toFixed(1) || '暂无'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body1" color="text.secondary">
                                            投票数：{movie.voteCount || 0}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body1" color="text.secondary">
                                            人气：{Math.round(movie.popularity || 0)}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body1" color="text.secondary">
                                            语言：{movie.originalLanguage?.toUpperCase() || '未知'}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Box>

                            <Box>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#4e6ef2' }}>
                                    剧情简介
                                </Typography>
                                <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
                                    {movie.overview || '暂无简介'}
                                </Typography>
                            </Box>

                            {movie.cast && movie.cast.length > 0 && (
                                <Box>
                                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#4e6ef2', mt: 3 }}>
                                        演员表
                                    </Typography>
                                    <Grid container spacing={2}>
                                        {movie.cast.map((actor) => (
                                            <Grid item xs={6} sm={4} md={3} key={actor.id}>
                                                <Paper
                                                    elevation={1}
                                                    sx={{
                                                        p: 2,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: 1,
                                                        height: '100%',
                                                        borderRadius: 2
                                                    }}
                                                >
                                                    <Box
                                                        component="img"
                                                        src={actor.profilePath ? actor.profilePath : (import.meta.env.DEV ? '/placeholder.png' : (appPath + "/dist/placeholder.png"))}
                                                        alt={actor.name}
                                                        sx={{
                                                            width: 100,
                                                            height: 100,
                                                            borderRadius: '50%',
                                                            objectFit: 'cover'
                                                        }}
                                                    />
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium', textAlign: 'center' }}>
                                                        {actor.name}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                                                        {actor.character}
                                                    </Typography>
                                                </Paper>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Box>
                            )}

                        </Box>
                    </Grid>
                </Grid>
            ) : null}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
                message={snackbarMessage}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />
        </Container>
    );
};

export default MovieDetail;