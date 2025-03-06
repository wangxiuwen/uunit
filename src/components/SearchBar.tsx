import { useState } from 'react';
import { IconButton, Paper, InputBase, Box, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface SearchBarProps {
    onSearch: (query: string) => void;
    isScrolled?: boolean;
}

const SearchBar = ({ onSearch, isScrolled = false }: SearchBarProps) => {
    const [query, setQuery] = useState('');
    const [isSearched, setIsSearched] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query);
            setIsSearched(true);
        }
    };

    return (
        <Box sx={{
            width: '100%',
            maxWidth: isSearched && isScrolled ? '100%' : 650,
            margin: '0 auto',
            mt: isSearched && isScrolled ? 0 : 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: isSearched && isScrolled ? 'flex-start' : 'center',
            position: isSearched && isScrolled ? 'sticky' : 'relative',
            top: isSearched && isScrolled ? 0 : 'auto',
            zIndex: isSearched && isScrolled ? 1100 : 1,
            bgcolor: isSearched && isScrolled ? '#f5f5f5' : 'transparent',
            py: isSearched && isScrolled ? 1 : 0,
            px: isSearched && isScrolled ? 2 : 0,
            transition: 'all 0.3s ease'
        }}>
            <Typography
                variant="h5"
                sx={{
                    mb: 2,
                    fontWeight: 'bold',
                    color: '#4e6ef2',
                    fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif'
                }}
            >
                uunit电影搜索
            </Typography>
            <Paper
                component="form"
                sx={{
                    p: '2px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '24px',
                    border: '2px solid #4e6ef2',
                    boxShadow: 'none',
                    width: '100%',
                    '&:hover': {
                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
                    }
                }}
                elevation={0}
                onSubmit={handleSearch}
            >
                <InputBase
                    sx={{
                        ml: 2,
                        flex: 1,
                        fontSize: '16px',
                        height: '44px'
                    }}
                    placeholder="搜索电影..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <IconButton
                    type="submit"
                    sx={{
                        p: '10px',
                        bgcolor: '#4e6ef2',
                        borderRadius: '0 22px 22px 0',
                        color: 'white',
                        height: '44px',
                        width: '44px',
                        mr: '-4px',
                        '&:hover': {
                            bgcolor: '#4662D9'
                        }
                    }}
                    aria-label="search"
                >
                    <SearchIcon />
                </IconButton>
            </Paper>
        </Box>
    );
};

export default SearchBar;