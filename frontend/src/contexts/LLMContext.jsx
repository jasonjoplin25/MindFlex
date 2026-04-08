import React, { createContext, useState, useContext, useEffect } from 'react';
import { getLLMSettings, saveLLMSettings, llmApi } from '../services/llmService';

// Create context
const LLMContext = createContext();

// Provider component
export const LLMProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeProvider, setActiveProvider] = useState('local');
  const [availableModels, setAvailableModels] = useState({});
  
  // Initialize settings from localStorage
  useEffect(() => {
    const initializeSettings = async () => {
      try {
        setIsLoading(true);
        const storedSettings = getLLMSettings();
        setSettings(storedSettings);
        setActiveProvider(storedSettings.activeProvider);
        
        // Try to fetch Ollama models to update defaults if needed
        try {
          // Only try to fetch if we're using local provider
          if (storedSettings.activeProvider === 'local') {
            const ollamaModels = await llmApi.getOllamaModels(storedSettings.providers.local.baseUrl);
            const modelNames = ollamaModels.map(model => model.name);
            
            setAvailableModels(prev => ({
              ...prev,
              local: modelNames
            }));
            
            // If we have models but the default isn't in the list, update it
            if (modelNames.length > 0 && !modelNames.includes(storedSettings.providers.local.defaultModel)) {
              const updatedSettings = {
                ...storedSettings,
                providers: {
                  ...storedSettings.providers,
                  local: {
                    ...storedSettings.providers.local,
                    defaultModel: modelNames[0]
                  }
                }
              };
              setSettings(updatedSettings);
              saveLLMSettings(updatedSettings);
              console.log('Updated default Ollama model to:', modelNames[0]);
            }
          }
        } catch (error) {
          console.warn('Could not fetch Ollama models during initialization:', error);
        }
      } catch (error) {
        console.error('Error initializing LLM settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeSettings();
  }, []);
  
  // Update provider settings
  const updateProviderSettings = (provider, newSettings) => {
    if (!settings) return;
    
    const updatedSettings = {
      ...settings,
      providers: {
        ...settings.providers,
        [provider]: {
          ...settings.providers[provider],
          ...newSettings
        }
      }
    };
    
    setSettings(updatedSettings);
    saveLLMSettings(updatedSettings);
    return updatedSettings;
  };
  
  // Change active provider
  const changeActiveProvider = (provider) => {
    if (!settings) return;
    if (!settings.providers[provider]) return;
    
    const updatedSettings = {
      ...settings,
      activeProvider: provider
    };
    
    setSettings(updatedSettings);
    setActiveProvider(provider);
    saveLLMSettings(updatedSettings);
    return updatedSettings;
  };
  
  // Reset settings to defaults
  const resetSettings = () => {
    const defaultSettings = getLLMSettings(); // This will return defaults if no settings exist
    setSettings(defaultSettings);
    setActiveProvider(defaultSettings.activeProvider);
    saveLLMSettings(defaultSettings);
    return defaultSettings;
  };
  
  // Get current provider's settings
  const getCurrentProviderSettings = () => {
    if (!settings) return null;
    return {
      provider: activeProvider,
      ...settings.providers[activeProvider]
    };
  };
  
  // Get available models for a provider
  const getModelsForProvider = async (provider) => {
    try {
      if (provider === 'local') {
        const ollamaModels = await llmApi.getOllamaModels(settings.providers.local.baseUrl);
        const modelNames = ollamaModels.map(model => model.name);
        setAvailableModels(prev => ({
          ...prev,
          local: modelNames
        }));
        return modelNames;
      } else {
        // For cloud providers, return hardcoded lists for now
        const models = {
          openai: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o'],
          anthropic: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
        };
        return models[provider] || [];
      }
    } catch (error) {
      console.error(`Error fetching models for provider ${provider}:`, error);
      return [];
    }
  };
  
  // Context value
  const value = {
    settings,
    isLoading,
    activeProvider,
    availableModels,
    updateProviderSettings,
    changeActiveProvider,
    resetSettings,
    getCurrentProviderSettings,
    getModelsForProvider
  };
  
  return <LLMContext.Provider value={value}>{children}</LLMContext.Provider>;
};

// Custom hook to use the LLM context
export const useLLM = () => {
  const context = useContext(LLMContext);
  if (context === undefined) {
    throw new Error('useLLM must be used within an LLMProvider');
  }
  return context;
};

export default LLMContext; 