import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  TextField,
  Typography,
  IconButton,
  Chip,
  Tooltip,
  Alert,
  Stack
} from '@mui/material';
import { styled } from '@mui/material/styles';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import TimerIcon from '@mui/icons-material/Timer';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import llmApi from '../../services/llmService';
import { useLLM } from '../../contexts/LLMContext';

// Styled components
const MeditationCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
}));

const MeditationText = styled(Typography)(({ theme }) => ({
  whiteSpace: 'pre-wrap',
  lineHeight: 1.8,
  fontFamily: "'Georgia', serif",
  fontSize: '1.05rem',
}));

const GuidedMeditationGenerator = () => {
  const { activeProvider } = useLLM();
  
  // Form state
  const [duration, setDuration] = useState(10);
  const [focusArea, setFocusArea] = useState('relaxation');
  const [experienceLevel, setExperienceLevel] = useState('beginner');
  const [customFocus, setCustomFocus] = useState('');
  
  // Meditation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [meditation, setMeditation] = useState(null);
  const [error, setError] = useState(null);
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechSynthesis, setSpeechSynthesis] = useState(null);
  
  // Generate meditation
  const handleGenerateMeditation = async () => {
    setIsGenerating(true);
    setMeditation(null);
    setError(null);
    
    try {
      // Use the custom focus area if provided
      const focus = customFocus.trim() ? customFocus : focusArea;
      
      const response = await llmApi.generateMeditation(
        duration,
        focus,
        experienceLevel
      );
      
      setMeditation(response.meditation);
    } catch (error) {
      console.error('Error generating meditation:', error);
      setError('Failed to generate meditation. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Copy meditation text to clipboard
  const handleCopyText = () => {
    if (meditation) {
      navigator.clipboard.writeText(meditation);
      alert('Meditation text copied to clipboard');
    }
  };
  
  // Download meditation as text file
  const handleDownload = () => {
    if (meditation) {
      const filename = `guided_meditation_${focusArea}_${duration}min.txt`;
      const element = document.createElement('a');
      const file = new Blob([meditation], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = filename;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };
  
  // Play meditation audio using speech synthesis
  const handlePlayPause = () => {
    if (isPlaying) {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
    } else {
      if (!meditation) return;
      
      if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(meditation);
        utterance.rate = 0.9; // Slightly slower for meditation
        utterance.pitch = 0.9; // Slightly lower pitch
        utterance.onend = () => setIsPlaying(false);
        
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        setSpeechSynthesis(utterance);
        setIsPlaying(true);
      } else {
        alert('Speech synthesis is not supported in your browser.');
      }
    }
  };
  
  // Get focus areas based on current selection
  const getFocusAreas = () => {
    const commonAreas = [
      { value: 'relaxation', label: 'Relaxation' },
      { value: 'stress-relief', label: 'Stress Relief' },
      { value: 'mindfulness', label: 'Mindfulness' },
      { value: 'sleep', label: 'Sleep' },
      { value: 'anxiety', label: 'Anxiety Reduction' },
      { value: 'focus', label: 'Focus & Concentration' },
      { value: 'gratitude', label: 'Gratitude' },
      { value: 'compassion', label: 'Self-Compassion' },
      { value: 'energy', label: 'Energy & Vitality' },
      { value: 'custom', label: 'Custom Focus Area' }
    ];
    
    return commonAreas;
  };
  
  return (
    <Box sx={{ py: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <SelfImprovementIcon sx={{ mr: 1 }} /> Guided Meditation Generator
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Create personalized guided meditation scripts powered by {activeProvider === 'local' ? 'Ollama' : activeProvider}.
      </Typography>
      
      {/* Generator Settings */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel id="focus-area-label">Focus Area</InputLabel>
              <Select
                labelId="focus-area-label"
                value={focusArea}
                label="Focus Area"
                onChange={(e) => setFocusArea(e.target.value)}
              >
                {getFocusAreas().map((area) => (
                  <MenuItem key={area.value} value={area.value}>
                    {area.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {focusArea === 'custom' && (
              <TextField
                fullWidth
                label="Custom Focus Area"
                value={customFocus}
                onChange={(e) => setCustomFocus(e.target.value)}
                placeholder="Enter a specific focus area..."
                size="small"
                sx={{ mt: 2 }}
              />
            )}
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Box>
              <Typography id="duration-slider" gutterBottom>
                <TimerIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                Duration: {duration} minutes
              </Typography>
              <Slider
                value={duration}
                onChange={(e, newValue) => setDuration(newValue)}
                aria-labelledby="duration-slider"
                step={5}
                marks
                min={5}
                max={30}
                valueLabelDisplay="auto"
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel id="experience-level-label">Experience Level</InputLabel>
              <Select
                labelId="experience-level-label"
                value={experienceLevel}
                label="Experience Level"
                onChange={(e) => setExperienceLevel(e.target.value)}
              >
                <MenuItem value="beginner">Beginner</MenuItem>
                <MenuItem value="intermediate">Intermediate</MenuItem>
                <MenuItem value="advanced">Advanced</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              disabled={isGenerating}
              onClick={handleGenerateMeditation}
              startIcon={isGenerating ? <CircularProgress size={20} /> : <RefreshIcon />}
            >
              {isGenerating ? 'Generating...' : 'Generate Meditation Script'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Meditation Display */}
      {meditation && (
        <MeditationCard>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Stack direction="row" spacing={1}>
                <Chip 
                  icon={<TimerIcon />}
                  label={`${duration} minutes`}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
                <Chip 
                  icon={<FitnessCenterIcon />}
                  label={customFocus.trim() ? customFocus : focusArea}
                  color="secondary"
                  variant="outlined"
                  size="small"
                />
                <Chip 
                  label={experienceLevel}
                  variant="outlined"
                  size="small"
                />
              </Stack>
              
              <Box>
                <Tooltip title={isPlaying ? "Pause" : "Play"}>
                  <IconButton onClick={handlePlayPause} color="primary">
                    {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Copy to clipboard">
                  <IconButton onClick={handleCopyText}>
                    <ContentCopyIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download as text file">
                  <IconButton onClick={handleDownload}>
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            <MeditationText variant="body1">
              {meditation}
            </MeditationText>
          </CardContent>
        </MeditationCard>
      )}
      
      {/* Loading state */}
      {isGenerating && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Creating your personalized meditation script...
          </Typography>
        </Box>
      )}
      
      {/* Empty state */}
      {!meditation && !isGenerating && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <SelfImprovementIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="body1" color="text.secondary" paragraph>
            Choose your preferences and generate a guided meditation script.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default GuidedMeditationGenerator; 