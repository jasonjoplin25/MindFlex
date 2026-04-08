import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Grid,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Psychology as PsychologyIcon,
  Equalizer as EqualizerIcon,
  EmojiEvents as ChallengesIcon,
  MenuBook as NotesIcon,
  PictureAsPdf as PdfIcon,
  Notifications as ReminderIcon,
  Dashboard as DashboardIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { caregiverApi } from '../services/apiService';

// Import Patient Journey components
import CognitiveAssessment from '../components/assessment/CognitiveAssessment';
import PersonalizedTrainingPlan from '../components/training/PersonalizedTrainingPlan';
import DailyChallenges from '../components/challenges/DailyChallenges';
import PatientNotes from '../components/caregiver/PatientNotes';
import PatientReport from '../components/caregiver/PatientReport';
import ReminderSystem from '../components/caregiver/ReminderSystem';
import ReminderNotificationSystem from '../components/common/ReminderNotificationSystem';
import { checkForCompletion } from '../utils/gameNavigation';

const PatientJourneyPage = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // User role for access control
  const userRole = user?.user_type || 'patient';
  
  // State for tabs and drawer
  const [tabValue, setTabValue] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentJourneyStep, setCurrentJourneyStep] = useState(0);
  const [patientId, setPatientId] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [completionAlert, setCompletionAlert] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [error, setError] = useState(null);
  
  // Get patient ID from URL params or use first patient
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const urlPatientId = urlParams.get('patientId');
    
    if (urlPatientId) {
      setPatientId(urlPatientId);
    } else if (userRole === 'caregiver') {
      // If caregiver and no patient ID in URL, fetch the first patient
      fetchFirstPatient();
    } else {
      // For patients, use their own data
      fetchCurrentUserData();
    }
  }, [location.search, userRole]);

  // Fetch first patient for caregiver view
  const fetchFirstPatient = async () => {
    try {
      const response = await caregiverApi.getPatients();
      if (response.success && response.patients.length > 0) {
        setPatientId(response.patients[0].id);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      setError('Failed to load patient data');
    }
  };

  // Fetch current user data for patient view
  const fetchCurrentUserData = async () => {
    try {
      // For patient view, we would need patient-specific endpoints
      // For now, use mock data
      setPatientData({
        id: user?.id || 'current-user',
        name: user?.first_name ? `${user.first_name} ${user.last_name}` : 'Current User',
        age: 'Unknown',
        diagnosis: 'Cognitive Training',
        joinDate: new Date().toISOString().split('T')[0],
        lastActive: new Date().toISOString().split('T')[0],
        completedAssessment: false,
        hasTrainingPlan: false,
        lastChallengeDate: null,
        progressData: {
          memory: 0,
          attention: 0,
          processingSpeed: 0,
          reasoning: 0,
        },
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load user data');
    }
  };
  
  // Fetch patient data when patient ID changes
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        if (userRole === 'caregiver') {
          const response = await caregiverApi.getPatientDetails(patientId);
          
          if (response.success) {
            const patient = response.patient;
            setPatientData({
              id: patient.id,
              name: patient.name || `${patient.first_name} ${patient.last_name}`,
              age: patient.age || 'Unknown',
              diagnosis: patient.condition || 'Cognitive Training',
              joinDate: patient.created_at ? patient.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
              lastActive: patient.updated_at ? patient.updated_at.split('T')[0] : new Date().toISOString().split('T')[0],
              completedAssessment: (patient.game_history || []).length > 0,
              hasTrainingPlan: (patient.game_history || []).length > 0,
              lastChallengeDate: patient.game_history && patient.game_history.length > 0 
                ? patient.game_history[0].date || patient.game_history[0].created_at 
                : null,
              progressData: {
                memory: Math.floor(Math.random() * 40) + 60,
                attention: Math.floor(Math.random() * 40) + 60,
                processingSpeed: Math.floor(Math.random() * 40) + 50,
                reasoning: Math.floor(Math.random() * 40) + 60,
              },
            });
          } else {
            throw new Error(response.error || 'Failed to load patient details');
          }
        } else {
          // Patient view - use current user data
          await fetchCurrentUserData();
          return;
        }
      } catch (error) {
        console.error('Error fetching patient data:', error);
        setError('Failed to load patient data');
        setPatientData(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPatientData();
  }, [patientId, userRole]);

  // Check for completion when page loads
  useEffect(() => {
    const completion = checkForCompletion();
    if (completion) {
      if (completion.type === 'exercise') {
        setCompletionAlert({
          type: 'success',
          message: `Exercise "${completion.data.exercise.name}" completed! Score: ${completion.data.results.score}`,
          data: completion.data
        });
        // Trigger refresh of training plan
        setRefreshTrigger(prev => prev + 1);
      } else if (completion.type === 'challenge') {
        setCompletionAlert({
          type: 'success',
          message: `Challenge completed! You earned ${completion.data.challenge.xp} XP`,
          data: completion.data
        });
        // Trigger refresh of challenges
        setRefreshTrigger(prev => prev + 1);
      }
      
      // Clear alert after 5 seconds
      setTimeout(() => setCompletionAlert(null), 5000);
    }
  }, []);
  
  // Journey steps configuration
  const journeySteps = [
    {
      label: 'Cognitive Assessment',
      description: 'Establish baseline cognitive abilities through a comprehensive assessment',
      icon: <AssessmentIcon />,
      component: CognitiveAssessment,
      tabIndex: 0,
    },
    {
      label: 'Personalized Training Plan',
      description: 'Generate a tailored training plan based on assessment results',
      icon: <PsychologyIcon />,
      component: PersonalizedTrainingPlan,
      tabIndex: 1,
    },
    {
      label: 'Daily Challenges',
      description: 'Engage with daily cognitive challenges to maintain skills',
      icon: <ChallengesIcon />,
      component: DailyChallenges,
      tabIndex: 2,
    },
    {
      label: 'Caregiver Tools',
      description: 'Access tools for monitoring and supporting patient progress',
      icon: <EqualizerIcon />,
      subSteps: [
        {
          label: 'Patient Notes',
          icon: <NotesIcon />,
          component: PatientNotes,
          tabIndex: 3,
        },
        {
          label: 'Progress Reports',
          icon: <PdfIcon />,
          component: PatientReport,
          tabIndex: 4,
        },
        {
          label: 'Reminder System',
          icon: <ReminderIcon />,
          component: ReminderSystem,
          tabIndex: 5,
        },
      ],
    },
  ];
  
  // Define all possible tabs with access control
  const allTabs = [
    { label: 'Assessment', icon: <AssessmentIcon />, component: CognitiveAssessment, allowedRoles: ['patient'] },
    { label: 'Training Plan', icon: <PsychologyIcon />, component: PersonalizedTrainingPlan, allowedRoles: ['patient'] },
    { label: 'Daily Challenges', icon: <ChallengesIcon />, component: DailyChallenges, allowedRoles: ['patient'] },
    { label: 'Patient Notes', icon: <NotesIcon />, component: PatientNotes, allowedRoles: ['caregiver'] },
    { label: 'Progress Reports', icon: <PdfIcon />, component: PatientReport, allowedRoles: ['caregiver'] },
    { label: 'Reminder System', icon: <ReminderIcon />, component: ReminderSystem, allowedRoles: ['caregiver'] },
  ];
  
  // Filter tabs based on user role
  const tabs = allTabs.filter(tab => tab.allowedRoles.includes(userRole));
  
  // Get accessible tab indices
  const accessibleTabIndices = tabs.map((tab, index) => {
    const originalIndex = allTabs.findIndex(originalTab => originalTab.label === tab.label);
    return originalIndex;
  });
  
  // Handle tab change with role validation
  const handleTabChange = (event, newValue) => {
    // Map the filtered tab index back to original tab index
    const originalTabIndex = accessibleTabIndices[newValue];
    const selectedTab = allTabs[originalTabIndex];
    
    // Double-check role access
    if (selectedTab && selectedTab.allowedRoles.includes(userRole)) {
      setTabValue(newValue);
      setDrawerOpen(false);
    }
  };
  
  // Handle drawer toggle
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  // Navigate to journey step with role validation
  const navigateToStep = (stepIndex, originalTabIndex) => {
    const selectedTab = allTabs[originalTabIndex];
    
    // Check if user has access to this tab
    if (selectedTab && selectedTab.allowedRoles.includes(userRole)) {
      // Find the filtered tab index
      const filteredTabIndex = tabs.findIndex(tab => tab.label === selectedTab.label);
      if (filteredTabIndex !== -1) {
        setCurrentJourneyStep(stepIndex);
        setTabValue(filteredTabIndex);
        setDrawerOpen(false);
      }
    }
  };
  
  // Get current component based on tab value
  const CurrentComponent = tabs[tabValue]?.component;
  
  // Determine if this is a caregiver view
  const isCaregiverView = userRole === 'caregiver';
  
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Error Display */}
        {error && (
          <Box sx={{ mb: 3 }}>
            <Alert 
              severity="error" 
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          </Box>
        )}
        
        {/* Loading Display */}
        {loading && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            minHeight: '50vh'
          }}>
            <CircularProgress size={60} />
          </Box>
        )}
        
        {/* Mobile drawer for navigation */}
        {!loading && isSmallScreen && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">
                Patient Journey
              </Typography>
              <IconButton color="primary" onClick={handleDrawerToggle}>
                <MenuIcon />
              </IconButton>
            </Box>
            
            <Drawer
              anchor="right"
              open={drawerOpen}
              onClose={handleDrawerToggle}
            >
              <Box
                sx={{ width: 250 }}
                role="presentation"
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
                  <Typography variant="h6">Journey Steps</Typography>
                  <IconButton onClick={handleDrawerToggle}>
                    <CloseIcon />
                  </IconButton>
                </Box>
                <Divider />
                <List>
                  {journeySteps.map((step, index) => (
                    <React.Fragment key={`step-${index}`}>
                      {step.subSteps ? (
                        <>
                          <ListItem>
                            <ListItemIcon>
                              {step.icon}
                            </ListItemIcon>
                            <ListItemText primary={step.label} />
                          </ListItem>
                          <List component="div" disablePadding>
                            {step.subSteps.map((subStep, subIndex) => (
                              <ListItem 
                                key={`substep-${subIndex}`}
                                button 
                                onClick={() => navigateToStep(index, subStep.tabIndex)}
                                sx={{ 
                                  pl: 4,
                                  bgcolor: tabValue === subStep.tabIndex ? 'action.selected' : 'transparent',
                                }}
                              >
                                <ListItemIcon>
                                  {subStep.icon}
                                </ListItemIcon>
                                <ListItemText primary={subStep.label} />
                              </ListItem>
                            ))}
                          </List>
                        </>
                      ) : (
                        <ListItem 
                          button 
                          onClick={() => navigateToStep(index, step.tabIndex)}
                          sx={{ 
                            bgcolor: tabValue === step.tabIndex ? 'action.selected' : 'transparent',
                          }}
                        >
                          <ListItemIcon>
                            {step.icon}
                          </ListItemIcon>
                          <ListItemText primary={step.label} />
                        </ListItem>
                      )}
                    </React.Fragment>
                  ))}
                </List>
              </Box>
            </Drawer>
          </>
        )}
        
        <Grid container spacing={4}>
          {/* Left sidebar for desktop */}
          {!isSmallScreen && (
            <Grid item md={3} lg={2}>
              <Paper
                sx={{
                  p: 3,
                  background: theme => theme.palette.mode === 'dark'
                    ? 'rgba(19, 47, 76, 0.4)'
                    : 'rgba(255, 255, 255, 0.8)',
                  borderRadius: 2,
                  height: '100%',
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Patient Journey
                </Typography>
                
                <Stepper orientation="vertical" activeStep={currentJourneyStep} sx={{ mt: 3 }}>
                  {journeySteps.map((step, index) => (
                    <Step key={step.label}>
                      <StepLabel StepIconComponent={() => (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {index < currentJourneyStep ? (
                            <CheckIcon color="success" />
                          ) : (
                            step.icon
                          )}
                        </Box>
                      )}>
                        <Typography variant="subtitle2">{step.label}</Typography>
                      </StepLabel>
                      <StepContent>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {step.description}
                        </Typography>
                        
                        {step.subSteps && (
                          <List dense sx={{ ml: 1, mt: 1 }}>
                            {step.subSteps.map((subStep, subIndex) => (
                              <ListItem 
                                key={subStep.label}
                                button
                                dense
                                onClick={() => navigateToStep(index, subStep.tabIndex)}
                                sx={{ 
                                  borderRadius: 1,
                                  bgcolor: tabValue === subStep.tabIndex ? 'action.selected' : 'transparent',
                                }}
                              >
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                  {subStep.icon}
                                </ListItemIcon>
                                <ListItemText primary={subStep.label} />
                              </ListItem>
                            ))}
                          </List>
                        )}
                        
                        {!step.subSteps && (
                          <Button
                            variant={tabValue === step.tabIndex ? "contained" : "outlined"}
                            color="primary"
                            size="small"
                            onClick={() => navigateToStep(index, step.tabIndex)}
                            sx={{ mt: 1 }}
                          >
                            {tabValue === step.tabIndex ? 'Current Step' : 'Go to Step'}
                          </Button>
                        )}
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>
              </Paper>
            </Grid>
          )}
          
          {/* Main content area */}
          <Grid item xs={12} md={9} lg={10}>
            {/* Tabs for navigation */}
            <Paper 
              elevation={0}
              sx={{ 
                bgcolor: 'background.default',
                display: 'flex',
                justifyContent: 'center',
                mb: 3,
                borderRadius: 2,
                overflow: 'auto',
              }}
            >
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant={isSmallScreen ? "scrollable" : "fullWidth"}
                scrollButtons="auto"
                textColor="primary"
                indicatorColor="primary"
                sx={{ width: '100%' }}
              >
                {tabs.map((tab, index) => (
                  <Tab 
                    key={index}
                    label={!isSmallScreen ? tab.label : null}
                    icon={tab.icon}
                    iconPosition="start"
                    sx={{ 
                      minHeight: 48,
                      justifyContent: 'flex-start',
                      minWidth: isSmallScreen ? 'auto' : 120,
                    }}
                  />
                ))}
              </Tabs>
            </Paper>
            
            {/* Role indicator and patient info card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Alert 
                severity="info" 
                sx={{ mb: 3 }}
                icon={userRole === 'caregiver' ? <SecurityIcon /> : false}
              >
                {userRole === 'caregiver' 
                  ? 'You are viewing as a Caregiver. You have access to patient monitoring and management tools.'
                  : 'You are viewing as a Patient. You have access to assessments, training plans, and daily challenges.'
                }
              </Alert>
            </motion.div>
            
            {/* Patient info card (only if in caregiver view) */}
            {isCaregiverView && patientData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Paper 
                  sx={{ 
                    p: 2, 
                    mb: 3,
                    background: theme => theme.palette.mode === 'dark'
                      ? 'rgba(19, 47, 76, 0.2)'
                      : 'rgba(255, 255, 255, 0.6)',
                    borderRadius: 2,
                  }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ mr: 2 }}>
                          <Box
                            sx={{
                              width: 60,
                              height: 60,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 24,
                            }}
                          >
                            {patientData.name.charAt(0)}
                          </Box>
                        </Box>
                        <Box>
                          <Typography variant="h6">{patientData.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {patientData.age} years • {patientData.diagnosis}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            PATIENT SINCE
                          </Typography>
                          <Typography variant="body2">
                            {new Date(patientData.joinDate).toLocaleDateString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            LAST ACTIVE
                          </Typography>
                          <Typography variant="body2">
                            {new Date(patientData.lastActive).toLocaleDateString()}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </Paper>
              </motion.div>
            )}
            
            {/* Completion Alert */}
            {completionAlert && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Alert 
                  severity={completionAlert.type} 
                  sx={{ mb: 3 }}
                  onClose={() => setCompletionAlert(null)}
                >
                  {completionAlert.message}
                </Alert>
              </motion.div>
            )}

            {/* Content area */}
            <Paper
              sx={{
                p: 3,
                background: theme => theme.palette.mode === 'dark'
                  ? 'rgba(19, 47, 76, 0.4)'
                  : 'rgba(255, 255, 255, 0.8)',
                borderRadius: 2,
                minHeight: '70vh',
              }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                  <CircularProgress />
                </Box>
              ) : tabs.length > 0 ? (
                <CurrentComponent 
                  patient={patientData} 
                  refreshTrigger={refreshTrigger}
                  onExerciseComplete={(exercise, results) => {
                    setCompletionAlert({
                      type: 'success',
                      message: `Exercise "${exercise.name}" completed! Score: ${results.score}`,
                      data: { exercise, results }
                    });
                    setTimeout(() => setCompletionAlert(null), 5000);
                  }}
                />
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <SecurityIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h5" gutterBottom>
                    No Accessible Features
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    You don't have access to any features in the Patient Journey. 
                    Please contact your administrator to verify your account permissions.
                  </Typography>
                </Box>
              )}
            </Paper>
            
            {/* Navigation buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => handleTabChange(null, Math.max(0, tabValue - 1))}
                disabled={tabValue === 0}
              >
                Previous Step
              </Button>
              
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={() => handleTabChange(null, Math.min(tabs.length - 1, tabValue + 1))}
                disabled={tabValue === tabs.length - 1}
              >
                Next Step
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
      
      {/* Reminder Notification System */}
      {userRole === 'caregiver' && patientData && (
        <ReminderNotificationSystem patientId={patientData.id} />
      )}
    </Container>
  );
};

export default PatientJourneyPage; 