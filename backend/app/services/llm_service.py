import os
import json
import logging
from typing import Dict, List, Any, Optional, Union
import requests
from abc import ABC, abstractmethod

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LLMProvider(ABC):
    """Abstract base class for LLM providers"""
    
    @abstractmethod
    def generate_text(self, prompt: str, options: Dict[str, Any] = None) -> str:
        """Generate text based on the prompt"""
        pass
    
    @abstractmethod
    def generate_chat(self, messages: List[Dict[str, str]], options: Dict[str, Any] = None) -> str:
        """Generate a response based on a conversation history"""
        pass
    
    @abstractmethod
    def embedding(self, text: str) -> List[float]:
        """Get vector embedding for the text"""
        pass

class OpenAIProvider(LLMProvider):
    """Implementation for OpenAI API"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.openai.com/v1"
        
    def generate_text(self, prompt: str, options: Dict[str, Any] = None) -> str:
        """Generate text using OpenAI Completions API"""
        if options is None:
            options = {}
            
        model = options.get("model", "gpt-3.5-turbo-instruct")
        max_tokens = options.get("max_tokens", 500)
        temperature = options.get("temperature", 0.7)
        
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            data = {
                "model": model,
                "prompt": prompt,
                "max_tokens": max_tokens,
                "temperature": temperature
            }
            
            response = requests.post(
                f"{self.base_url}/completions",
                headers=headers,
                json=data
            )
            
            response.raise_for_status()
            return response.json()["choices"][0]["text"].strip()
            
        except Exception as e:
            logger.error(f"Error in OpenAI text generation: {str(e)}")
            return f"Error generating response: {str(e)}"
    
    def generate_chat(self, messages: List[Dict[str, str]], options: Dict[str, Any] = None) -> str:
        """Generate chat response using OpenAI Chat API"""
        if options is None:
            options = {}
            
        model = options.get("model", "gpt-3.5-turbo")
        max_tokens = options.get("max_tokens", 500)
        temperature = options.get("temperature", 0.7)
        
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            data = {
                "model": model,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": temperature
            }
            
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=data
            )
            
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"].strip()
            
        except Exception as e:
            logger.error(f"Error in OpenAI chat generation: {str(e)}")
            return f"Error generating response: {str(e)}"
    
    def embedding(self, text: str) -> List[float]:
        """Get embedding vector using OpenAI Embeddings API"""
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            data = {
                "model": "text-embedding-ada-002",
                "input": text
            }
            
            response = requests.post(
                f"{self.base_url}/embeddings",
                headers=headers,
                json=data
            )
            
            response.raise_for_status()
            return response.json()["data"][0]["embedding"]
            
        except Exception as e:
            logger.error(f"Error in OpenAI embedding: {str(e)}")
            return []

class AnthropicProvider(LLMProvider):
    """Implementation for Anthropic (Claude) API"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.anthropic.com/v1"
    
    def generate_text(self, prompt: str, options: Dict[str, Any] = None) -> str:
        """Generate text using Anthropic API"""
        # Convert to chat format as Anthropic uses chat for everything
        messages = [{"role": "user", "content": prompt}]
        return self.generate_chat(messages, options)
    
    def generate_chat(self, messages: List[Dict[str, str]], options: Dict[str, Any] = None) -> str:
        """Generate chat response using Anthropic API"""
        if options is None:
            options = {}
            
        model = options.get("model", "claude-3-sonnet-20240229")
        max_tokens = options.get("max_tokens", 500)
        temperature = options.get("temperature", 0.7)
        
        try:
            headers = {
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json"
            }
            
            # Convert from OpenAI format to Anthropic format
            anthropic_messages = []
            for msg in messages:
                role = "assistant" if msg["role"] == "assistant" else "user"
                anthropic_messages.append({"role": role, "content": msg["content"]})
            
            data = {
                "model": model,
                "messages": anthropic_messages,
                "max_tokens": max_tokens,
                "temperature": temperature
            }
            
            response = requests.post(
                f"{self.base_url}/messages",
                headers=headers,
                json=data
            )
            
            response.raise_for_status()
            return response.json()["content"][0]["text"]
            
        except Exception as e:
            logger.error(f"Error in Anthropic generation: {str(e)}")
            return f"Error generating response: {str(e)}"
    
    def embedding(self, text: str) -> List[float]:
        """Anthropic doesn't provide embeddings API, so we'll use a placeholder"""
        logger.warning("Anthropic doesn't provide embeddings API")
        return []

class LocalLLMProvider(LLMProvider):
    """Implementation for local models via API (e.g., LM Studio, Ollama)"""
    
    def __init__(self, base_url: str = "http://localhost:8080"):
        self.base_url = base_url
    
    def generate_text(self, prompt: str, options: Dict[str, Any] = None) -> str:
        """Generate text using local API"""
        # Convert to chat format
        messages = [{"role": "user", "content": prompt}]
        return self.generate_chat(messages, options)
    
    def generate_chat(self, messages: List[Dict[str, str]], options: Dict[str, Any] = None) -> str:
        """Generate chat response using local API"""
        if options is None:
            options = {}
            
        model = options.get("model", "default")  # Model name if multiple are available
        max_tokens = options.get("max_tokens", 500)
        temperature = options.get("temperature", 0.7)
        
        try:
            headers = {
                "Content-Type": "application/json"
            }
            
            data = {
                "model": model,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": temperature
            }
            
            response = requests.post(
                f"{self.base_url}/v1/chat/completions",
                headers=headers,
                json=data
            )
            
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"].strip()
            
        except Exception as e:
            logger.error(f"Error in Local LLM generation: {str(e)}")
            return f"Error generating response: {str(e)}"
    
    def embedding(self, text: str) -> List[float]:
        """Get embedding vector using local API if available"""
        try:
            headers = {
                "Content-Type": "application/json"
            }
            
            data = {
                "input": text
            }
            
            response = requests.post(
                f"{self.base_url}/v1/embeddings",
                headers=headers,
                json=data
            )
            
            response.raise_for_status()
            return response.json()["data"][0]["embedding"]
            
        except Exception as e:
            logger.error(f"Error in Local LLM embedding: {str(e)}")
            return []

class LLMService:
    """Service for accessing different LLM providers"""
    
    def __init__(self):
        self.providers = {}
        self._initialize_providers()
    
    def _initialize_providers(self):
        """Initialize all configured providers"""
        # OpenAI (if API key is available)
        openai_api_key = os.environ.get("OPENAI_API_KEY")
        if openai_api_key:
            self.providers["openai"] = OpenAIProvider(openai_api_key)
        
        # Anthropic (if API key is available)
        anthropic_api_key = os.environ.get("ANTHROPIC_API_KEY")
        if anthropic_api_key:
            self.providers["anthropic"] = AnthropicProvider(anthropic_api_key)
        
        # Local LLM (always available as fallback)
        local_api_url = os.environ.get("LOCAL_LLM_API_URL", "http://localhost:8080")
        self.providers["local"] = LocalLLMProvider(local_api_url)
    
    def get_provider(self, provider_name: str = None) -> LLMProvider:
        """Get an LLM provider by name, or default"""
        if provider_name and provider_name in self.providers:
            return self.providers[provider_name]
        
        # Return default provider (OpenAI > Anthropic > Local)
        if "openai" in self.providers:
            return self.providers["openai"]
        elif "anthropic" in self.providers:
            return self.providers["anthropic"]
        elif "local" in self.providers:
            return self.providers["local"]
        else:
            raise ValueError("No LLM providers are available")

# Singleton instance
_instance = None

def get_llm_service() -> LLMService:
    """Get the singleton LLM service instance"""
    global _instance
    if _instance is None:
        _instance = LLMService()
    return _instance 