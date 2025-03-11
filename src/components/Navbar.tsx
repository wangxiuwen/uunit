import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box, InputBase, Paper, Tooltip } from '@mui/material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';

interface NavbarProps {
    onSearch?: (query: string) => void;
    onSettingsClick?: () => void;
    viewMode?: 'grid' | 'list';
    onViewModeChange?: (mode: 'grid' | 'list') => void;
}

const Navbar = ({ onSearch, onSettingsClick, viewMode = 'grid', onViewModeChange }: NavbarProps = {}) => {
    const [query, setQuery] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSearch) {
            onSearch(query);
            // 如果不在首页，导航到首页
            if (location.pathname !== '/') {
                navigate('/');
            }
        }
    };

    return (
        <AppBar position="fixed" sx={{ bgcolor: '#f5f5f5', color: 'text.primary', boxShadow: 1 }}>
            <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6" component="div" sx={{ mr: 2 }}>
                        <RouterLink to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                            uunit电影搜索
                        </RouterLink>
                    </Typography>

                    {/* 搜索框 */}
                    {onSearch && (
                        <Paper
                            component="form"
                            sx={{
                                p: '2px 4px',
                                display: 'flex',
                                alignItems: 'center',
                                borderRadius: '24px',
                                border: '1px solid #4e6ef2',
                                boxShadow: 'none',
                                width: { xs: '180px', sm: '250px', md: '300px' },
                                '&:hover': {
                                    boxShadow: '0 1px 6px rgba(0, 0, 0, 0.1)'
                                }
                            }}
                            elevation={0}
                            onSubmit={handleSearch}
                        >
                            <InputBase
                                sx={{
                                    ml: 1,
                                    flex: 1,
                                    fontSize: '14px',
                                    height: '36px'
                                }}
                                placeholder="搜索电影..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <IconButton
                                type="submit"
                                sx={{
                                    p: '6px',
                                    bgcolor: '#4e6ef2',
                                    borderRadius: '0 22px 22px 0',
                                    color: 'white',
                                    height: '36px',
                                    width: '36px',
                                    mr: '-4px',
                                    '&:hover': {
                                        bgcolor: '#4662D9'
                                    }
                                }}
                                aria-label="search"
                            >
                                <SearchIcon fontSize="small" />
                            </IconButton>
                        </Paper>
                    )}
                </Box>

                <Box>
                    <Tooltip title={viewMode === 'grid' ? '列表视图' : '网格视图'}>
                        <IconButton
                            color="inherit"
                            onClick={() => onViewModeChange?.(viewMode === 'grid' ? 'list' : 'grid')}
                            size="large"
                        >
                            {viewMode === 'grid' ? <ViewListIcon /> : <ViewModuleIcon />}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="首页">
                        <IconButton
                            color="inherit"
                            component={RouterLink}
                            to="/"
                            size="large"
                        >
                            <HomeIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="设置">
                        <IconButton
                            color="inherit"
                            onClick={onSettingsClick}
                            size="large"
                        >
                            <SettingsIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;