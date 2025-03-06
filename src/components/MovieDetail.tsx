import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Container, Typography, Grid, Paper, Skeleton } from '@mui/material';
import { Movie } from '../types/global';

const MovieDetail = () => {
    const { id } = useParams<{ id: string }>();
    const [movie, setMovie] = useState<Movie | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMovieDetail = async () => {
            if (!id) return;
            try {
                setLoading(true);
                setError('');
                const movieData = await window.electron.tmdb.getMovieById(Number(id));
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
                            src={movie.posterPath || '/placeholder.png'}
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
                    <Typography variant="h4" component="h1" gutterBottom>
                        {movie.title}
                    </Typography>
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
                </Grid>
            </Grid>
        </Container>
    );
};

export default MovieDetail;