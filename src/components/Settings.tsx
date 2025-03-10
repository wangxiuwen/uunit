import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Typography,
    Box,
    Alert,
    InputAdornment,
    IconButton,
    FormControlLabel,
    Switch,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import BugReportIcon from '@mui/icons-material/BugReport';

interface SettingsProps {
    open: boolean;
    onClose: () => void;
}

const Settings = ({ open, onClose }: SettingsProps) => {
    const [apiKey, setApiKey] = useState('');
    const [dnsServer, setDnsServer] = useState('');
    const [useProxy, setUseProxy] = useState(false);
    const [proxyUrl, setProxyUrl] = useState('socks5://127.0.0.1:7890');
    const [aiModel, setAiModel] = useState('openai');
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [aiEndpoint, setAiEndpoint] = useState('');
    const [aiApikey, setAiApikey] = useState('');
    const [showAiApikey, setShowAiApikey] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);
    const [crawlSites, setCrawlSites] = useState<Array<{ url: string }>>([]);
    const [crawlerEnabled, setCrawlerEnabled] = useState(false);
    const [fixerEnabled, setFixerEnabled] = useState(false);

    // 组件加载时从主进程获取设置
    useEffect(() => {
        const loadModels = async () => {
            try {
                const models = await window.electron.aiservice.getModels();
                setAvailableModels(models);
            } catch (err) {
                console.error('获取AI模型列表失败:', err);
                setError('获取AI模型列表失败，请重试');
            }
        };

        const loadSettings = async () => {
            try {
                const savedApiKey = await window.electron.database.getSetting('tmdb_api_key');
                const savedDnsServer = await window.electron.database.getSetting('dns_server');
                const savedUseProxy = await window.electron.database.getSetting('use_proxy');
                const savedProxyUrl = await window.electron.database.getSetting('proxy_url');
                const savedAiModel = await window.electron.database.getSetting('ai_model');
                const savedAiEndpoint = await window.electron.database.getSetting('ai_endpoint');
                const savedAiApikey = await window.electron.database.getSetting('ai_apikey');
                const savedCrawlSites = await window.electron.database.getSetting('crawl_sites');
                const savedCrawlerEnabled = await window.electron.database.getSetting('crawler_enabled');
                const savedFixerEnabled = await window.electron.database.getSetting('fixer_enabled');

                if (savedApiKey) setApiKey(savedApiKey);
                if (savedDnsServer) setDnsServer(savedDnsServer);
                if (savedUseProxy) setUseProxy(savedUseProxy === '1');
                if (savedProxyUrl) setProxyUrl(savedProxyUrl);
                if (savedAiModel) setAiModel(savedAiModel);
                if (savedAiEndpoint) setAiEndpoint(savedAiEndpoint);
                if (savedAiApikey) setAiApikey(savedAiApikey);
                if (savedCrawlSites) setCrawlSites(JSON.parse(savedCrawlSites));
                if (savedCrawlerEnabled) setCrawlerEnabled(savedCrawlerEnabled === '1');
                if (savedFixerEnabled) setFixerEnabled(savedFixerEnabled === '1');
            } catch (err) {
                console.error('获取设置失败:', err);
                setError('获取设置失败，请重试');
            }
        };

        loadSettings();
        loadModels();
        setSaveSuccess(false);
        setError('');
    }, [open]);

    // 手动保存设置函数
    const saveSettings = async () => {
        try {
            await window.electron.database.saveSetting('tmdb_api_key', apiKey);
            await window.electron.database.saveSetting('dns_server', dnsServer);
            await window.electron.database.saveSetting('use_proxy', useProxy ? '1' : '0');
            await window.electron.database.saveSetting('proxy_url', proxyUrl);
            await window.electron.database.saveSetting('ai_model', aiModel);
            await window.electron.database.saveSetting('ai_endpoint', aiEndpoint);
            await window.electron.database.saveSetting('ai_apikey', aiApikey);
            await window.electron.database.saveSetting('crawl_sites', JSON.stringify(crawlSites));
            await window.electron.database.saveSetting('crawler_enabled', crawlerEnabled ? '1' : '0');
            await window.electron.database.saveSetting('fixer_enabled', fixerEnabled ? '1' : '0');
            setSaveSuccess(true);
            setError('');
            onClose();
        } catch (err) {
            console.error('保存设置失败:', err);
            setError('保存设置失败，请重试');
            setSaveSuccess(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>应用设置</DialogTitle>
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                <Box sx={{ my: 2 }}>
                    <Typography variant="body1" gutterBottom>
                        请输入TheMovieDB API密钥，用于获取电影数据
                    </Typography>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="API密钥"
                        type={showApiKey ? "text" : "password"}
                        fullWidth
                        variant="outlined"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="输入您的TMDB API密钥"
                        helperText="您可以在TheMovieDB官网获取API密钥"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="切换密钥可见性"
                                        onClick={() => setShowApiKey(!showApiKey)}
                                        edge="end"
                                    >
                                        {showApiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        margin="dense"
                        label="DNS服务器"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={dnsServer}
                        onChange={(e) => setDnsServer(e.target.value)}
                        placeholder="输入DNS服务器地址（例如：8.8.8.8）"
                        helperText="设置自定义DNS服务器以解决API访问问题"
                        sx={{ mt: 2 }}
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={useProxy}
                                onChange={(e) => setUseProxy(e.target.checked)}
                                color="primary"
                            />
                        }
                        label="启用代理"
                        sx={{ mt: 2, mb: 1 }}
                    />
                    <TextField
                        margin="dense"
                        label="代理服务器"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={proxyUrl}
                        onChange={(e) => setProxyUrl(e.target.value)}
                        placeholder="输入代理服务器地址（例如：socks5://127.0.0.1:7890）"
                        helperText="设置代理服务器完整地址，包含协议和端口"
                        disabled={!useProxy}
                        sx={{ mt: 1 }}
                    />
                    <TextField
                        margin="dense"
                        label="AI服务地址"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={aiEndpoint}
                        onChange={(e) => setAiEndpoint(e.target.value)}
                        placeholder={"输入OpenAI兼容服务地址"}
                        helperText={'http://localhost:11434/v1/'}
                        sx={{ mt: 2 }}
                    />
                    <FormControl fullWidth margin="dense" sx={{ mt: 2 }}>
                        <InputLabel id="ai-model-select-label">AI模型</InputLabel>
                        <Select
                            labelId="ai-model-select-label"
                            value={aiModel}
                            label="AI模型"
                            onChange={(e) => setAiModel(e.target.value)}
                        >
                            {availableModels.map((model) => (
                                <MenuItem key={model} value={model}>
                                    {model}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        margin="dense"
                        label="OpenAI API密钥"
                        type={showAiApikey ? "text" : "password"}
                        fullWidth
                        variant="outlined"
                        value={aiApikey}
                        onChange={(e) => setAiApikey(e.target.value)}
                        placeholder="输入您的OpenAI API密钥"
                        helperText="用于访问OpenAI服务的API密钥"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="切换密钥可见性"
                                        onClick={() => setShowAiApikey(!showAiApikey)}
                                        edge="end"
                                    >
                                        {showAiApikey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        sx={{ mt: 2 }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 3, mb: 2 }}>
                        <Typography variant="h6">
                            爬取网站列表
                        </Typography>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={crawlerEnabled}
                                    onChange={async (e) => {
                                        const newStatus = e.target.checked;
                                        try {
                                            let result = false;
                                            if (newStatus == true) {
                                                result = await window.electron.crawler.startCrawlers({
                                                    crawlerSites: crawlSites
                                                });
                                            } else {
                                                result = await window.electron.crawler.stopCrawlers({
                                                    crawlerSites: crawlSites
                                                });
                                            }
                                            if (result.success) {
                                                await window.electron.database.saveSetting('crawler_enabled', newStatus ? '1' : '0');
                                                setCrawlerEnabled(newStatus);
                                            } else {
                                                throw new Error('更新爬虫状态失败');
                                            }
                                        } catch (err) {
                                            console.error('更新爬虫状态失败:', err);
                                            setError('更新爬虫状态失败，请重试');
                                        }
                                    }}
                                    color="primary"
                                />
                            }
                            label="爬虫"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={fixerEnabled}
                                    onChange={async (e) => {
                                        const newStatus = e.target.checked;
                                        try {
                                            const result = false;
                                            if (newStatus == true) {
                                                result = await window.electron.fixer.startFixer();
                                            } else {
                                                result = await window.electron.fixer.stopFixer();
                                            }
                                            if (result.success) {
                                                await window.electron.database.saveSetting('fixer_enabled', newStatus ? '1' : '0');
                                                setFixerEnabled(newStatus);
                                            } else {
                                                throw new Error('更新修复器状态失败');
                                            }
                                        } catch (err) {
                                            console.error('更新修复器状态失败:', err);
                                            setError('更新修复器状态失败，请重试');
                                        }
                                    }}
                                    color="primary"
                                />
                            }
                            label="削刮"
                        />
                    </Box>
                    {crawlSites.map((site, index) => (
                        <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <TextField
                                label="网站地址"
                                value={site.url}
                                onChange={(e) => {
                                    const newSites = [...crawlSites];
                                    newSites[index].url = e.target.value;
                                    setCrawlSites(newSites);
                                }}
                                fullWidth
                                variant="outlined"
                                size="small"
                                placeholder="输入或粘贴网站地址"
                                multiline
                                maxRows={3}
                                inputProps={{
                                    style: { cursor: 'text' }
                                }}
                            />
                            <IconButton
                                onClick={() => {
                                    const newSites = crawlSites.filter((_, i) => i !== index);
                                    setCrawlSites(newSites);
                                }}
                                color="error"
                                sx={{ mt: 1 }}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Box>
                    ))}
                    <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => setCrawlSites([...crawlSites, { url: '' }])}
                        sx={{ mt: 1 }}
                    >
                        添加网站
                    </Button>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={async () => {
                        await window.electron.openDevTools();
                    }}
                    color="secondary"
                    startIcon={<BugReportIcon />}
                    sx={{ mr: 0, mb: 1 }}
                >
                    调试
                </Button>
                {saveSuccess && (
                    <Alert severity="success" sx={{ mr: 'auto' }}>
                        设置已保存成功!
                    </Alert>
                )}
                <Button onClick={onClose} color="secondary" sx={{ mr: 0, mb: 1 }}>
                    取消
                </Button>
                <Button onClick={saveSettings} color="primary" variant="contained" sx={{ mr: 3, mb: 1 }}>
                    保存
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default Settings;