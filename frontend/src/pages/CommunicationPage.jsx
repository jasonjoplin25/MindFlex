import React, { useState, useEffect, useRef } from 'react';
import { scheduleAPI } from '../services/api';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  Card,
  CardContent,
  Tabs,
  Tab,
  TextField,
  IconButton,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  Slider,
  Alert,
  Chip,
  useTheme,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  ListItemIcon,
} from '@mui/material';
import {
  VolumeUp as VolumeUpIcon,
  Clear as ClearIcon,
  Emergency as EmergencyIcon,
  Settings as SettingsIcon,
  Schedule as ScheduleIcon,
  TouchApp as ChoiceIcon,
  SportsEsports as LearnIcon,
  RecordVoiceOver as CommunicateIcon,
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

// Default communication data
const defaultCommunicationData = {
  symbols: [
    { id: 's1', text: 'I want', emoji: '🙋', category: 'needs' },
    { id: 's2', text: 'food', emoji: '🍎', category: 'needs' },
    { id: 's3', text: 'drink', emoji: '🥤', category: 'needs' },
    { id: 's4', text: 'bathroom', emoji: '🚽', category: 'needs' },
    { id: 's5', text: 'happy', emoji: '😊', category: 'feelings' },
    { id: 's6', text: 'sad', emoji: '😢', category: 'feelings' },
    { id: 's7', text: 'angry', emoji: '😠', category: 'feelings' },
    { id: 's8', text: 'tired', emoji: '😴', category: 'feelings' },
    { id: 's9', text: 'play', emoji: '🎮', category: 'activities' },
    { id: 's10', text: 'sleep', emoji: '🛏️', category: 'activities' },
    { id: 's11', text: 'yes', emoji: '✅', category: 'basic' },
    { id: 's12', text: 'no', emoji: '❌', category: 'basic' },
    { id: 's13', text: 'help', emoji: '🆘', category: 'basic' },
    { id: 's14', text: 'more', emoji: '➕', category: 'basic' },
    { id: 's15', text: 'finished', emoji: '✔️', category: 'basic' },
    { id: 's16', text: 'mom', emoji: '👩', category: 'people' },
    { id: 's17', text: 'dad', emoji: '👨', category: 'people' },
    { id: 's18', text: 'friend', emoji: '👦', category: 'people' }
  ],
  quickPhrases: [
    { id: 'qp1', text: 'I need help', icon: '🆘' },
    { id: 'qp2', text: 'I love you', icon: '❤️' },
    { id: 'qp3', text: 'Thank you', icon: '🙏' },
    { id: 'qp4', text: "I'm hungry", icon: '🍽️' },
    { id: 'qp5', text: "I'm thirsty", icon: '💧' },
    { id: 'qp6', text: "I'm in pain", icon: '🤕' },
    { id: 'qp7', text: "I'm tired", icon: '😴' },
    { id: 'qp8', text: "I want to go outside", icon: '🚪' }
  ],
  scheduleItems: [
    { id: 'sch1', emoji: '🌅', text: 'Wake up', time: '7:00 AM', completed: false },
    { id: 'sch2', emoji: '🍳', text: 'Breakfast', time: '7:30 AM', completed: false },
    { id: 'sch3', emoji: '🚌', text: 'School', time: '8:30 AM', completed: false },
    { id: 'sch4', emoji: '🍕', text: 'Lunch', time: '12:00 PM', completed: false },
    { id: 'sch5', emoji: '🏠', text: 'Home', time: '3:00 PM', completed: false },
    { id: 'sch6', emoji: '🎮', text: 'Play time', time: '4:00 PM', completed: false },
    { id: 'sch7', emoji: '🍽️', text: 'Dinner', time: '6:00 PM', completed: false },
    { id: 'sch8', emoji: '🛁', text: 'Bath', time: '7:30 PM', completed: false },
    { id: 'sch9', emoji: '📚', text: 'Story time', time: '8:00 PM', completed: false },
    { id: 'sch10', emoji: '🛏️', text: 'Bedtime', time: '8:30 PM', completed: false }
  ],
  choices: [
    {
      id: 'ch1',
      question: 'What do you want to drink?',
      options: [
        { emoji: '🥛', text: 'Milk' },
        { emoji: '🧃', text: 'Juice' },
        { emoji: '💧', text: 'Water' }
      ]
    },
    {
      id: 'ch2',
      question: 'What do you want to eat?',
      options: [
        { emoji: '🍎', text: 'Apple' },
        { emoji: '🍌', text: 'Banana' },
        { emoji: '🍪', text: 'Cookie' }
      ]
    }
  ]
};

// Tab panel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`communication-tabpanel-${index}`}
      aria-labelledby={`communication-tab-${index}`}
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

const CommunicationPage = () => {
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState(0);
  const [message, setMessage] = useState('');
  const [symbolSize, setSymbolSize] = useState('medium');
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [language, setLanguage] = useState('en-US');
  const [scanningEnabled, setScanningEnabled] = useState(false);
  const [gamePoints, setGamePoints] = useState(0);
  const [data, setData] = useState(defaultCommunicationData);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState(null);
  const [predictions, setPredictions] = useState([]);
  
  // Dialog states
  const [addTaskDialog, setAddTaskDialog] = useState(false);
  const [editTaskDialog, setEditTaskDialog] = useState(false);
  const [taskMenuAnchor, setTaskMenuAnchor] = useState(null);
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(null);
  const [taskForm, setTaskForm] = useState({ emoji: '📝', text: '', time: '' });

  // Speech synthesis ref
  const speechSynthesis = useRef(window.speechSynthesis);

  // Game state
  const [activeGame, setActiveGame] = useState(null); // 'symbolMatch' or 'feelingsQuiz'
  const [symbolMatchCards, setSymbolMatchCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [moves, setMoves] = useState(0);
  const [feelingsQuizState, setFeelingsQuizState] = useState({
    currentQuestion: 0,
    score: 0,
    questions: [],
    selectedAnswer: null,
    showResult: false
  });


  // Load schedule items from backend and seed with defaults if empty
  const loadScheduleItems = async () => {
    setLoadingSchedule(true);
    setScheduleError(null);

    try {
      const response = await scheduleAPI.getScheduleItems();
      
      if (response.data.length === 0) {
        // Database is empty, seed with default items
        console.log('Seeding database with default schedule items...');
        const seedPromises = defaultCommunicationData.scheduleItems.map((item, index) => {
          const taskData = {
            emoji: item.emoji,
            text: item.text,
            time: item.time,
            order_index: index
          };
          return scheduleAPI.createScheduleItem(taskData);
        });
        
        await Promise.all(seedPromises);
        
        // Reload the data after seeding
        const newResponse = await scheduleAPI.getScheduleItems();
        setData(prev => ({ ...prev, scheduleItems: newResponse.data }));
      } else {
        // Database has items, use them
        setData(prev => ({ ...prev, scheduleItems: response.data }));
      }
    } catch (error) {
      console.error('Error loading schedule items:', error);
      setScheduleError('Failed to load schedule items');
      // Fallback to defaults in UI only
      setData(prev => ({ ...prev, scheduleItems: defaultCommunicationData.scheduleItems }));
    } finally {
      setLoadingSchedule(false);
    }
  };

  // Load schedule items on component mount
  useEffect(() => {
    loadScheduleItems();
  }, []);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Text-to-speech function
  const speakText = (text) => {
    if (speechSynthesis.current) {
      speechSynthesis.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = voiceSpeed;
      utterance.lang = language;
      speechSynthesis.current.speak(utterance);
    }
  };

  // Handle symbol click
  const handleSymbolClick = (symbol) => {
    const newMessage = message ? `${message} ${symbol.text}` : symbol.text;
    setMessage(newMessage);
    speakText(symbol.text);
    updatePredictions(newMessage);
  };

  // Handle quick phrase click
  const handleQuickPhrase = (phrase) => {
    setMessage(phrase.text);
    speakText(phrase.text);
  };

  // Clear message
  const clearMessage = () => {
    setMessage('');
    setPredictions([]);
  };

  // Speak message
  const speakMessage = () => {
    if (message.trim()) {
      speakText(message);
    }
  };

  // Emergency function
  const handleEmergency = () => {
    speakText('I need help right now!');
  };

  // Update word predictions
  const updatePredictions = (currentMessage) => {
    const words = currentMessage.toLowerCase().split(' ');
    const lastWord = words[words.length - 1];
    
    const commonWords = ['I', 'want', 'need', 'feel', 'like', 'have', 'go', 'see', 'can', 'help', 'please', 'thank', 'you'];
    
    const newPredictions = commonWords
      .filter(word => word.toLowerCase().startsWith(lastWord) && word.toLowerCase() !== lastWord)
      .slice(0, 5);
    
    setPredictions(newPredictions);
  };

  // Handle prediction click
  const handlePredictionClick = (word) => {
    const words = message.split(' ');
    words[words.length - 1] = word;
    const newMessage = words.join(' ') + ' ';
    setMessage(newMessage);
    updatePredictions(newMessage);
  };

  // Toggle schedule item
  const toggleScheduleItem = async (index) => {
    const item = data.scheduleItems[index];
    
    try {
      // Call backend first
      await scheduleAPI.toggleScheduleItem(item.id);
      
      // Update local state on success
      const newScheduleItems = [...data.scheduleItems];
      newScheduleItems[index].completed = !newScheduleItems[index].completed;
      
      if (newScheduleItems[index].completed) {
        setGamePoints(prev => prev + 10);
        speakText(`Great job! ${newScheduleItems[index].text} completed!`);
      }
      
      setData(prev => ({ ...prev, scheduleItems: newScheduleItems }));
    } catch (error) {
      console.error('Error toggling schedule item:', error);
      setScheduleError('Failed to update task');
    }
  };

  // Calculate schedule progress
  const scheduleProgress = () => {
    const completed = data.scheduleItems.filter(item => item.completed).length;
    return Math.round((completed / data.scheduleItems.length) * 100);
  };

  // Task management functions
  const handleAddTask = () => {
    setTaskForm({ emoji: '📝', text: '', time: '' });
    setAddTaskDialog(true);
  };

  const handleEditTask = (index) => {
    const task = data.scheduleItems[index];
    setTaskForm({ emoji: task.emoji, text: task.text, time: task.time });
    setSelectedTaskIndex(index);
    setEditTaskDialog(true);
    setTaskMenuAnchor(null);
  };

  const handleDeleteTask = async (index) => {
    const item = data.scheduleItems[index];
    
    try {
      // Call backend first
      await scheduleAPI.deleteScheduleItem(item.id);
      
      // Update local state on success
      const newScheduleItems = data.scheduleItems.filter((_, i) => i !== index);
      setData(prev => ({ ...prev, scheduleItems: newScheduleItems }));
      setTaskMenuAnchor(null);
    } catch (error) {
      console.error('Error deleting schedule item:', error);
      setScheduleError('Failed to delete task');
      setTaskMenuAnchor(null);
    }
  };

  const handleSaveTask = async (isEdit = false) => {
    if (!taskForm.text.trim() || !taskForm.time.trim()) {
      return; // Validation
    }

    const taskData = {
      emoji: taskForm.emoji,
      text: taskForm.text,
      time: taskForm.time,
      order_index: isEdit ? data.scheduleItems[selectedTaskIndex].order_index : data.scheduleItems.length
    };

    try {
      let response;
      
      if (isEdit) {
        // Update existing task
        const item = data.scheduleItems[selectedTaskIndex];
        response = await scheduleAPI.updateScheduleItem(item.id, taskData);
        
        // Update local state
        const newScheduleItems = [...data.scheduleItems];
        newScheduleItems[selectedTaskIndex] = response.data;
        setData(prev => ({ ...prev, scheduleItems: newScheduleItems }));
        setEditTaskDialog(false);
      } else {
        // Create new task
        response = await scheduleAPI.createScheduleItem(taskData);
        
        // Update local state
        const newScheduleItems = [...data.scheduleItems, response.data];
        setData(prev => ({ ...prev, scheduleItems: newScheduleItems }));
        setAddTaskDialog(false);
      }

      setTaskForm({ emoji: '📝', text: '', time: '' });
      setSelectedTaskIndex(null);
    } catch (error) {
      console.error('Error saving schedule item:', error);
      setScheduleError('Failed to save task');
    }
  };

  const handleTaskMenuClick = (event, index) => {
    event.stopPropagation();
    setTaskMenuAnchor(event.currentTarget);
    setSelectedTaskIndex(index);
  };

  // Symbol Match Game Functions
  const startSymbolMatchGame = () => {
    const gameSymbols = data.symbols.slice(0, 6); // Use first 6 symbols
    const cards = [...gameSymbols, ...gameSymbols]
      .sort(() => Math.random() - 0.5)
      .map((symbol, index) => ({
        id: index,
        symbol: symbol,
        isFlipped: false,
        isMatched: false,
      }));
    
    setSymbolMatchCards(cards);
    setMatchedPairs([]);
    setFlippedCards([]);
    setMoves(0);
    setGameStarted(true);
    setActiveGame('symbolMatch');
  };

  const handleCardClick = (cardId) => {
    if (flippedCards.length === 2) return;
    if (flippedCards.includes(cardId)) return;
    if (symbolMatchCards.find(card => card.id === cardId)?.isMatched) return;

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      setMoves(prev => prev + 1);
      const [firstId, secondId] = newFlippedCards;
      const firstCard = symbolMatchCards.find(card => card.id === firstId);
      const secondCard = symbolMatchCards.find(card => card.id === secondId);

      if (firstCard.symbol.id === secondCard.symbol.id) {
        // Match found
        setMatchedPairs(prev => [...prev, firstCard.symbol.id]);
        setSymbolMatchCards(prev => prev.map(card => 
          card.id === firstId || card.id === secondId 
            ? { ...card, isMatched: true }
            : card
        ));
        setFlippedCards([]);
        setGamePoints(prev => prev + 20);
        speakText(`Great! You matched ${firstCard.symbol.text}!`);

        // Check if game is complete
        if (matchedPairs.length + 1 === 6) {
          setTimeout(() => {
            setGamePoints(prev => prev + 50);
            speakText('Congratulations! You completed the symbol matching game!');
            setActiveGame(null);
            setGameStarted(false);
          }, 500);
        }
      } else {
        // No match
        setTimeout(() => {
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  // Feelings Quiz Game Functions
  const feelingsQuestions = [
    {
      emoji: '😊',
      question: 'How does this person feel?',
      options: ['Happy', 'Sad', 'Angry', 'Tired'],
      correct: 0
    },
    {
      emoji: '😢',
      question: 'What emotion is this?',
      options: ['Happy', 'Sad', 'Excited', 'Confused'],
      correct: 1
    },
    {
      emoji: '😠',
      question: 'This face shows:',
      options: ['Joy', 'Fear', 'Anger', 'Surprise'],
      correct: 2
    },
    {
      emoji: '😴',
      question: 'This person looks:',
      options: ['Hungry', 'Thirsty', 'Tired', 'Happy'],
      correct: 2
    },
    {
      emoji: '😲',
      question: 'What is this feeling?',
      options: ['Bored', 'Surprised', 'Angry', 'Sleepy'],
      correct: 1
    }
  ];

  const startFeelingsQuiz = () => {
    setFeelingsQuizState({
      currentQuestion: 0,
      score: 0,
      questions: feelingsQuestions,
      selectedAnswer: null,
      showResult: false
    });
    setActiveGame('feelingsQuiz');
  };

  const handleFeelingsAnswer = (answerIndex) => {
    const currentQ = feelingsQuizState.questions[feelingsQuizState.currentQuestion];
    const isCorrect = answerIndex === currentQ.correct;
    
    setFeelingsQuizState(prev => ({
      ...prev,
      selectedAnswer: answerIndex,
      showResult: true,
      score: isCorrect ? prev.score + 1 : prev.score
    }));

    if (isCorrect) {
      setGamePoints(prev => prev + 15);
      speakText('Correct! Well done!');
    } else {
      speakText(`Not quite. The correct answer is ${currentQ.options[currentQ.correct]}.`);
    }

    setTimeout(() => {
      if (feelingsQuizState.currentQuestion + 1 < feelingsQuizState.questions.length) {
        setFeelingsQuizState(prev => ({
          ...prev,
          currentQuestion: prev.currentQuestion + 1,
          selectedAnswer: null,
          showResult: false
        }));
      } else {
        // Quiz complete
        const finalScore = feelingsQuizState.score + (isCorrect ? 1 : 0);
        setGamePoints(prev => prev + 25);
        speakText(`Quiz complete! You got ${finalScore} out of ${feelingsQuizState.questions.length} correct!`);
        setTimeout(() => {
          setActiveGame(null);
        }, 2000);
      }
    }, 2000);
  };

  const exitGame = () => {
    setActiveGame(null);
    setGameStarted(false);
    setSymbolMatchCards([]);
    setMatchedPairs([]);
    setFlippedCards([]);
    setMoves(0);
    setFeelingsQuizState({
      currentQuestion: 0,
      score: 0,
      questions: [],
      selectedAnswer: null,
      showResult: false
    });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          background: theme.palette.mode === 'dark' 
            ? 'rgba(19, 47, 76, 0.4)' 
            : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          borderRadius: 3,
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                <CommunicateIcon fontSize="large" />
              </Avatar>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                AAC Communication Assistant
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Language</InputLabel>
                <Select value={language} onChange={(e) => setLanguage(e.target.value)} label="Language">
                  <MenuItem value="en-US">🇺🇸 English</MenuItem>
                  <MenuItem value="es-ES">🇪🇸 Español</MenuItem>
                  <MenuItem value="fr-FR">🇫🇷 Français</MenuItem>
                  <MenuItem value="de-DE">🇩🇪 Deutsch</MenuItem>
                </Select>
              </FormControl>
              
              <Button
                variant="contained"
                color="error"
                startIcon={<EmergencyIcon />}
                onClick={handleEmergency}
                sx={{ minWidth: 120 }}
              >
                HELP
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Navigation Tabs */}
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}
        >
          <Tab icon={<CommunicateIcon />} label="Communicate" />
          <Tab icon={<ScheduleIcon />} label="Schedule" />
          <Tab icon={<ChoiceIcon />} label="Choices" />
          <Tab icon={<LearnIcon />} label="Learn" />
          <Tab icon={<SettingsIcon />} label="Settings" />
        </Tabs>

        {/* Tab Content */}
        <TabPanel value={currentTab} index={0}>
          {/* Communicate Tab */}
          <Grid container spacing={3}>
            {/* Message Area */}
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">Message</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<ClearIcon />}
                        onClick={clearMessage}
                      >
                        Clear
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<VolumeUpIcon />}
                        onClick={speakMessage}
                        disabled={!message.trim()}
                      >
                        Speak
                      </Button>
                    </Box>
                  </Box>
                  
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      updatePredictions(e.target.value);
                    }}
                    placeholder="Tap symbols or type your message..."
                    sx={{ mb: 2 }}
                  />

                  {/* Word Predictions */}
                  {predictions.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {predictions.map((word, index) => (
                        <Chip
                          key={index}
                          label={word}
                          onClick={() => handlePredictionClick(word)}
                          clickable
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Quick Phrases */}
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                    Quick Phrases
                  </Typography>
                  <Grid container spacing={2}>
                    {data.quickPhrases.map((phrase) => (
                      <Grid item xs={12} sm={6} md={4} key={phrase.id}>
                        <Button
                          fullWidth
                          variant="contained"
                          color="success"
                          onClick={() => handleQuickPhrase(phrase)}
                          sx={{ 
                            p: 2, 
                            height: 80,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1
                          }}
                        >
                          <Typography variant="h4">{phrase.icon}</Typography>
                          <Typography variant="body2">{phrase.text}</Typography>
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Symbol Grid */}
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">
                      Communication Board
                    </Typography>
                    <FormControl size="small">
                      <InputLabel>Symbol Size</InputLabel>
                      <Select value={symbolSize} onChange={(e) => setSymbolSize(e.target.value)} label="Symbol Size">
                        <MenuItem value="small">Small</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="large">Large</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  
                  <Grid container spacing={2}>
                    {data.symbols.map((symbol) => (
                      <Grid item xs={6} sm={4} md={3} lg={2} key={symbol.id}>
                        <Button
                          fullWidth
                          variant="outlined"
                          onClick={() => handleSymbolClick(symbol)}
                          sx={{
                            height: symbolSize === 'large' ? 120 : symbolSize === 'medium' ? 100 : 80,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              transition: 'transform 0.2s ease'
                            }
                          }}
                        >
                          <Typography variant={symbolSize === 'large' ? 'h3' : symbolSize === 'medium' ? 'h4' : 'h5'}>
                            {symbol.emoji}
                          </Typography>
                          <Typography variant="caption" fontWeight="bold">
                            {symbol.text}
                          </Typography>
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          {/* Schedule Tab */}
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">Daily Schedule</Typography>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  onClick={handleAddTask}
                  disabled={loadingSchedule}
                >
                  Add Task
                </Button>
              </Box>

              {/* Error Alert */}
              {scheduleError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setScheduleError(null)}>
                  {scheduleError}
                </Alert>
              )}

              {/* Progress Bar */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Progress</Typography>
                  <Typography variant="body2">{scheduleProgress()}%</Typography>
                </Box>
                <Box sx={{ width: '100%', bgcolor: 'grey.300', borderRadius: 1, height: 8 }}>
                  <Box
                    sx={{
                      width: `${scheduleProgress()}%`,
                      bgcolor: 'success.main',
                      height: 8,
                      borderRadius: 1,
                      transition: 'width 0.5s ease'
                    }}
                  />
                </Box>
              </Box>

              {/* Schedule Items */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {loadingSchedule ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <Typography>Loading schedule...</Typography>
                  </Box>
                ) : data.scheduleItems.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <Typography color="text.secondary">No tasks yet. Click "Add Task" to create your first schedule item.</Typography>
                  </Box>
                ) : (
                  data.scheduleItems.map((item, index) => (
                  <Paper
                    key={item.id}
                    elevation={1}
                    sx={{
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      bgcolor: item.completed ? 'success.light' : 'background.paper',
                      opacity: item.completed ? 0.8 : 1,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateX(4px)'
                      }
                    }}
                  >
                    <Typography variant="h4">{item.emoji}</Typography>
                    <Box 
                      sx={{ flex: 1, cursor: 'pointer' }}
                      onClick={() => toggleScheduleItem(index)}
                    >
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          textDecoration: item.completed ? 'line-through' : 'none'
                        }}
                      >
                        {item.text}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.time}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography 
                        variant="h4" 
                        sx={{ cursor: 'pointer' }}
                        onClick={() => toggleScheduleItem(index)}
                      >
                        {item.completed ? '✅' : '⭕'}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => handleTaskMenuClick(e, index)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                  </Paper>
                  ))
                )}
              </Box>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          {/* Choices Tab */}
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
                Make a Choice
              </Typography>
              
              <Grid container spacing={3}>
                {data.choices.map((choice) => (
                  <Grid item xs={12} md={6} key={choice.id}>
                    <Paper elevation={2} sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                        {choice.question}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {choice.options.map((option, index) => (
                          <Button
                            key={index}
                            variant="outlined"
                            onClick={() => {
                              speakText(`I choose ${option.text}`);
                              // Could add choice logging here
                            }}
                            sx={{
                              p: 2,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              justifyContent: 'flex-start'
                            }}
                          >
                            <Typography variant="h4">{option.emoji}</Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {option.text}
                            </Typography>
                          </Button>
                        ))}
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={currentTab} index={3}>
          {/* Learn Tab */}
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
                Learning Games
              </Typography>

              {/* Points Display */}
              <Paper 
                elevation={3}
                sx={{ 
                  p: 3, 
                  mb: 3, 
                  background: 'linear-gradient(45deg, #7C4DFF 30%, #00E5FF 90%)',
                  color: 'white'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Total Points
                    </Typography>
                    <Typography variant="h3" fontWeight="bold">
                      {gamePoints}
                    </Typography>
                  </Box>
                  <Typography variant="h1">🏆</Typography>
                </Box>
              </Paper>

              {/* Game Cards */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper 
                    elevation={2} 
                    onClick={startSymbolMatchGame}
                    sx={{ 
                      p: 3, 
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        transition: 'transform 0.2s ease'
                      }
                    }}
                  >
                    <Typography variant="h1" sx={{ mb: 2 }}>🎯</Typography>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                      Symbol Match
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Match symbols to their meanings
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper 
                    elevation={2} 
                    onClick={startFeelingsQuiz}
                    sx={{ 
                      p: 3, 
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        transition: 'transform 0.2s ease'
                      }
                    }}
                  >
                    <Typography variant="h1" sx={{ mb: 2 }}>😊</Typography>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                      Feelings Quiz
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Identify different emotions
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Game Overlay */}
        {activeGame && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
            }}
          >
            <Paper
              sx={{
                p: 4,
                maxWidth: '90vw',
                maxHeight: '90vh',
                overflow: 'auto',
                position: 'relative',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">
                  {activeGame === 'symbolMatch' ? '🎯 Symbol Match' : '😊 Feelings Quiz'}
                </Typography>
                <Button
                  variant="outlined"
                  onClick={exitGame}
                  sx={{ minWidth: 100 }}
                >
                  Exit Game
                </Button>
              </Box>

              {activeGame === 'symbolMatch' && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h6">Moves: {moves}</Typography>
                    <Typography variant="h6">Matches: {matchedPairs.length}/6</Typography>
                  </Box>
                  <Grid container spacing={2} sx={{ maxWidth: 600, mx: 'auto' }}>
                    {symbolMatchCards.map((card) => (
                      <Grid item xs={4} key={card.id}>
                        <Paper
                          onClick={() => handleCardClick(card.id)}
                          sx={{
                            p: 2,
                            height: 120,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            backgroundColor: 
                              flippedCards.includes(card.id) || card.isMatched 
                                ? 'primary.light' 
                                : 'grey.300',
                            '&:hover': {
                              backgroundColor: 'primary.main',
                            },
                          }}
                        >
                          {(flippedCards.includes(card.id) || card.isMatched) ? (
                            <>
                              <Typography variant="h2">{card.symbol.emoji}</Typography>
                              <Typography variant="body2" textAlign="center">
                                {card.symbol.text}
                              </Typography>
                            </>
                          ) : (
                            <Typography variant="h2">❓</Typography>
                          )}
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {activeGame === 'feelingsQuiz' && (
                <Box sx={{ textAlign: 'center', maxWidth: 500, mx: 'auto' }}>
                  {feelingsQuizState.currentQuestion < feelingsQuizState.questions.length && feelingsQuizState.questions.length > 0 && (
                    <>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Question {feelingsQuizState.currentQuestion + 1} of {feelingsQuizState.questions.length}
                      </Typography>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        Score: {feelingsQuizState.score}
                      </Typography>
                      
                      <Typography 
                        sx={{ 
                          mb: 2, 
                          fontSize: '8rem', 
                          lineHeight: 1,
                          color: 'text.primary',
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                          textAlign: 'center',
                          display: 'block'
                        }}
                      >
                        {feelingsQuizState.questions[feelingsQuizState.currentQuestion].emoji}
                      </Typography>
                      
                      <Typography variant="h6" sx={{ mb: 3 }}>
                        {feelingsQuizState.questions[feelingsQuizState.currentQuestion].question}
                      </Typography>
                      
                      <Grid container spacing={2}>
                        {feelingsQuizState.questions[feelingsQuizState.currentQuestion].options.map((option, index) => (
                          <Grid item xs={6} key={index}>
                            <Button
                              variant={
                                feelingsQuizState.showResult
                                  ? feelingsQuizState.selectedAnswer === index
                                    ? index === feelingsQuizState.questions[feelingsQuizState.currentQuestion].correct
                                      ? 'contained'
                                      : 'outlined'
                                    : index === feelingsQuizState.questions[feelingsQuizState.currentQuestion].correct
                                      ? 'contained'
                                      : 'text'
                                  : 'outlined'
                              }
                              color={
                                feelingsQuizState.showResult
                                  ? index === feelingsQuizState.questions[feelingsQuizState.currentQuestion].correct
                                    ? 'success'
                                    : feelingsQuizState.selectedAnswer === index
                                      ? 'error'
                                      : 'primary'
                                  : 'primary'
                              }
                              fullWidth
                              onClick={() => handleFeelingsAnswer(index)}
                              disabled={feelingsQuizState.showResult}
                              sx={{ p: 2, fontSize: '1.1rem' }}
                            >
                              {option}
                            </Button>
                          </Grid>
                        ))}
                      </Grid>

                      {feelingsQuizState.showResult && (
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            mt: 2,
                            color: feelingsQuizState.selectedAnswer === feelingsQuizState.questions[feelingsQuizState.currentQuestion].correct ? 'success.main' : 'error.main'
                          }}
                        >
                          {feelingsQuizState.selectedAnswer === feelingsQuizState.questions[feelingsQuizState.currentQuestion].correct 
                            ? '✅ Correct!' 
                            : `❌ Correct answer: ${feelingsQuizState.questions[feelingsQuizState.currentQuestion].options[feelingsQuizState.questions[feelingsQuizState.currentQuestion].correct]}`
                          }
                        </Typography>
                      )}
                    </>
                  )}
                </Box>
              )}
            </Paper>
          </Box>
        )}

        <TabPanel value={currentTab} index={4}>
          {/* Settings Tab */}
          <Grid container spacing={3}>
            {/* Accessibility Settings */}
            <Grid item xs={12} md={6}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                    Accessibility Settings
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography>Switch Scanning Mode</Typography>
                      <Switch 
                        checked={scanningEnabled} 
                        onChange={(e) => setScanningEnabled(e.target.checked)} 
                      />
                    </Box>
                    
                    <Box>
                      <Typography gutterBottom>Voice Speed: {voiceSpeed}x</Typography>
                      <Slider
                        value={voiceSpeed}
                        onChange={(e, value) => setVoiceSpeed(value)}
                        min={0.5}
                        max={2}
                        step={0.1}
                        marks={[
                          { value: 0.5, label: '0.5x' },
                          { value: 1, label: '1x' },
                          { value: 2, label: '2x' }
                        ]}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Usage Statistics */}
            <Grid item xs={12} md={6}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                    Usage Statistics
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h4" fontWeight="bold" color="primary.main">
                          {gamePoints}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Points Earned
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h4" fontWeight="bold" color="success.main">
                          {data.scheduleItems.filter(item => item.completed).length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Tasks Completed
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

          </Grid>
        </TabPanel>
      </Paper>

      {/* Task Menu */}
      <Menu
        anchorEl={taskMenuAnchor}
        open={Boolean(taskMenuAnchor)}
        onClose={() => setTaskMenuAnchor(null)}
      >
        <MenuItem onClick={() => handleEditTask(selectedTaskIndex)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <Typography>Edit Task</Typography>
        </MenuItem>
        <MenuItem 
          onClick={() => handleDeleteTask(selectedTaskIndex)}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <Typography>Delete Task</Typography>
        </MenuItem>
      </Menu>

      {/* Add Task Dialog */}
      <Dialog open={addTaskDialog} onClose={() => setAddTaskDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Task</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Emoji"
              value={taskForm.emoji}
              onChange={(e) => setTaskForm(prev => ({ ...prev, emoji: e.target.value }))}
              placeholder="📝"
              inputProps={{ maxLength: 2 }}
            />
            <TextField
              label="Task Description"
              value={taskForm.text}
              onChange={(e) => setTaskForm(prev => ({ ...prev, text: e.target.value }))}
              placeholder="Enter task description..."
              required
            />
            <TextField
              label="Time"
              value={taskForm.time}
              onChange={(e) => setTaskForm(prev => ({ ...prev, time: e.target.value }))}
              placeholder="e.g., 9:00 AM"
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddTaskDialog(false)} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button 
            onClick={() => handleSaveTask(false)} 
            variant="contained" 
            startIcon={<SaveIcon />}
            disabled={!taskForm.text.trim() || !taskForm.time.trim()}
          >
            Add Task
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={editTaskDialog} onClose={() => setEditTaskDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Task</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Emoji"
              value={taskForm.emoji}
              onChange={(e) => setTaskForm(prev => ({ ...prev, emoji: e.target.value }))}
              inputProps={{ maxLength: 2 }}
            />
            <TextField
              label="Task Description"
              value={taskForm.text}
              onChange={(e) => setTaskForm(prev => ({ ...prev, text: e.target.value }))}
              required
            />
            <TextField
              label="Time"
              value={taskForm.time}
              onChange={(e) => setTaskForm(prev => ({ ...prev, time: e.target.value }))}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTaskDialog(false)} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button 
            onClick={() => handleSaveTask(true)} 
            variant="contained" 
            startIcon={<SaveIcon />}
            disabled={!taskForm.text.trim() || !taskForm.time.trim()}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CommunicationPage;