import axios from 'axios';
import { getLocalStorage, setLocalStorage } from '../utils/storage';

// LLM API service for interacting with backend LLM endpoints
const STORAGE_KEY_LLM_SETTINGS = 'mindflex_llm_settings';

// Default settings for Ollama
const DEFAULT_SETTINGS = {
  activeProvider: 'local',
  providers: {
    openai: {
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      defaultModel: 'gpt-3.5-turbo'
    },
    anthropic: {
      apiKey: '',
      baseUrl: 'https://api.anthropic.com/v1',
      defaultModel: 'claude-3-sonnet-20240229'
    },
    local: {
      apiKey: '',
      baseUrl: 'http://localhost:11434',
      defaultModel: 'llama3:8b-instruct-q8_0'
    }
  }
};

// Create axios instance for LLM API
const baseUrlRaw = process.env.REACT_APP_API_URL || 'http://localhost:5000';
// Normalize: remove trailing slash if present
const baseUrl = baseUrlRaw.endsWith('/') ? baseUrlRaw.slice(0, -1) : baseUrlRaw;

// Create axios instance with normalized base URL
const llmAxios = axios.create({
  baseURL: `${baseUrl}/api`,
});

// Get settings from local storage
export const getLLMSettings = () => {
  const settings = getLocalStorage(STORAGE_KEY_LLM_SETTINGS);
  return settings ? settings : DEFAULT_SETTINGS;
};

// Save settings to local storage
export const saveLLMSettings = (settings) => {
  setLocalStorage(STORAGE_KEY_LLM_SETTINGS, settings);
  return settings;
};

// Get active provider settings
export const getActiveProviderSettings = () => {
  const settings = getLLMSettings();
  return {
    provider: settings.activeProvider,
    ...settings.providers[settings.activeProvider]
  };
};

// LLM API functions
export const llmApi = {
  // Get available LLM models from backend
  getModels: async () => {
    try {
      const response = await llmAxios.get('/llm/models');
      return response.data;
    } catch (error) {
      console.error('Error fetching LLM models:', error);
      throw error;
    }
  },

  // Get available Ollama models directly from Ollama API
  getOllamaModels: async (baseUrl = 'http://localhost:11434') => {
    // Check if we're running in a production environment (not on localhost)
    const isProduction = window.location.hostname !== 'localhost' && 
                         window.location.hostname !== '127.0.0.1';
                         
    // If in production, don't even try to connect to localhost Ollama
    if (isProduction && baseUrl.includes('localhost')) {
      console.log('Running in production environment, skipping local Ollama connection');
      return [
        { name: 'llama3:8b-instruct-q8_0', modified_at: new Date().toISOString() },
        { name: 'llama2:latest', modified_at: new Date().toISOString() },
        { name: 'mistral:latest', modified_at: new Date().toISOString() }
      ];
    }
    
    try {
      console.log('Fetching Ollama models from:', `${baseUrl}/api/tags`);
      const response = await axios.get(`${baseUrl}/api/tags`);
      console.log('Ollama models response:', response.data);
      return response.data.models || [];
    } catch (error) {
      console.error('Error fetching Ollama models:', error);
      // Return fallback model list if Ollama API is not available
      return [
        { name: 'llama3:8b-instruct-q8_0', modified_at: new Date().toISOString() },
        { name: 'llama2:latest', modified_at: new Date().toISOString() },
        { name: 'mistral:latest', modified_at: new Date().toISOString() }
      ];
    }
  },

  // Chat with LLM
  chat: async (messages, modelId = null) => {
    try {
      const settings = getActiveProviderSettings();
      
      console.log('Chat request settings:', {
        provider: settings.provider,
        model: modelId || settings.defaultModel,
        baseUrl: settings.baseUrl
      });
      
      // For local providers, allow direct connection to Ollama
      if (settings.provider === 'local') {
        try {
          // Try the backend API first
          console.log('Trying backend API first...');
          const response = await llmAxios.post('/llm/chat', {
            messages,
            model_id: modelId || settings.defaultModel,
            provider: settings.provider
          });
          
          return response.data;
        } catch (backendError) {
          console.warn('Backend API failed, trying direct Ollama connection:', backendError);
          
          if (backendError.message.includes('404')) {
            console.log('Backend server is not running or the /api/llm/chat endpoint is not available.');
            console.log('This is normal if you are only using Ollama directly without the Flask backend.');
          }
          
          // If backend fails, try direct connection to Ollama
          try {
            console.log('Trying Ollama /api/chat endpoint...');
            const ollamaResponse = await axios.post(`${settings.baseUrl}/api/chat`, {
              model: modelId || settings.defaultModel,
              messages: messages.map(msg => ({
                role: msg.role === 'system' ? 'system' : msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content
              })),
              stream: false,
              options: {
                temperature: 0.7,
                num_predict: 1024
              }
            });
            
            console.log('Ollama chat response:', ollamaResponse.data);
            
            // Transform Ollama response to match our API format
            // Different Ollama versions have different response formats
            let responseContent = "No response content";
            
            if (ollamaResponse.data.message && ollamaResponse.data.message.content) {
              // Newer Ollama versions
              responseContent = ollamaResponse.data.message.content;
            } else if (ollamaResponse.data.response) {
              // Older Ollama versions
              responseContent = ollamaResponse.data.response;
            } else if (typeof ollamaResponse.data === 'string') {
              // Some Ollama versions might return a direct string
              responseContent = ollamaResponse.data;
            }
            
            return {
              response: responseContent,
              model: ollamaResponse.data.model,
              provider: 'local'
            };
          } catch (chatEndpointError) {
            console.warn('Ollama /api/chat endpoint failed, trying /api/generate:', chatEndpointError);
            
            // Fallback to the older /api/generate endpoint
            const prompt = messages.map(msg => `${msg.role === 'user' ? 'User: ' : 'System: '}${msg.content}`).join('\n');
            const ollamaResponse = await axios.post(`${settings.baseUrl}/api/generate`, {
              model: modelId || settings.defaultModel,
              prompt: prompt,
              stream: false
            });
            
            console.log('Ollama generate response:', ollamaResponse.data);
            
            return {
              response: ollamaResponse.data.response || "No response content",
              model: ollamaResponse.data.model,
              provider: 'local'
            };
          }
        }
      } else {
        // Cloud providers still go through our backend
        const response = await llmAxios.post('/llm/chat', {
          messages,
          model_id: modelId || settings.defaultModel,
          provider: settings.provider
        });
        
        return response.data;
      }
    } catch (error) {
      console.error('Error in LLM chat:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      throw error;
    }
  },

  // Generate cognitive exercise
  generateExercise: async (gameType, difficulty, userProfile = {}) => {
    try {
      const settings = getActiveProviderSettings();
      
      const response = await llmAxios.post('/llm/generate-exercise', {
        game_type: gameType,
        difficulty,
        user_profile: userProfile,
        provider: settings.provider
      });
      
      return response.data;
    } catch (error) {
      console.error('Error generating exercise:', error);
      throw error;
    }
  },

  // Evaluate user answer
  evaluateAnswer: async (exercise, userAnswer) => {
    try {
      const settings = getActiveProviderSettings();
      
      const response = await llmAxios.post('/llm/evaluate-answer', {
        exercise,
        user_answer: userAnswer,
        provider: settings.provider
      });
      
      return response.data;
    } catch (error) {
      console.error('Error evaluating answer:', error);
      throw error;
    }
  },

  // Recommend sounds based on mood
  recommendSounds: async (mood, preferences = [], therapyGoal = null) => {
    try {
      const settings = getActiveProviderSettings();
      
      const response = await llmAxios.post('/llm/recommend-sounds', {
        mood,
        preferences,
        therapy_goal: therapyGoal,
        provider: settings.provider
      });
      
      return response.data;
    } catch (error) {
      console.error('Error recommending sounds:', error);
      throw error;
    }
  },

  // Generate guided meditation
  generateMeditation: async (duration, focusArea, experienceLevel = 'beginner') => {
    try {
      const settings = getActiveProviderSettings();
      
      const response = await llmAxios.post('/llm/guided-meditation', {
        duration,
        focus_area: focusArea,
        experience_level: experienceLevel,
        provider: settings.provider
      });
      
      return response.data;
    } catch (error) {
      console.error('Error generating meditation:', error);
      throw error;
    }
  },

  // Analyze patient progress
  analyzePatient: async (patientData) => {
    try {
      const settings = getActiveProviderSettings();
      
      const response = await llmAxios.post('/llm/analyze-patient', {
        patient_data: patientData,
        provider: settings.provider
      });
      
      return response.data;
    } catch (error) {
      console.error('Error analyzing patient:', error);
      throw error;
    }
  },

  // Generate daily plan
  generateDailyPlan: async (patientProfile, caregiverConstraints = {}) => {
    try {
      const settings = getActiveProviderSettings();
      
      const response = await llmAxios.post('/llm/daily-plan', {
        patient_profile: patientProfile,
        caregiver_constraints: caregiverConstraints,
        provider: settings.provider
      });
      
      return response.data;
    } catch (error) {
      console.error('Error generating daily plan:', error);
      throw error;
    }
  }
};

export default llmApi; 