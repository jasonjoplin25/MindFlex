import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
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
  CircularProgress,
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
import RefreshIcon from '@mui/icons-material/Refresh';
import { caregiverApi } from '../../services/apiService';

// Styled components
const InsightCard = styled(Card)(({ theme }) => ({
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

const PatientInsights = ({ patientId, patientData, recommendations, loadingRecommendations }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  
  // Analyze patient data
  const handleAnalyzePatient = async () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const response = await caregiverApi.analyzePatient(patientId);
      
      if (response.success) {
        setAnalysis(response.analysis);
      } else {
        setError(response.error || 'Failed to analyze patient data. Please try again.');
      }
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
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Patient Insights & Analysis
        </Typography>
        <Button
          variant="outlined"
          startIcon={isAnalyzing ? <CircularProgress size={16} /> : <AnalyticsIcon />}
          onClick={handleAnalyzePatient}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Patient Data'}
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Patient Analysis Section */}
        <Grid item xs={12} md={6}>
          {isAnalyzing && !analysis ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
              <CircularProgress size={40} sx={{ mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Analyzing patient data...
              </Typography>
            </Box>
          ) : analysis ? (
            <>
              {/* Progress Summary */}
              <InsightCard>
                <CardContent sx={{ p: 3 }}>
                  <SectionTitle variant="h6">
                    <AssignmentIcon color="primary" /> Progress Summary
                  </SectionTitle>
                  <Typography variant="body1" paragraph>
                    {analysis.progress_summary}
                  </Typography>
                </CardContent>
              </InsightCard>
              
              {/* Cognitive Strengths & Areas for Improvement */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, height: '100%', borderRadius: 2 }}>
                    <SectionTitle variant="subtitle1">
                      <FitnessCenterIcon color="success" /> Cognitive Strengths
                    </SectionTitle>
                    <List dense>
                      {(analysis.cognitive_strengths || []).map((strength, index) => (
                        <ListItem key={index}>
                          <ListItemIcon sx={{ minWidth: '32px' }}>
                            <TrendingUpIcon color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={strength} />
                        </ListItem>
                      ))}
                      {(!analysis.cognitive_strengths || analysis.cognitive_strengths.length === 0) && (
                        <ListItem>
                          <ListItemText primary="No strengths identified yet" />
                        </ListItem>
                      )}
                    </List>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, height: '100%', borderRadius: 2 }}>
                    <SectionTitle variant="subtitle1">
                      <BuildIcon color="warning" /> Areas for Improvement
                    </SectionTitle>
                    <List dense>
                      {(analysis.improvement_areas || []).map((area, index) => (
                        <ListItem key={index}>
                          <ListItemIcon sx={{ minWidth: '32px' }}>
                            <TrendingDownIcon color="warning" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={area} />
                        </ListItem>
                      ))}
                      {(!analysis.improvement_areas || analysis.improvement_areas.length === 0) && (
                        <ListItem>
                          <ListItemText primary="No improvement areas identified" />
                        </ListItem>
                      )}
                    </List>
                  </Paper>
                </Grid>
              </Grid>
              
              {/* Recommendations */}
              <InsightCard>
                <CardContent sx={{ p: 3 }}>
                  <SectionTitle variant="h6">
                    <TipsAndUpdatesIcon color="primary" /> Recommendations
                  </SectionTitle>
                  <List dense>
                    {(analysis.recommendations || []).map((recommendation, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={recommendation} />
                      </ListItem>
                    ))}
                    {(!analysis.recommendations || analysis.recommendations.length === 0) && (
                      <ListItem>
                        <ListItemText primary="No recommendations available" />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </InsightCard>
              
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
                          {(analysis.caregiver_tips || []).map((tip, index) => (
                            <ListItem key={index} sx={{ pl: 0 }}>
                              <ListItemText primary={tip} />
                            </ListItem>
                          ))}
                          {(!analysis.caregiver_tips || analysis.caregiver_tips.length === 0) && (
                            <ListItem sx={{ pl: 0 }}>
                              <ListItemText primary="No caregiver tips available" />
                            </ListItem>
                          )}
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
                          {(analysis.follow_up || []).map((action, index) => (
                            <ListItem key={index} sx={{ pl: 0 }}>
                              <ListItemText primary={action} />
                            </ListItem>
                          ))}
                          {(!analysis.follow_up || analysis.follow_up.length === 0) && (
                            <ListItem sx={{ pl: 0 }}>
                              <ListItemText primary="No follow-up actions specified" />
                            </ListItem>
                          )}
                        </List>
                      </Grid>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center', background: 'rgba(0,0,0,0.02)', borderRadius: 2 }}>
              <Typography variant="body1" color="text.secondary" paragraph>
                Click "Analyze Patient Data" to get AI-powered insights about this patient's cognitive health.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AnalyticsIcon />}
                onClick={handleAnalyzePatient}
              >
                Analyze Now
              </Button>
            </Box>
          )}
        </Grid>
        
        {/* Recommendations Section */}
        <Grid item xs={12} md={6}>
          <InsightCard>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <SectionTitle variant="h6" sx={{ mb: 0 }}>
                  <TipsAndUpdatesIcon color="primary" /> Care Recommendations
                </SectionTitle>
                <Chip 
                  label="AI Generated"
                  color="secondary" 
                  size="small"
                />
              </Box>
              
              {loadingRecommendations ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={30} />
                </Box>
              ) : recommendations ? (
                <Typography 
                  variant="body2" 
                  component="div" 
                  sx={{ 
                    whiteSpace: 'pre-line',
                    '& ul': { pl: 2 },
                    '& li': { mb: 0.5 },
                  }}
                >
                  {recommendations}
                </Typography>
              ) : (
                <Alert severity="info">
                  No recommendations available. Click "Analyze Patient Data" to generate recommendations.
                </Alert>
              )}
            </CardContent>
          </InsightCard>
          
          {/* Patient Details Summary */}
          <InsightCard>
            <CardContent sx={{ p: 3 }}>
              <SectionTitle variant="h6">
                <AssignmentIcon color="primary" /> Patient Summary
              </SectionTitle>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                  <Typography variant="body1" gutterBottom>
                    {patientData.first_name} {patientData.last_name}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Age</Typography>
                  <Typography variant="body1" gutterBottom>{patientData.age}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Condition</Typography>
                  <Typography variant="body1" gutterBottom>{patientData.condition}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Mobility</Typography>
                  <Typography variant="body1" gutterBottom>{patientData.mobility}</Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Interests</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {(patientData.interests || []).map((interest, index) => (
                      <Chip key={index} label={interest} size="small" />
                    ))}
                    {(!patientData.interests || patientData.interests.length === 0) && (
                      <Typography variant="body2" color="text.secondary">No interests specified</Typography>
                    )}
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Current Medications</Typography>
                  <List dense>
                    {(patientData.medications || []).slice(0, 3).map((med, index) => (
                      <ListItem key={index} disableGutters>
                        <ListItemText 
                          primary={med.name || 'Unknown medication'} 
                          secondary={`${med.dosage || 'Unknown dosage'}, ${med.frequency || 'Unknown frequency'}`}
                        />
                      </ListItem>
                    ))}
                    {(patientData.medications || []).length > 3 && (
                      <ListItem disableGutters>
                        <ListItemText 
                          primary={`+ ${(patientData.medications || []).length - 3} more medications`}
                          primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        />
                      </ListItem>
                    )}
                    {(!patientData.medications || patientData.medications.length === 0) && (
                      <ListItem disableGutters>
                        <ListItemText 
                          primary="No medications recorded"
                          primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        />
                      </ListItem>
                    )}
                  </List>
                </Grid>
              </Grid>
            </CardContent>
          </InsightCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PatientInsights; 