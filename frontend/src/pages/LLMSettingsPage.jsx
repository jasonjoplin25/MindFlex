import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  Grid,
  CircularProgress,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Tooltip,
  Link,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  SmartToy as SmartToyIcon,
  Api as ApiIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useLLM } from '../contexts/LLMContext';
import { llmApi } from '../services/llmService';
import axios from 'axios';

// Styled components
const SettingsContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
}));

const ProviderLogo = styled('img')(({ theme }) => ({
  height: 32,
  marginRight: theme.spacing(1),
}));

const StatusIndicator = styled(Box)(({ theme, status }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: theme.spacing(0.5, 1),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: status === 'connected' 
    ? theme.palette.success.light 
    : status === 'error' 
      ? theme.palette.error.light
      : theme.palette.grey[300],
  color: status === 'connected' 
    ? theme.palette.success.contrastText 
    : status === 'error' 
      ? theme.palette.error.contrastText
      : theme.palette.text.secondary,
  marginLeft: theme.spacing(2),
  fontSize: '0.75rem',
  fontWeight: 500,
}));

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`llm-tabpanel-${index}`}
      aria-labelledby={`llm-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const LLMSettingsPage = () => {
  const { 
    settings, 
    activeProvider, 
    updateProviderSettings, 
    changeActiveProvider,
    resetSettings,
    isLoading 
  } = useLLM();
  
  const [currentTab, setCurrentTab] = useState(0);
  const [providerStatus, setProviderStatus] = useState({});
  const [selectedModels, setSelectedModels] = useState({});
  const [localSettings, setLocalSettings] = useState({});
  const [availableModels, setAvailableModels] = useState({});
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Providers array
  const providers = [
    { id: 'local', name: 'Ollama (Local)', tab: 0, icon: <SmartToyIcon /> },
    { id: 'openai', name: 'OpenAI', tab: 1, icon: <ApiIcon /> },
    { id: 'anthropic', name: 'Anthropic', tab: 2, icon: <ApiIcon /> },
  ];
  
  // Initialize local settings from context
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings.providers);
      
      // Set selected models
      const models = {};
      Object.keys(settings.providers).forEach(provider => {
        models[provider] = settings.providers[provider].defaultModel;
      });
      setSelectedModels(models);
      
      // Set active tab based on active provider
      const activeTab = providers.find(p => p.id === activeProvider)?.tab || 0;
      setCurrentTab(activeTab);
      
      // Fetch models for current provider
      fetchModels(activeProvider);
    }
  }, [settings, activeProvider]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Handle setting change
  const handleSettingChange = (provider, field, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };

  // Handle model selection
  const handleModelSelect = (provider, model) => {
    setSelectedModels(prev => ({
      ...prev,
      [provider]: model
    }));
    
    handleSettingChange(provider, 'defaultModel', model);
  };

  // Save provider settings
  const handleSaveSettings = (provider) => {
    const updatedSettings = updateProviderSettings(provider, localSettings[provider]);
    
    if (updatedSettings) {
      setMessage({
        type: 'success',
        text: `Settings for ${providers.find(p => p.id === provider)?.name} have been saved.`
      });
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  // Set as active provider
  const handleSetActive = (provider) => {
    const updated = changeActiveProvider(provider);
    
    if (updated) {
      setMessage({
        type: 'success',
        text: `${providers.find(p => p.id === provider)?.name} is now the active LLM provider.`
      });
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  // Test connection
  const handleTestConnection = async (provider) => {
    setIsTesting(true);
    setProviderStatus(prev => ({ ...prev, [provider]: 'testing' }));
    
    try {
      // First, save current settings
      updateProviderSettings(provider, localSettings[provider]);
      
      // Temporarily change active provider for the test
      const originalProvider = activeProvider;
      changeActiveProvider(provider);
      
      if (provider === 'local') {
        try {
          // Check if Ollama is running first by calling the API directly
          const baseUrl = localSettings[provider]?.baseUrl || 'http://localhost:11434';
          
          try {
            // Try to fetch models to verify Ollama is running
            const ollamaCheck = await axios.get(`${baseUrl}/api/tags`);
            console.log('Ollama is running:', ollamaCheck.data);
            
            // Get the selected model or use the first available model
            const modelToUse = selectedModels[provider] || 
                              (ollamaCheck.data.models && ollamaCheck.data.models.length > 0 ? 
                               ollamaCheck.data.models[0].name : 'llama3:8b-instruct-q8_0');
            
            // Try the backend API first
            try {
              console.log('Testing with backend API...');
              const result = await llmApi.chat([
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: 'Hello, this is a connection test!' }
              ], modelToUse);
              
              // Determine if this was a direct Ollama connection or backend API
              const isDirectOllamaConnection = !result.status && result.provider === 'local';
              
              console.log(isDirectOllamaConnection ? 
                'Direct Ollama connection successful:' : 
                'Backend API test successful:', result);
              
              // Update status
              setProviderStatus(prev => ({ ...prev, [provider]: 'connected' }));
              setMessage({
                type: 'success',
                text: isDirectOllamaConnection ?
                  `Direct connection to Ollama successful! Response: "${result.response?.substring(0, 50)}${result.response?.length > 50 ? '...' : ''}"` :
                  `Connection to backend LLM API successful!`
              });
            } catch (backendError) {
              console.log('Backend API test failed, trying direct Ollama connection...');
              
              // Try direct Ollama connection
              try {
                const response = await axios.post(`${baseUrl}/api/chat`, {
                  model: modelToUse,
                  messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    { role: 'user', content: 'Hello, this is a connection test!' }
                  ],
                  stream: false,
                  options: {
                    temperature: 0.7,
                    num_predict: 512
                  }
                });
                
                console.log('Direct Ollama connection successful:', response.data);
                
                // Extract the response content
                let responseText = "No response content";
                if (response.data.message && response.data.message.content) {
                  responseText = response.data.message.content;
                } else if (response.data.response) {
                  responseText = response.data.response;
                } else if (typeof response.data === 'string') {
                  responseText = response.data;
                }
                
                // Update status
                setProviderStatus(prev => ({ ...prev, [provider]: 'connected' }));
                setMessage({
                  type: 'success',
                  text: `Direct connection to Ollama successful! Response: "${responseText.substring(0, 50)}${responseText.length > 50 ? '...' : ''}"`
                });
              } catch (ollamaError) {
                console.log('Modern Ollama API failed, trying legacy endpoint...', ollamaError);
                
                // Try legacy Ollama endpoint
                try {
                  const response = await axios.post(`${baseUrl}/api/generate`, {
                    model: modelToUse,
                    prompt: 'Hello, this is a connection test!',
                    stream: false
                  });
                  
                  console.log('Legacy Ollama API successful:', response.data);
                  
                  const responseText = response.data.response || "No response content";
                  
                  // Update status
                  setProviderStatus(prev => ({ ...prev, [provider]: 'connected' }));
                  setMessage({
                    type: 'success',
                    text: `Connection to Ollama successful using legacy API! Response: "${responseText.substring(0, 50)}${responseText.length > 50 ? '...' : ''}"`
                  });
                } catch (legacyError) {
                  console.error('Legacy Ollama API failed:', legacyError);
                  if (ollamaError.response && ollamaError.response.data && ollamaError.response.data.error) {
                    throw new Error(`Could not connect to Ollama: ${ollamaError.response.data.error}`);
                  } else {
                    throw new Error(`Could not connect to Ollama: ${ollamaError.message}`);
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error connecting to Ollama:', error);
            setProviderStatus(prev => ({ ...prev, [provider]: 'error' }));
            
            // Check if the error indicates a model not found
            if (error.response && error.response.data && error.response.data.error && 
                error.response.data.error.includes('model') && error.response.data.error.includes('not found')) {
              setMessage({
                type: 'error',
                text: `Model "${selectedModels[provider]}" not found. Please pull the model first using "ollama pull ${selectedModels[provider]}".`
              });
            } else {
              setMessage({
                type: 'error',
                text: `Cannot connect to Ollama at ${baseUrl}. Is Ollama running?`
              });
            }
          }
        } catch (error) {
          console.error('Ollama test failed:', error);
          setProviderStatus(prev => ({ ...prev, [provider]: 'error' }));
          setMessage({
            type: 'error',
            text: `Ollama test failed: ${error.message}`
          });
        }
      } else {
        // For cloud providers
        try {
          const result = await llmApi.chat([
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'Hello, this is a connection test!' }
          ]);
          
          console.log('Connection test result:', result);
          
          // Update status
          setProviderStatus(prev => ({ ...prev, [provider]: 'connected' }));
          setMessage({
            type: 'success',
            text: `Connection to ${providers.find(p => p.id === provider)?.name} successful!`
          });
        } catch (error) {
          console.error('Connection test failed:', error);
          
          let errorMessage = error.message;
          
          if (error.message.includes('404')) {
            errorMessage = 'Backend API not available. Please make sure the backend server is running.';
          } else if (error.message.includes('Network Error')) {
            errorMessage = 'Network error. Please check your internet connection.';
          } else if (provider === 'openai' && error.message.includes('401')) {
            errorMessage = 'Invalid OpenAI API key. Please check your API key.';
          } else if (provider === 'anthropic' && error.message.includes('401')) {
            errorMessage = 'Invalid Anthropic API key. Please check your API key.';
          }
          
          setProviderStatus(prev => ({ ...prev, [provider]: 'error' }));
          setMessage({
            type: 'error',
            text: `Connection to ${providers.find(p => p.id === provider)?.name} failed: ${errorMessage}`
          });
        }
      }
      
      // Reset active provider if it was changed just for testing
      if (originalProvider !== provider) {
        changeActiveProvider(originalProvider);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setProviderStatus(prev => ({ ...prev, [provider]: 'error' }));
      setMessage({
        type: 'error',
        text: `Connection test failed: ${error.message}`
      });
    } finally {
      setIsTesting(false);
      // Messages will be cleared after 8 seconds
      setTimeout(() => {
        setMessage(prev => 
          prev.type === 'error' ? prev : { type: '', text: '' }
        );
      }, 8000);
    }
  };

  // Fetch available models
  const fetchModels = async (provider) => {
    try {
      setMessage({ type: 'info', text: 'Fetching available models...' });
      
      // Use the context's getModelsForProvider function
      const models = await llmApi.getOllamaModels(localSettings[provider]?.baseUrl || 'http://localhost:11434');
      
      if (provider === 'local') {
        // Format models for display
        const modelNames = models.map(model => model.name);
        
        if (modelNames.length === 0) {
          setMessage({ 
            type: 'warning', 
            text: 'No Ollama models found. Please make sure Ollama is installed and models are pulled.' 
          });
          
          // Set default models as fallback
          setAvailableModels(prev => ({
            ...prev,
            [provider]: ['llama3:8b-instruct-q8_0', 'llama2:latest', 'mistral:latest']
          }));
        } else {
          setAvailableModels(prev => ({
            ...prev,
            [provider]: modelNames
          }));
          
          setMessage({ 
            type: 'success', 
            text: `Found ${modelNames.length} Ollama models` 
          });
          
          // If the currently selected model isn't in the list, select the first available model
          if (modelNames.length > 0 && !modelNames.includes(selectedModels[provider])) {
            handleModelSelect(provider, modelNames[0]);
          }
        }
      } else {
        // For other providers, use hardcoded lists for now
        const providerModels = {
          openai: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o'],
          anthropic: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
        };
        
        setAvailableModels(prev => ({
          ...prev,
          [provider]: providerModels[provider] || []
        }));
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      setMessage({
        type: 'error',
        text: `Failed to fetch models: ${error.message}`
      });
      
      // Provide fallback models depending on provider
      if (provider === 'local') {
        setAvailableModels(prev => ({
          ...prev,
          [provider]: ['llama3:8b-instruct-q8_0', 'llama2:latest', 'mistral:latest']
        }));
      } else {
        const fallbackModels = {
          openai: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o'],
          anthropic: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
        };
        
        setAvailableModels(prev => ({
          ...prev,
          [provider]: fallbackModels[provider] || []
        }));
      }
    } finally {
      // Clear message after a delay if it's still showing the fetching message
      setTimeout(() => {
        setMessage(prev => 
          prev.text === 'Fetching available models...' ? { type: '', text: '' } : prev
        );
      }, 3000);
    }
  };

  // Reset to defaults
  const handleResetDefaults = () => {
    resetSettings();
    setMessage({
      type: 'success',
      text: 'All settings have been reset to defaults.'
    });
    
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <SettingsIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" component="h1" fontWeight="bold">
          LLM Settings
        </Typography>
      </Box>
      
      {message.text && (
        <Alert 
          severity={message.type} 
          sx={{ mb: 3 }}
          onClose={() => setMessage({ type: '', text: '' })}
        >
          {message.text}
        </Alert>
      )}
      
      <SettingsContainer>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Active Provider: <strong>{providers.find(p => p.id === activeProvider)?.name}</strong>
          {providerStatus[activeProvider] === 'connected' && (
            <Chip 
              icon={<CheckIcon />}
              label="Connected" 
              color="success" 
              size="small" 
              sx={{ ml: 2 }}
            />
          )}
        </Typography>
        
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        >
          {providers.map((provider) => (
            <Tab 
              key={provider.id}
              label={provider.name}
              icon={provider.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>
        
        {providers.map((provider, index) => (
          <TabPanel key={provider.id} value={currentTab} index={index}>
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {provider.name} Configuration
                    {providerStatus[provider.id] === 'connected' && (
                      <StatusIndicator status="connected">
                        <CheckIcon fontSize="small" sx={{ mr: 0.5 }} /> Connected
                      </StatusIndicator>
                    )}
                    {providerStatus[provider.id] === 'error' && (
                      <StatusIndicator status="error">
                        <WarningIcon fontSize="small" sx={{ mr: 0.5 }} /> Error
                      </StatusIndicator>
                    )}
                  </Typography>
                  
                  {provider.id === 'local' && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Configure Ollama for local LLM inference. Make sure Ollama is running on your system.
                      <Link href="https://ollama.com" target="_blank" sx={{ ml: 1 }}>
                        Learn more
                      </Link>
                    </Typography>
                  )}
                  
                  {provider.id === 'openai' && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Configure OpenAI API settings. You'll need an API key from your OpenAI account.
                      <Link href="https://platform.openai.com/api-keys" target="_blank" sx={{ ml: 1 }}>
                        Get API key
                      </Link>
                    </Typography>
                  )}
                  
                  {provider.id === 'anthropic' && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Configure Anthropic Claude API settings. You'll need an API key from your Anthropic account.
                      <Link href="https://console.anthropic.com/keys" target="_blank" sx={{ ml: 1 }}>
                        Get API key
                      </Link>
                    </Typography>
                  )}
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="API Key"
                    type="password"
                    value={localSettings[provider.id]?.apiKey || ''}
                    onChange={(e) => handleSettingChange(provider.id, 'apiKey', e.target.value)}
                    margin="normal"
                    helperText={
                      provider.id === 'local' 
                        ? "Leave blank for default Ollama installation" 
                        : "Enter your API key"
                    }
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="API Base URL"
                    value={localSettings[provider.id]?.baseUrl || ''}
                    onChange={(e) => handleSettingChange(provider.id, 'baseUrl', e.target.value)}
                    margin="normal"
                    helperText={
                      provider.id === 'local' 
                        ? "Default: http://localhost:11434" 
                        : "API endpoint"
                    }
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Default Model</InputLabel>
                    <Select
                      value={selectedModels[provider.id] || ''}
                      onChange={(e) => handleModelSelect(provider.id, e.target.value)}
                      label="Default Model"
                      onOpen={() => fetchModels(provider.id)}
                    >
                      {availableModels[provider.id]?.map(model => (
                        <MenuItem key={model} value={model}>
                          {model}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={() => handleSaveSettings(provider.id)}
                    >
                      Save Settings
                    </Button>
                    
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={isTesting ? <CircularProgress size={20} /> : <RefreshIcon />}
                      onClick={() => handleTestConnection(provider.id)}
                      disabled={isTesting}
                    >
                      Test Connection
                    </Button>
                    
                    {provider.id !== activeProvider && (
                      <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => handleSetActive(provider.id)}
                      >
                        Set as Active
                      </Button>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>
        ))}
      </SettingsContainer>
      
      <SettingsContainer>
        <Typography variant="h6" sx={{ mb: 2 }}>
          General Settings
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings?.autoSwitch || false}
                  onChange={(e) => {
                    updateProviderSettings('general', { autoSwitch: e.target.checked });
                  }}
                />
              }
              label="Auto-switch to backup provider on failure"
            />
            <Typography variant="caption" color="text.secondary" display="block">
              If enabled, the system will automatically try the next provider if the current one fails
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<RefreshIcon />}
              onClick={handleResetDefaults}
              sx={{ mt: 2 }}
            >
              Reset to Defaults
            </Button>
          </Grid>
        </Grid>
      </SettingsContainer>
      
      <SettingsContainer>
        <Typography variant="h6" sx={{ mb: 2 }}>
          LLM Features
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', height: '100%' }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                Cognitive Exercises
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Generate personalized cognitive exercises based on user profile and preferences.
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', height: '100%' }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                Patient Analysis
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Get insights from patient data to help caregivers provide better support.
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', height: '100%' }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                Guided Meditations
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Generate customized guided meditation scripts based on mood and preferences.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </SettingsContainer>
    </Container>
  );
};

export default LLMSettingsPage; 