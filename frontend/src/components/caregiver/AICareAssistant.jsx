import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Chip,
  IconButton,
  Button,
  CircularProgress,
  Divider,
  Alert,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import { caregiverApi } from '../../services/apiService';
import { llmApi } from '../../services/llmService';
import { useAuth } from '../../contexts/AuthContext';

const ChatContainer = styled(Paper)(({ theme }) => ({
  height: '500px',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  overflow: 'hidden',
}));

const MessageList = styled(List)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
}));

const MessageInput = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
}));

const UserMessage = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-end',
  marginBottom: theme.spacing(1),
}));

const BotMessage = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-start',
  marginBottom: theme.spacing(1),
}));

const MessageBubble = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isUser',
})(({ theme, isUser }) => ({
  padding: theme.spacing(1.5),
  maxWidth: '80%',
  backgroundColor: isUser ? theme.palette.primary.main : theme.palette.grey[200],
  color: isUser ? theme.palette.primary.contrastText : '#000000',
  borderRadius: theme.spacing(2),
  wordWrap: 'break-word',
  '& .MuiTypography-root': {
    color: isUser ? theme.palette.primary.contrastText : '#000000',
  }
}));

const AICareAssistant = ({ patientId, patientData }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI Care Assistant. How can I help you today with caring for your patient?",
      sender: 'assistant',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [conversationTitle, setConversationTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: messages.length + 1,
      text: input.trim(),
      sender: 'user',
      timestamp: new Date().toISOString(),
    };
    
    setMessages([...messages, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    
    try {
      // Get patient context if available
      let patientContext = {};
      if (patientId) {
        try {
          patientContext = await caregiverApi.getPatientContext(patientId);
        } catch (contextError) {
          console.warn('Could not fetch patient context:', contextError);
          patientContext = {};
        }
      }

      // Prepare messages for AI model
      const conversationHistory = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      // Create system prompt with comprehensive patient context
      const systemPrompt = `You are an AI care assistant helping a caregiver manage their patient. You have access to comprehensive patient data and should provide helpful, accurate, and compassionate advice about patient care.

Patient Information:
${patientContext.context ? `
- Name: ${patientContext.context.patient_info?.name || 'Not specified'}
- Age: ${patientContext.context.patient_info?.age || 'Not specified'}
- Condition: ${patientContext.context.patient_info?.condition || 'Not specified'}
- Mobility Level: ${patientContext.context.patient_info?.mobility_level || 'Not specified'}
- Strengths: ${patientContext.context.patient_info?.strengths?.join(', ') || 'None listed'}
- Improvement Areas: ${patientContext.context.patient_info?.improvement_areas?.join(', ') || 'None listed'}
- Interests: ${patientContext.context.patient_info?.interests?.join(', ') || 'None listed'}

All Medications (${patientContext.context.all_medications?.length || 0} total):
${patientContext.context.all_medications?.map(med => 
  `- ${med.name} (${med.dosage}, ${med.frequency}) - Status: ${med.status}${med.prescriber ? ', Prescribed by: ' + med.prescriber : ''}`
).join('\n') || 'No medications listed'}

All Caregiver Notes (${patientContext.context.all_notes?.length || 0} total):
${patientContext.context.all_notes?.map(note => 
  `- ${note.date}: [${note.category}] ${note.content}`
).slice(0, 20).join('\n') || 'No notes available'}

All Appointments (${patientContext.context.all_appointments?.length || 0} total):
${patientContext.context.all_appointments?.map(apt => 
  `- ${apt.date}: ${apt.title} with ${apt.provider} (${apt.status})${apt.summary ? ' - Summary: ' + apt.summary : ''}`
).slice(0, 10).join('\n') || 'No appointments listed'}

Complete Game Activity:
${patientContext.context.complete_game_data ? `
- Total Sessions: ${patientContext.context.complete_game_data.total_sessions || 0}
- Games Played: ${patientContext.context.complete_game_data.games_played?.join(', ') || 'None'}
- Average Scores: ${Object.entries(patientContext.context.complete_game_data.average_scores || {}).map(([game, score]) => `${game}: ${score.toFixed(1)}`).join(', ') || 'None'}
- Progress Trends: ${Object.entries(patientContext.context.complete_game_data.progress_trends || {}).map(([game, trend]) => `${game} - Best: ${trend.best_score}, Sessions: ${trend.total_sessions}`).join('; ') || 'None'}
` : 'No game data available'}

All Mood Entries (${patientContext.context.all_mood_entries?.length || 0} total):
${patientContext.context.all_mood_entries?.map(mood => 
  `- ${mood.date}: Mood: ${mood.mood_rating}/10, Energy: ${mood.energy_level}/10, Anxiety: ${mood.anxiety_level}/10${mood.notes ? ' - Notes: ' + mood.notes : ''}`
).slice(0, 15).join('\n') || 'No mood data available'}

Daily Plans & Routines (${patientContext.context.daily_plans?.length || 0} total):
${patientContext.context.daily_plans?.map(plan => 
  `- ${plan.routine_type}: ${JSON.stringify(plan.activities)}`
).slice(0, 10).join('\n') || 'No routine data available'}
` : 'Patient context not available'}

Guidelines:
- You have access to ALL patient data - use it to provide specific, detailed advice
- Reference specific games, scores, medication history, notes, and appointments when relevant
- Analyze trends and patterns in the data to provide insights
- Consider the patient's complete history when making recommendations
- If asked about progress, provide specific data and trends
- If the question is medical in nature, remind the user to consult healthcare professionals
- Be compassionate and understanding while being data-driven
- Focus on practical caregiving tips based on the actual patient data`;

      // Make AI API call
      const aiMessages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: input.trim() }
      ];

      let aiResponse = "";
      
      try {
        const aiResult = await llmApi.chat(aiMessages);
        console.log('AI Result:', aiResult);
        // Handle different response structures from Ollama
        if (aiResult.response) {
          aiResponse = aiResult.response;
        } else if (aiResult.message?.content) {
          aiResponse = aiResult.message.content;
        } else if (aiResult.message) {
          aiResponse = aiResult.message;
        } else if (aiResult.content) {
          aiResponse = aiResult.content;
        } else {
          aiResponse = "I'm sorry, I couldn't generate a response at this time.";
        }
      } catch (aiError) {
        console.error('AI API error:', aiError);
        aiResponse = `I'm having trouble connecting to the AI service right now. However, I recommend consulting with the patient's healthcare provider for specific medical questions, maintaining consistent routines, and ensuring the patient's basic needs (nutrition, hydration, comfort) are met. For immediate concerns about the patient's health or safety, please contact a medical professional.`;
      }
      
      // Create assistant response message
      const assistantMessage = {
        id: messages.length + 2,
        text: aiResponse,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prevMessages => [...prevMessages, assistantMessage]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to get a response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const resetConversation = () => {
    setMessages([
      {
        id: 1,
        text: "Hello! I'm your AI Care Assistant. How can I help you today with caring for your patient?",
        sender: 'assistant',
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleOpenSaveDialog = () => {
    let defaultTitle = 'Conversation ';
    const userMessage = messages.find(msg => msg.sender === 'user');
    if (userMessage) {
      const firstWords = userMessage.text.split(' ').slice(0, 5).join(' ');
      defaultTitle += firstWords + '...';
    } else {
      defaultTitle += new Date().toLocaleString();
    }
    
    setConversationTitle(defaultTitle);
    setSaveDialogOpen(true);
  };
  
  const handleCloseSaveDialog = () => {
    setSaveDialogOpen(false);
  };
  
  const handleSaveConversation = async () => {
    setIsSaving(true);
    
    try {
      const conversationData = {
        caregiver_id: user.id,
        patient_id: patientId,
        title: conversationTitle || `Conversation ${new Date().toLocaleString()}`,
        messages: messages
      };
      
      const result = await caregiverApi.saveConversation(conversationData);
      
      if (result.success) {
        setSnackbarMessage('Conversation saved successfully!');
        setSnackbarOpen(true);
        setSaveDialogOpen(false);
      } else {
        setError('Failed to save conversation. Please try again.');
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
      setError('Failed to save conversation. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          AI Care Assistant
        </Typography>
        <Box>
          <IconButton onClick={resetConversation} title="New conversation">
            <RefreshIcon />
          </IconButton>
          <IconButton onClick={handleOpenSaveDialog} title="Save conversation">
            <SaveIcon />
          </IconButton>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PsychologyIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">
              AI-Powered Care Guidance
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Get personalized caregiving advice based on your patient's current condition, medications, and recent notes. 
            Ask questions about medication management, behavior strategies, activities, and daily care routines.
          </Typography>
        </CardContent>
      </Card>

      <ChatContainer>
        <MessageList>
          {messages.map((message) => (
            <ListItem key={message.id} sx={{ px: 0, py: 0.5 }}>
              {message.sender === 'user' ? (
                <UserMessage sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <MessageBubble isUser={true}>
                      <Typography variant="body2">{message.text}</Typography>
                    </MessageBubble>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      <PersonIcon />
                    </Avatar>
                  </Box>
                </UserMessage>
              ) : (
                <BotMessage sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                      <BotIcon />
                    </Avatar>
                    <MessageBubble isUser={false}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {message.text}
                      </Typography>
                    </MessageBubble>
                  </Box>
                </BotMessage>
              )}
            </ListItem>
          ))}
          {isLoading && (
            <ListItem sx={{ px: 0, py: 0.5 }}>
              <BotMessage sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                    <BotIcon />
                  </Avatar>
                  <Paper sx={{ p: 2, borderRadius: 2 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" sx={{ ml: 1, display: 'inline' }}>
                      Thinking...
                    </Typography>
                  </Paper>
                </Box>
              </BotMessage>
            </ListItem>
          )}
          <div ref={messagesEndRef} />
        </MessageList>

        <Divider />

        <MessageInput>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Ask me anything about caring for your patient..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              variant="outlined"
              size="small"
            />
            <IconButton 
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              sx={{ 
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
                '&:disabled': { 
                  bgcolor: 'grey.300',
                  color: 'grey.500'
                },
                '& .MuiSvgIcon-root': {
                  color: 'white'
                }
              }}
            >
              <SendIcon sx={{ color: 'white' }} />
            </IconButton>
          </Box>
        </MessageInput>
      </ChatContainer>

      {/* Save Conversation Dialog */}
      <Dialog open={saveDialogOpen} onClose={handleCloseSaveDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Save Conversation</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Conversation Title"
            value={conversationTitle}
            onChange={(e) => setConversationTitle(e.target.value)}
            margin="normal"
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSaveDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveConversation} 
            variant="contained"
            disabled={isSaving}
          >
            {isSaving ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for success/error messages */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default AICareAssistant;