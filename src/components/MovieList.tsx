import { Box, Grid, Card, CardContent, CardMedia, Typography, CardActionArea } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Movie } from '../types/global';

interface MovieListProps {
    movies: Movie[];
    loading: boolean;
}

const MovieList = ({ movies, loading }: MovieListProps) => {
    const navigate = useNavigate();

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

    return (
        <Box sx={{ mt: 4 }}>
            <Grid container spacing={3}>
                {movies.map((movie) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={movie.id}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <CardActionArea onClick={() => navigate(`/movie/${movie.id}`)}>
                                <CardMedia
                                    component="img"
                                    height="300"
                                    image={movie.posterPath || '/placeholder.png'}
                                    alt={movie.title}
                                    sx={{ objectFit: 'cover' }}
                                />
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Typography variant="h6" component="div" noWrap sx={{ flex: 1 }}>
                                            {movie.title}
                                        </Typography>
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
        </Box >
    );
};

export default MovieList;