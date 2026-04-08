import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Avatar,
  Tooltip,
  Chip,
  Alert,
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as AIIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  DeleteOutline as ClearIcon,
  Share as ShareIcon,
  ContentCopy as CopyIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useLLM } from '../contexts/LLMContext';
import { useAuth } from '../contexts/AuthContext';
import { llmApi } from '../services/llmService';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

// Styled components
const ChatContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  height: 'calc(100vh - 180px)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}));

const MessageBubble = styled(Box)(({ theme, sender }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius * 2,
  marginBottom: theme.spacing(2),
  maxWidth: '80%',
  wordWrap: 'break-word',
  backgroundColor: sender === 'user' 
    ? theme.palette.primary.main 
    : theme.palette.mode === 'dark'
      ? theme.palette.grey[800]
      : theme.palette.grey[200],
  color: sender === 'user'
    ? theme.palette.primary.contrastText
    : theme.palette.text.primary,
  alignSelf: sender === 'user' ? 'flex-end' : 'flex-start',
}));

const MessageInput = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.shape.borderRadius * 5,
  }
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
  flexGrow: 1,
  padding: theme.spacing(2),
}));

const UserAvatar = styled(Avatar)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
}));

const AIAvatar = styled(Avatar)(({ theme }) => ({
  backgroundColor: theme.palette.secondary.main,
  color: theme.palette.secondary.contrastText,
}));

// Markdown content wrapper
const MarkdownWrapper = styled(Box)(({ theme }) => ({
  '& p': {
    margin: theme.spacing(1, 0),
  },
  '& code': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(0, 0, 0, 0.05)',
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.spacing(0.5),
    fontFamily: 'monospace',
  },
  '& pre': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(0, 0, 0, 0.05)',
    padding: theme.spacing(1),
    borderRadius: theme.spacing(1),
    overflow: 'auto',
  },
  '& pre code': {
    backgroundColor: 'transparent',
    padding: 0,
  },
  '& h1, & h2, & h3, & h4, & h5, & h6': {
    margin: theme.spacing(2, 0, 1),
  },
  '& ul, & ol': {
    marginLeft: theme.spacing(2),
  },
}));

// Thinking section wrapper
const ThinkingWrapper = styled(Box)(({ theme }) => ({
  backgroundColor: 'rgba(156, 39, 176, 0.1)',
  borderLeft: '4px solid #9c27b0',
  padding: theme.spacing(1, 2),
  borderRadius: theme.spacing(1),
  margin: theme.spacing(1, 0),
  '& p': {
    margin: theme.spacing(0.5, 0),
  }
}));

// Response section wrapper
const ResponseWrapper = styled(Box)(({ theme }) => ({
  backgroundColor: 'rgba(25, 118, 210, 0.05)',
  borderRadius: theme.spacing(1),
  padding: theme.spacing(1),
  margin: theme.spacing(1, 0),
}));

const ChatPage = () => {
  const { settings, activeProvider, isLoading } = useLLM();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  
  // Load chat history from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('mindflex_chat_history');
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error('Failed to parse saved chat history:', e);
      }
    } else {
      // Add a welcome message if no chat history exists
      setMessages([
        {
          role: 'system',
          content: `Welcome to MindFlex Chat! I'm your AI assistant, powered by ${activeProvider === 'local' ? 'Ollama' : activeProvider === 'openai' ? 'OpenAI' : 'Anthropic'}.
          
How can I help you today? You can ask me questions about:
- Cognitive exercises and brain training
- Memory improvement techniques
- Mindfulness and meditation
- General knowledge questions`
        }
      ]);
    }
  }, [activeProvider]);
  
  // Save messages to localStorage when they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('mindflex_chat_history', JSON.stringify(messages));
    }
  }, [messages]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Handle input change
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };
  
  // Handle input submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    // Add user message to chat
    const userMessage = { role: 'user', content: inputValue.trim() };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputValue('');
    setError(null);
    
    try {
      // Show typing indicator
      setIsTyping(true);
      
      // Get current model from settings
      const currentSettings = settings.providers[activeProvider];
      const modelId = currentSettings.defaultModel;
      
      // Prepare messages for API (exclude the welcome message)
      const apiMessages = messages
        .filter(msg => msg.role !== 'system' || messages.indexOf(msg) === 0)
        .concat([userMessage]);
      
      // Call LLM API
      const response = await llmApi.chat(apiMessages, modelId);
      
      // Add LLM response to chat
      setMessages(prevMessages => [
        ...prevMessages, 
        { role: 'assistant', content: response.response }
      ]);
    } catch (err) {
      console.error('Error sending message to LLM:', err);
      setError(`Failed to get a response: ${err.message}`);
    } finally {
      setIsTyping(false);
    }
  };
  
  // Clear chat history
  const handleClearChat = () => {
    // Keep only the welcome message
    setMessages([messages[0]]);
    localStorage.removeItem('mindflex_chat_history');
  };
  
  // Navigate to LLM settings
  const handleGoToSettings = () => {
    navigate('/settings/llm');
  };
  
  // Copy chat to clipboard
  const handleCopyChat = () => {
    const chatText = messages
      .map(msg => `${msg.role === 'user' ? 'You' : 'AI'}: ${msg.content}`)
      .join('\n\n');
    
    navigator.clipboard.writeText(chatText)
      .then(() => alert('Chat copied to clipboard!'))
      .catch(err => console.error('Failed to copy chat:', err));
  };
  
  // Add a helper function to parse responses with thinking sections
  const parseThinkingFromResponse = (text) => {
    if (!text || typeof text !== 'string') return { thinking: [], response: text };
    
    const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
    const thinkingMatches = [...text.matchAll(thinkRegex)];
    
    if (thinkingMatches.length === 0) {
      return { thinking: [], response: text };
    }

    // Extract all thinking sections
    const thinking = thinkingMatches.map(match => match[1].trim());
    
    // Remove thinking sections from the response
    let cleanResponse = text;
    thinkingMatches.forEach(match => {
      cleanResponse = cleanResponse.replace(match[0], '');
    });

    // Clean up any extra whitespace
    cleanResponse = cleanResponse.trim();
    
    return { thinking, response: cleanResponse };
  };
  
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4, marginTop: '64px' }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AIIcon sx={{ fontSize: 32, mr: 2, color: 'secondary.main' }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            Chat
          </Typography>
        </Box>
        
        <Box>
          <Chip
            label={`Using ${activeProvider === 'local' ? 'Ollama' : activeProvider === 'openai' ? 'OpenAI' : 'Anthropic'}`}
            color="secondary"
            variant="outlined"
            sx={{ mr: 1 }}
          />
          <Tooltip title="Copy chat">
            <IconButton onClick={handleCopyChat} sx={{ mr: 1 }}>
              <CopyIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Clear chat">
            <IconButton onClick={handleClearChat} sx={{ mr: 1 }}>
              <ClearIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="LLM Settings">
            <IconButton onClick={handleGoToSettings}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
      
      <ChatContainer elevation={3}>
        <MessagesContainer>
          {messages.map((message, index) => (
            message.role !== 'system' ? (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                  mb: 2,
                }}
              >
                {message.role === 'user' ? (
                  <UserAvatar>
                    <PersonIcon />
                  </UserAvatar>
                ) : (
                  <AIAvatar>
                    <AIIcon />
                  </AIAvatar>
                )}
                <MessageBubble sender={message.role} sx={{ mx: 2 }}>
                  {message.role === 'user' ? (
                    <Typography>{message.content}</Typography>
                  ) : (
                    <MarkdownWrapper>
                      {(() => {
                        const { thinking, response } = parseThinkingFromResponse(message.content);
                        return (
                          <>
                            {thinking.length > 0 && thinking.map((thought, i) => (
                              <ThinkingWrapper key={i}>
                                <Typography variant="caption" color="secondary" sx={{ display: 'block', fontWeight: 'bold', mb: 0.5 }}>
                                  Thinking Process:
                                </Typography>
                                <ReactMarkdown>
                                  {thought}
                                </ReactMarkdown>
                              </ThinkingWrapper>
                            ))}
                            {response && (
                              <ResponseWrapper>
                                <ReactMarkdown>
                                  {response}
                                </ReactMarkdown>
                              </ResponseWrapper>
                            )}
                          </>
                        );
                      })()}
                    </MarkdownWrapper>
                  )}
                </MessageBubble>
              </Box>
            ) : index === 0 ? (
              <Box key={index} sx={{ mb: 3, px: 2 }}>
                <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                  {message.content}
                </Typography>
                <Divider sx={{ my: 2 }} />
              </Box>
            ) : null
          ))}
          
          {isTyping && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                mb: 2,
              }}
            >
              <AIAvatar>
                <AIIcon />
              </AIAvatar>
              <MessageBubble sender="assistant" sx={{ mx: 2, display: 'flex', alignItems: 'center' }}>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                <Typography>Thinking...</Typography>
              </MessageBubble>
            </Box>
          )}
          
          <div ref={messagesEndRef} />
        </MessagesContainer>
        
        <Divider />
        
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 2, display: 'flex' }}>
          <MessageInput
            fullWidth
            variant="outlined"
            placeholder="Type a message..."
            value={inputValue}
            onChange={handleInputChange}
            multiline
            maxRows={4}
            disabled={isTyping}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ ml: 2, borderRadius: '50%', minWidth: '56px', height: '56px' }}
            disabled={!inputValue.trim() || isTyping}
          >
            <SendIcon />
          </Button>
        </Box>
      </ChatContainer>
    </Container>
  );
};

export default ChatPage; 