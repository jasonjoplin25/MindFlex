import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
  Alert,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import BuildIcon from '@mui/icons-material/Build';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import EventIcon from '@mui/icons-material/Event';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import llmApi from '../../services/llmService';
import { useLLM } from '../../contexts/LLMContext';

// Styled components
const AnalysisCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  '& .MuiSvgIcon-root': {
    marginRight: theme.spacing(1),
  },
}));

const PatientAnalyzer = ({ patientId, patientData }) => {
  const { activeProvider } = useLLM();
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  
  // Automatically analyze when patient data changes substantially
  useEffect(() => {
    if (patientData && patientData.game_history && patientData.game_history.length > 0) {
      handleAnalyzePatient();
    }
  }, [patientData?.game_history?.length]);
  
  // Analyze patient data
  const handleAnalyzePatient = async () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const response = await llmApi.analyzePatient(patientData);
      setAnalysis(response.analysis);
    } catch (error) {
      console.error('Error analyzing patient data:', error);
      setError('Failed to analyze patient data. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Fallback if no patient data is provided
  if (!patientData) {
    return (
      <Alert severity="warning" sx={{ mb: 3 }}>
        No patient data available for analysis.
      </Alert>
    );
  }
  
  return (
    <Box sx={{ py: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Patient Insights
        </Typography>
        <Box>
          <Chip 
            label={`AI: ${activeProvider === 'local' ? 'Ollama' : activeProvider}`} 
            color="primary" 
            size="small" 
            sx={{ mr: 1 }}
          />
          <Button
            variant="outlined"
            size="small"
            startIcon={isAnalyzing ? <CircularProgress size={16} /> : <AnalyticsIcon />}
            onClick={handleAnalyzePatient}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'Analyzing...' : 'Refresh Analysis'}
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {isAnalyzing && !analysis && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Analyzing patient data...
          </Typography>
        </Box>
      )}
      
      {analysis && (
        <Box>
          {/* Progress Summary */}
          <AnalysisCard>
            <CardContent sx={{ p: 3 }}>
              <SectionTitle variant="h6">
                <AssignmentIcon color="primary" /> Progress Summary
              </SectionTitle>
              <Typography variant="body1" paragraph>
                {analysis.progress_summary}
              </Typography>
            </CardContent>
          </AnalysisCard>
          
          {/* Cognitive Strengths & Areas for Improvement */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%', borderRadius: 2 }}>
                <SectionTitle variant="h6">
                  <FitnessCenterIcon color="success" /> Cognitive Strengths
                </SectionTitle>
                <List dense>
                  {analysis.cognitive_strengths.map((strength, index) => (
                    <ListItem key={index}>
                      <ListItemIcon sx={{ minWidth: '32px' }}>
                        <TrendingUpIcon color="success" />
                      </ListItemIcon>
                      <ListItemText primary={strength} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%', borderRadius: 2 }}>
                <SectionTitle variant="h6">
                  <BuildIcon color="warning" /> Areas for Improvement
                </SectionTitle>
                <List dense>
                  {analysis.improvement_areas.map((area, index) => (
                    <ListItem key={index}>
                      <ListItemIcon sx={{ minWidth: '32px' }}>
                        <TrendingDownIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText primary={area} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          </Grid>
          
          {/* Recommendations */}
          <AnalysisCard>
            <CardContent sx={{ p: 3 }}>
              <SectionTitle variant="h6">
                <TipsAndUpdatesIcon color="primary" /> Recommendations
              </SectionTitle>
              <List dense>
                {analysis.recommendations.map((recommendation, index) => (
                  <ListItem key={index}>
                    <ListItemIcon sx={{ minWidth: '32px' }}>
                      <AssignmentIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={recommendation} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </AnalysisCard>
          
          {/* Additional Insights (Accordion) */}
          <Accordion sx={{ mt: 3, borderRadius: 2, overflow: 'hidden', '&::before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" fontWeight={500}>
                Additional Insights
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                {/* Caregiver Tips */}
                {analysis.caregiver_tips && (
                  <Grid item xs={12} md={6}>
                    <SectionTitle variant="subtitle1">
                      <TipsAndUpdatesIcon fontSize="small" /> Caregiver Tips
                    </SectionTitle>
                    <List dense>
                      {analysis.caregiver_tips.map((tip, index) => (
                        <ListItem key={index} sx={{ pl: 0 }}>
                          <ListItemText primary={tip} />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                )}
                
                {/* Follow-up Actions */}
                {analysis.follow_up && (
                  <Grid item xs={12} md={6}>
                    <SectionTitle variant="subtitle1">
                      <EventIcon fontSize="small" /> Follow-up Actions
                    </SectionTitle>
                    <List dense>
                      {analysis.follow_up.map((action, index) => (
                        <ListItem key={index} sx={{ pl: 0 }}>
                          <ListItemText primary={action} />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                )}
                
                {/* Cognitive Pattern (if available) */}
                {analysis.cognitive_pattern && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <SectionTitle variant="subtitle1">
                      <AnalyticsIcon fontSize="small" /> Cognitive Pattern
                    </SectionTitle>
                    <Typography variant="body2" paragraph>
                      {analysis.cognitive_pattern}
                    </Typography>
                  </Grid>
                )}
                
                {/* Progress Projection (if available) */}
                {analysis.progress_projection && (
                  <Grid item xs={12}>
                    <SectionTitle variant="subtitle1">
                      <TrendingUpIcon fontSize="small" /> Progress Projection
                    </SectionTitle>
                    <Typography variant="body2">
                      {analysis.progress_projection}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
          
          {/* Analysis Timestamp */}
          <Box sx={{ mt: 3, textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">
              Analysis generated on {new Date().toLocaleString()}
            </Typography>
          </Box>
        </Box>
      )}
      
      {!analysis && !isAnalyzing && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary" paragraph>
            Click "Analyze Patient" to generate AI-powered insights.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAnalyzePatient}
            startIcon={<AnalyticsIcon />}
          >
            Analyze Patient
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default PatientAnalyzer; 