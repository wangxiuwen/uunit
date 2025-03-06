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
  Switch
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

interface SettingsProps {
  open: boolean;
  onClose: () => void;
}

const Settings = ({ open, onClose }: SettingsProps) => {
  const [apiKey, setApiKey] = useState('');
  const [dnsServer, setDnsServer] = useState('');
  const [useProxy, setUseProxy] = useState(false);
  const [proxyUrl, setProxyUrl] = useState('socks5://127.0.0.1:7890');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // 组件加载时从主进程获取设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedApiKey = await window.electron.database.getSetting('tmdb_api_key');
        const savedDnsServer = await window.electron.database.getSetting('dns_server');
        const savedUseProxy = await window.electron.database.getSetting('use_proxy');
        const savedProxyUrl = await window.electron.database.getSetting('proxy_url');
        
        if (savedApiKey) setApiKey(savedApiKey);
        if (savedDnsServer) setDnsServer(savedDnsServer);
        if (savedUseProxy) setUseProxy(savedUseProxy === '1');
        if (savedProxyUrl) setProxyUrl(savedProxyUrl);
      } catch (err) {
        console.error('获取设置失败:', err);
        setError('获取设置失败，请重试');
      }
    };
    
    loadSettings();
    setSaveSuccess(false);
    setError('');
  }, [open]);

  const handleSave = async () => {
    try {
      await window.electron.database.saveSetting('tmdb_api_key', apiKey);
      await window.electron.database.saveSetting('dns_server', dnsServer);
      await window.electron.database.saveSetting('use_proxy', useProxy ? '1' : '0');
      await window.electron.database.saveSetting('proxy_url', proxyUrl);
      
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
        </Box>
        {saveSuccess && (
          <Alert severity="success" sx={{ mt: 2 }}>
            设置已保存成功！
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Settings;