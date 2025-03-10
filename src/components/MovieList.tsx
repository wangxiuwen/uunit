import { Box, Grid, Card, CardContent, CardMedia, Typography, CardActionArea, Pagination } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Movie } from '../types/global';

interface MovieListProps {
    movies: Movie[];
    loading: boolean;
    onPageChange?: (page: number) => void;
    totalPages?: number;
    currentPage?: number;
}

const MovieList = ({ movies, loading, onPageChange, totalPages = 1, currentPage = 1 }: MovieListProps) => {
    const navigate = useNavigate();
    const [appPath, setAppPath] = useState<string>('');

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
            <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Typography variant="h6">加载中...</Typography>
            </Box>
        );
    }

    if (!movies || movies.length === 0) {
        return (
            <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Typography variant="h6">没有找到相关电影</Typography>
            </Box>
        );
    }

    const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
        if (onPageChange) {
            onPageChange(value);
        }
    };

    return (
        <Box sx={{ mt: 4, padding: '2rem' }}>
            <Grid container spacing={3}>
                {movies.map((movie) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={movie.id}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <CardActionArea onClick={async () => {
                                try {
                                    await window.electron.fixer.task({ id: movie.id });
                                    navigate(`/movie/${movie.id}`);
                                } catch (error) {
                                    console.error('更新电影信息失败:', error);
                                    navigate(`/movie/${movie.id}`);
                                }
                            }}>
                                <CardMedia
                                    component="img"
                                    height="300"
                                    image={movie.posterPath ? movie.posterPath : (import.meta.env.DEV ? '/placeholder.png' : (appPath + "/dist/placeholder.png"))}
                                    alt={movie.title}
                                    sx={{ objectFit: 'cover' }}
                                />
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1 }}>
                                        <Typography variant="h6" component="div" noWrap>
                                            {movie.title}
                                        </Typography>
                                        {movie.originalTitle && movie.originalTitle !== movie.title && (
                                            <Typography variant="body2" color="text.secondary" noWrap>
                                                {movie.originalTitle}
                                            </Typography>
                                        )}
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        {movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : '未知'} | {movie.genres || '未分类'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: 'vertical',
                                    }}>
                                        {movie.overview || '暂无简介'}
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>
            {totalPages > 1 && (
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                    <Pagination
                        count={totalPages}
                        page={currentPage}
                        onChange={handlePageChange}
                        color="primary"
                        size="large"
                    />
                </Box>
            )}
        </Box>
    );
};

export default MovieList;