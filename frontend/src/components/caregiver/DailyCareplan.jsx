import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  TextField,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Paper,
  Chip,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  WbSunny as MorningIcon,
  SelfImprovement as ExerciseIcon,
  DirectionsWalk as ActivityIcon,
  Restaurant as MealIcon,
  HealthAndSafety as TherapyIcon,
  People as SocialIcon,
  Nightlight as EveningIcon,
  AccessTime as BreakIcon,
  DateRange as CalendarIcon,
  Refresh as RefreshIcon,
  Print as PrintIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { caregiverApi } from '../../services/apiService';
import { format } from 'date-fns';
import RoutineManager from './RoutineManager';
import CognitiveExerciseManager from './CognitiveExerciseManager';
import PhysicalActivityManager from './PhysicalActivityManager';
import MealsNutritionManager from './MealsNutritionManager';
import TherapySessionManager from './TherapySessionManager';
import SocialEngagementManager from './SocialEngagementManager';
import CaregiverSelfCareManager from './CaregiverSelfCareManager';

const PlanCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
    transform: 'translateY(-2px)',
  },
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

const DailyCareplan = ({ patientId, patientData }) => {
  const [date, setDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);
  const [caregiverConstraints, setCaregiverConstraints] = useState({
    available_time: 'full-day',
    support_network: 'moderate',
    considerations: ''
  });
  const [savedPlans, setSavedPlans] = useState([]);
  const [showConstraintsDialog, setShowConstraintsDialog] = useState(false);
  const [showRoutineManager, setShowRoutineManager] = useState(false);
  const [activeRoutineType, setActiveRoutineType] = useState(null);
  const [savedRoutines, setSavedRoutines] = useState({
    morning: [],
    evening: []
  });
  const [showCognitiveExerciseManager, setShowCognitiveExerciseManager] = useState(false);
  const [savedCognitiveExercises, setSavedCognitiveExercises] = useState([]);
  const [showPhysicalActivityManager, setShowPhysicalActivityManager] = useState(false);
  const [savedPhysicalActivities, setSavedPhysicalActivities] = useState([]);
  const [showMealsNutritionManager, setShowMealsNutritionManager] = useState(false);
  const [savedMeals, setSavedMeals] = useState([]);
  const [showTherapySessionManager, setShowTherapySessionManager] = useState(false);
  const [savedTherapySessions, setSavedTherapySessions] = useState([]);
  const [showSocialEngagementManager, setShowSocialEngagementManager] = useState(false);
  const [savedSocialActivities, setSavedSocialActivities] = useState([]);
  const [showCaregiverSelfCareManager, setShowCaregiverSelfCareManager] = useState(false);
  const [savedSelfCareActivities, setSavedSelfCareActivities] = useState([]);

  const fetchDailyPlan = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await caregiverApi.generateDailyPlan(patientId, {
        ...caregiverConstraints,
        date: format(date, 'yyyy-MM-dd')
      });
      
      if (response.success) {
        setPlan(response.plan);
      } else {
        setError(response.error || 'Failed to generate care plan. Please try again.');
      }
    } catch (error) {
      console.error('Error generating daily care plan:', error);
      setError('Failed to generate care plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    fetchDailyPlan();
  };

  const handleSavePlan = () => {
    if (!plan) return;
    
    const savedPlan = {
      id: Date.now(),
      date: format(date, 'yyyy-MM-dd'),
      plan: plan,
      patientId: patientId
    };
    
    setSavedPlans([...savedPlans, savedPlan]);
  };

  const handlePrintPlan = () => {
    window.print();
  };

  const handleConstraintsSubmit = () => {
    setShowConstraintsDialog(false);
    fetchDailyPlan();
  };

  const handleRoutineClick = (routineType) => {
    setActiveRoutineType(routineType);
    setShowRoutineManager(true);
  };

  const handleRoutineSave = async (activities) => {
    // Update the saved routines state immediately
    setSavedRoutines(prev => ({
      ...prev,
      [activeRoutineType]: activities
    }));

    // Also update the plan with the new routine activities for display consistency
    if (plan) {
      const updatedPlan = {
        ...plan,
        [activeRoutineType === 'morning' ? 'morning_routine' : 'evening_routine']: 
          activities.map(activity => `${activity.scheduled_time} - ${activity.name}`)
      };
      setPlan(updatedPlan);
    }

    // Reload saved routines to ensure we have the latest completion status
    setTimeout(() => {
      loadSavedRoutines();
    }, 500); // Small delay to ensure save is completed
  };

  const loadSavedRoutines = async () => {
    if (!patientId) return;
    
    try {
      // Load both morning and evening routines
      const morningResponse = await caregiverApi.getPatientRoutines(patientId, 'morning');
      const eveningResponse = await caregiverApi.getPatientRoutines(patientId, 'evening');
      
      setSavedRoutines({
        morning: morningResponse.success ? morningResponse.routines : [],
        evening: eveningResponse.success ? eveningResponse.routines : []
      });
    } catch (error) {
      console.error('Error loading saved routines:', error);
    }
  };

  const loadSavedCognitiveExercises = async () => {
    if (!patientId) return;
    
    try {
      const response = await caregiverApi.getPatientRoutines(patientId, 'cognitive');
      setSavedCognitiveExercises(response.success ? response.routines : []);
    } catch (error) {
      console.error('Error loading saved cognitive exercises:', error);
    }
  };

  const handleCognitiveExercisesSave = async (exercises) => {
    setSavedCognitiveExercises(exercises);
    // Reload cognitive exercises to ensure we have the latest completion status
    setTimeout(() => {
      loadSavedCognitiveExercises();
    }, 500);
  };

  const loadSavedPhysicalActivities = async () => {
    if (!patientId) return;
    
    try {
      const response = await caregiverApi.getPatientRoutines(patientId, 'physical_activities');
      setSavedPhysicalActivities(response.success ? response.routines : []);
    } catch (error) {
      console.error('Error loading saved physical activities:', error);
    }
  };

  const handlePhysicalActivitiesSave = async (activities) => {
    setSavedPhysicalActivities(activities);
    // Reload physical activities to ensure we have the latest completion status
    setTimeout(() => {
      loadSavedPhysicalActivities();
    }, 500);
  };

  const loadSavedMeals = async () => {
    if (!patientId) return;
    
    try {
      const response = await caregiverApi.getPatientRoutines(patientId, 'meals_nutrition');
      setSavedMeals(response.success ? response.routines : []);
    } catch (error) {
      console.error('Error loading saved meals:', error);
    }
  };

  const handleMealsSave = async (meals) => {
    setSavedMeals(meals);
    // Reload meals to ensure we have the latest completion status
    setTimeout(() => {
      loadSavedMeals();
    }, 500);
  };

  const loadSavedTherapySessions = async () => {
    if (!patientId) return;
    
    try {
      const response = await caregiverApi.getPatientRoutines(patientId, 'therapy_sessions');
      setSavedTherapySessions(response.success ? response.routines : []);
    } catch (error) {
      console.error('Error loading saved therapy sessions:', error);
    }
  };

  const handleTherapySessionsSave = async (sessions) => {
    setSavedTherapySessions(sessions);
    // Reload therapy sessions to ensure we have the latest completion status
    setTimeout(() => {
      loadSavedTherapySessions();
    }, 500);
  };

  const loadSavedSocialActivities = async () => {
    if (!patientId) return;
    
    try {
      const response = await caregiverApi.getPatientRoutines(patientId, 'social_engagement');
      setSavedSocialActivities(response.success ? response.routines : []);
    } catch (error) {
      console.error('Error loading saved social activities:', error);
    }
  };

  const handleSocialActivitiesSave = async (activities) => {
    setSavedSocialActivities(activities);
    // Reload social activities to ensure we have the latest completion status
    setTimeout(() => {
      loadSavedSocialActivities();
    }, 500);
  };

  const loadSavedSelfCareActivities = async () => {
    if (!patientId) return;
    
    try {
      const response = await caregiverApi.getPatientRoutines(patientId, 'caregiver_self_care');
      setSavedSelfCareActivities(response.success ? response.routines : []);
    } catch (error) {
      console.error('Error loading saved self-care activities:', error);
    }
  };

  const handleSelfCareActivitiesSave = async (activities) => {
    setSavedSelfCareActivities(activities);
    // Reload self-care activities to ensure we have the latest completion status
    setTimeout(() => {
      loadSavedSelfCareActivities();
    }, 500);
  };

  const getRoutineActivities = (routineType) => {
    // Prioritize saved routines over AI-generated plan
    const savedActivities = savedRoutines[routineType] || [];
    if (savedActivities.length > 0) {
      return savedActivities.map(activity => {
        const completionIcon = activity.completion_status === 'completed' ? '✅ ' : '⏸️ ';
        return `${completionIcon}${activity.scheduled_time} - ${activity.name}`;
      });
    }
    
    // Fall back to AI-generated plan if no saved routines
    return plan?.[routineType === 'morning' ? 'morning_routine' : 'evening_routine'] || [];
  };

  const getRoutineProgress = (routineType) => {
    const savedActivities = savedRoutines[routineType] || [];
    if (savedActivities.length === 0) return null;
    
    const completed = savedActivities.filter(activity => activity.completion_status === 'completed').length;
    const total = savedActivities.length;
    const percentage = Math.round((completed / total) * 100);
    
    return { completed, total, percentage };
  };

  const getCognitiveExerciseActivities = () => {
    // Prioritize saved exercises over AI-generated plan
    if (savedCognitiveExercises.length > 0) {
      return savedCognitiveExercises.map(exercise => {
        const completionIcon = exercise.completion_status === 'completed' ? '✅ ' : '⏸️ ';
        return `${completionIcon}${exercise.scheduled_time} - ${exercise.name} (${exercise.difficulty})`;
      });
    }
    
    // Fall back to AI-generated plan if no saved exercises
    return plan?.cognitive_exercises || [];
  };

  const getCognitiveExerciseProgress = () => {
    if (savedCognitiveExercises.length === 0) return null;
    
    const completed = savedCognitiveExercises.filter(exercise => exercise.completion_status === 'completed').length;
    const total = savedCognitiveExercises.length;
    const percentage = Math.round((completed / total) * 100);
    
    return { completed, total, percentage };
  };

  const getPhysicalActivities = () => {
    // Prioritize saved activities over AI-generated plan
    if (savedPhysicalActivities.length > 0) {
      return savedPhysicalActivities.map(activity => {
        const completionIcon = activity.completion_status === 'completed' ? '✅ ' : '⏸️ ';
        const intensityIcon = activity.intensity === 'high' ? '🔥 ' : activity.intensity === 'moderate' ? '💪 ' : '🚶 ';
        return `${completionIcon}${activity.scheduled_time} - ${intensityIcon}${activity.name} (${activity.duration_minutes}min)`;
      });
    }
    
    // Fall back to AI-generated plan if no saved activities
    return plan?.physical_activities || [];
  };

  const getPhysicalActivityProgress = () => {
    if (savedPhysicalActivities.length === 0) return null;
    
    const completed = savedPhysicalActivities.filter(activity => activity.completion_status === 'completed').length;
    const total = savedPhysicalActivities.length;
    const percentage = Math.round((completed / total) * 100);
    
    return { completed, total, percentage };
  };

  const getMeals = () => {
    // Prioritize saved meals over AI-generated plan
    if (savedMeals.length > 0) {
      return savedMeals.map(meal => {
        const completionIcon = meal.completion_status === 'completed' ? '✅ ' : '⏸️ ';
        const typeIcon = getMealTypeEmoji(meal.meal_type);
        return `${completionIcon}${meal.scheduled_time} - ${typeIcon} ${meal.name}${meal.calories ? ` (${meal.calories} cal)` : ''}`;
      });
    }
    
    // Fall back to AI-generated plan if no saved meals
    return plan?.meals || [];
  };

  const getMealTypeEmoji = (type) => {
    const emojiMap = {
      breakfast: '🥐',
      morning_snack: '🍎',
      lunch: '🍽️',
      afternoon_snack: '🥨',
      dinner: '🍽️',
      evening_snack: '🍪',
      hydration: '💧',
      supplements: '💊'
    };
    return emojiMap[type] || '🍽️';
  };

  const getMealProgress = () => {
    if (savedMeals.length === 0) return null;
    
    const completed = savedMeals.filter(meal => meal.completion_status === 'completed').length;
    const total = savedMeals.length;
    const percentage = Math.round((completed / total) * 100);
    
    return { completed, total, percentage };
  };

  const getTherapySessions = () => {
    // Prioritize saved sessions over AI-generated plan
    if (savedTherapySessions.length > 0) {
      return savedTherapySessions.map(session => {
        const completionIcon = session.completion_status === 'completed' ? '✅ ' : '⏸️ ';
        const typeIcon = getTherapyTypeEmoji(session.therapy_type);
        return `${completionIcon}${session.scheduled_time} - ${typeIcon} ${session.name} (${session.duration_minutes}min)`;
      });
    }
    
    // Fall back to AI-generated plan if no saved sessions
    return plan?.therapy_sessions || [];
  };

  const getTherapyTypeEmoji = (type) => {
    const emojiMap = {
      cognitive: '🧠',
      physical: '🏃',
      speech: '🗣️',
      occupational: '🛠️',
      group: '👥',
      counseling: '💬'
    };
    return emojiMap[type] || '🩺';
  };

  const getTherapySessionProgress = () => {
    if (savedTherapySessions.length === 0) return null;
    
    const completed = savedTherapySessions.filter(session => session.completion_status === 'completed').length;
    const total = savedTherapySessions.length;
    const percentage = Math.round((completed / total) * 100);
    
    return { completed, total, percentage };
  };

  const getSocialActivities = () => {
    // Prioritize saved activities over AI-generated plan
    if (savedSocialActivities.length > 0) {
      return savedSocialActivities.map(activity => {
        const completionIcon = activity.completion_status === 'completed' ? '✅ ' : '⏸️ ';
        const typeIcon = getSocialActivityTypeEmoji(activity.activity_type);
        const interactionIcon = getInteractionTypeEmoji(activity.interaction_type);
        return `${completionIcon}${activity.scheduled_time} - ${typeIcon} ${activity.name} ${interactionIcon}`;
      });
    }
    
    // Fall back to AI-generated plan if no saved activities
    return plan?.social_engagement || [];
  };

  const getSocialActivityTypeEmoji = (type) => {
    const emojiMap = {
      family_visit: '👨‍👩‍👧‍👦',
      friend_meetup: '👥',
      community_event: '🏛️',
      support_group: '🤝',
      recreational_activity: '🎨',
      conversation_time: '💬'
    };
    return emojiMap[type] || '👥';
  };

  const getInteractionTypeEmoji = (type) => {
    const emojiMap = {
      'in_person': '🤝',
      'phone_call': '📞',
      'video_call': '📹',
      'outing': '🚶'
    };
    return emojiMap[type] || '';
  };

  const getSocialActivityProgress = () => {
    if (savedSocialActivities.length === 0) return null;
    
    const completed = savedSocialActivities.filter(activity => activity.completion_status === 'completed').length;
    const total = savedSocialActivities.length;
    const percentage = Math.round((completed / total) * 100);
    
    return { completed, total, percentage };
  };

  const getSelfCareActivities = () => {
    // Prioritize saved activities over AI-generated plan
    if (savedSelfCareActivities.length > 0) {
      return savedSelfCareActivities.map(activity => {
        const completionIcon = activity.completion_status === 'completed' ? '✅ ' : '⏸️ ';
        const typeIcon = getSelfCareTypeEmoji(activity.care_type);
        const priorityIcon = activity.priority === 'high' ? '🔴 ' : activity.priority === 'medium' ? '🟡 ' : '🟢 ';
        return `${completionIcon}${activity.scheduled_time} - ${typeIcon} ${activity.name} ${priorityIcon}`;
      });
    }
    
    // Fall back to AI-generated plan if no saved activities
    return plan?.caregiver_breaks || [];
  };

  const getSelfCareTypeEmoji = (type) => {
    const emojiMap = {
      wellness: '🧘',
      health: '🏥',
      mental_health: '🧠',
      nutrition: '🍎',
      exercise: '🏋️',
      rest: '😴'
    };
    return emojiMap[type] || '💚';
  };

  const getSelfCareProgress = () => {
    if (savedSelfCareActivities.length === 0) return null;
    
    const completed = savedSelfCareActivities.filter(activity => activity.completion_status === 'completed').length;
    const total = savedSelfCareActivities.length;
    const percentage = Math.round((completed / total) * 100);
    
    return { completed, total, percentage };
  };
  
  useEffect(() => {
    if (patientId && patientData) {
      fetchDailyPlan();
      loadSavedRoutines();
      loadSavedCognitiveExercises();
      loadSavedPhysicalActivities();
      loadSavedMeals();
      loadSavedTherapySessions();
      loadSavedSocialActivities();
      loadSavedSelfCareActivities();
    }
  }, [patientId]);

  if (!patientData) {
    return (
      <Alert severity="warning" sx={{ mb: 3 }}>
        No patient data available for generating a care plan.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" component="h2" gutterBottom>
            Daily Care Plan
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            For {patientData.first_name} {patientData.last_name} on {format(date, 'PPPP')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Plan Date"
              value={date}
              onChange={(newDate) => setDate(newDate)}
              renderInput={(params) => <TextField size="small" {...params} />}
            />
          </LocalizationProvider>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => setShowConstraintsDialog(true)}
          >
            Customize & Regenerate
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Generating personalized daily care plan...
          </Typography>
        </Box>
      ) : plan ? (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
            <Tooltip title="Save Plan">
              <IconButton onClick={handleSavePlan}>
                <SaveIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Print Plan">
              <IconButton onClick={handlePrintPlan}>
                <PrintIcon />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Grid container spacing={3}>
            {/* Morning Routine */}
            <Grid item xs={12} md={6}>
              <PlanCard onClick={() => handleRoutineClick('morning')}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <SectionTitle variant="h6" sx={{ mb: 0 }}>
                      <MorningIcon color="primary" /> Morning Routine
                    </SectionTitle>
                    {getRoutineProgress('morning') && (
                      <Chip 
                        label={`${getRoutineProgress('morning').completed}/${getRoutineProgress('morning').total} Done`}
                        color={getRoutineProgress('morning').percentage === 100 ? 'success' : 'primary'}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  <List dense>
                    {getRoutineActivities('morning').map((activity, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={activity} />
                      </ListItem>
                    ))}
                  </List>
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="primary">
                      Click to manage routine activities
                    </Typography>
                  </Box>
                </CardContent>
              </PlanCard>
            </Grid>
            
            {/* Evening Routine */}
            <Grid item xs={12} md={6}>
              <PlanCard onClick={() => handleRoutineClick('evening')}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <SectionTitle variant="h6" sx={{ mb: 0 }}>
                      <EveningIcon color="primary" /> Evening Routine
                    </SectionTitle>
                    {getRoutineProgress('evening') && (
                      <Chip 
                        label={`${getRoutineProgress('evening').completed}/${getRoutineProgress('evening').total} Done`}
                        color={getRoutineProgress('evening').percentage === 100 ? 'success' : 'primary'}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  <List dense>
                    {getRoutineActivities('evening').map((activity, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={activity} />
                      </ListItem>
                    ))}
                  </List>
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="primary">
                      Click to manage routine activities
                    </Typography>
                  </Box>
                </CardContent>
              </PlanCard>
            </Grid>
            
            {/* Cognitive Exercises */}
            <Grid item xs={12} md={6}>
              <PlanCard onClick={() => setShowCognitiveExerciseManager(true)}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <SectionTitle variant="h6" sx={{ mb: 0 }}>
                      <ExerciseIcon color="success" /> Cognitive Exercises
                    </SectionTitle>
                    {getCognitiveExerciseProgress() && (
                      <Chip 
                        label={`${getCognitiveExerciseProgress().completed}/${getCognitiveExerciseProgress().total} Done`}
                        color={getCognitiveExerciseProgress().percentage === 100 ? 'success' : 'primary'}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  <List dense>
                    {getCognitiveExerciseActivities().map((exercise, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={exercise} />
                      </ListItem>
                    ))}
                  </List>
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="primary">
                      Click to manage cognitive exercises
                    </Typography>
                  </Box>
                </CardContent>
              </PlanCard>
            </Grid>
            
            {/* Physical Activities */}
            <Grid item xs={12} md={6}>
              <PlanCard onClick={() => setShowPhysicalActivityManager(true)}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <SectionTitle variant="h6" sx={{ mb: 0 }}>
                      <ActivityIcon color="success" /> Physical Activities
                    </SectionTitle>
                    {getPhysicalActivityProgress() && (
                      <Chip 
                        label={`${getPhysicalActivityProgress().completed}/${getPhysicalActivityProgress().total} Done`}
                        color={getPhysicalActivityProgress().percentage === 100 ? 'success' : 'primary'}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  <List dense>
                    {getPhysicalActivities().map((activity, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={activity} />
                      </ListItem>
                    ))}
                  </List>
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="primary">
                      Click to manage physical activities
                    </Typography>
                  </Box>
                </CardContent>
              </PlanCard>
            </Grid>
            
            {/* Meals */}
            <Grid item xs={12} md={6}>
              <PlanCard onClick={() => setShowMealsNutritionManager(true)}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <SectionTitle variant="h6" sx={{ mb: 0 }}>
                      <MealIcon color="primary" /> Meals & Nutrition
                    </SectionTitle>
                    {getMealProgress() && (
                      <Chip 
                        label={`${getMealProgress().completed}/${getMealProgress().total} Done`}
                        color={getMealProgress().percentage === 100 ? 'success' : 'primary'}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  <List dense>
                    {getMeals().map((meal, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={meal} />
                      </ListItem>
                    ))}
                  </List>
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="primary">
                      Click to manage meals & nutrition
                    </Typography>
                  </Box>
                </CardContent>
              </PlanCard>
            </Grid>
            
            {/* Therapy Sessions */}
            <Grid item xs={12} md={6}>
              <PlanCard onClick={() => setShowTherapySessionManager(true)}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <SectionTitle variant="h6" sx={{ mb: 0 }}>
                      <TherapyIcon color="secondary" /> Therapy Sessions
                    </SectionTitle>
                    {getTherapySessionProgress() && (
                      <Chip 
                        label={`${getTherapySessionProgress().completed}/${getTherapySessionProgress().total} Done`}
                        color={getTherapySessionProgress().percentage === 100 ? 'success' : 'primary'}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  <List dense>
                    {getTherapySessions().map((session, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={session} />
                      </ListItem>
                    ))}
                  </List>
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="primary">
                      Click to manage therapy sessions
                    </Typography>
                  </Box>
                </CardContent>
              </PlanCard>
            </Grid>
            
            {/* Social Engagement */}
            <Grid item xs={12} md={6}>
              <PlanCard onClick={() => setShowSocialEngagementManager(true)}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <SectionTitle variant="h6" sx={{ mb: 0 }}>
                      <SocialIcon color="info" /> Social Engagement
                    </SectionTitle>
                    {getSocialActivityProgress() && (
                      <Chip 
                        label={`${getSocialActivityProgress().completed}/${getSocialActivityProgress().total} Done`}
                        color={getSocialActivityProgress().percentage === 100 ? 'success' : 'primary'}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  <List dense>
                    {getSocialActivities().map((activity, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={activity} />
                      </ListItem>
                    ))}
                  </List>
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="primary">
                      Click to manage social activities
                    </Typography>
                  </Box>
                </CardContent>
              </PlanCard>
            </Grid>
            
            {/* Caregiver Self-Care */}
            <Grid item xs={12} md={6}>
              <PlanCard onClick={() => setShowCaregiverSelfCareManager(true)}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <SectionTitle variant="h6" sx={{ mb: 0 }}>
                      <BreakIcon color="warning" /> Caregiver Self-Care
                    </SectionTitle>
                    {getSelfCareProgress() && (
                      <Chip 
                        label={`${getSelfCareProgress().completed}/${getSelfCareProgress().total} Done`}
                        color={getSelfCareProgress().percentage === 100 ? 'success' : 'primary'}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Remember: Taking care of yourself is essential to provide the best care for your patient.
                  </Alert>
                  <List dense>
                    {getSelfCareActivities().map((activity, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={activity} />
                      </ListItem>
                    ))}
                  </List>
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="primary">
                      Click to manage self-care activities
                    </Typography>
                  </Box>
                </CardContent>
              </PlanCard>
            </Grid>
          </Grid>
        </Box>
      ) : (
        <Box sx={{ p: 4, textAlign: 'center', background: 'rgba(0,0,0,0.02)', borderRadius: 2 }}>
          <Typography variant="body1" color="text.secondary" paragraph>
            Generate a personalized daily care plan for {patientData.first_name}. 
            The AI will consider the patient's condition, preferences, and your availability.
          </Typography>
          <Button
            variant="contained"
            startIcon={<CalendarIcon />}
            onClick={() => setShowConstraintsDialog(true)}
          >
            Generate Care Plan
          </Button>
        </Box>
      )}
      
      {/* Caregiver Constraints Dialog */}
      <Dialog open={showConstraintsDialog} onClose={() => setShowConstraintsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Customize Care Plan</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Customize the care plan generation by providing your availability and constraints.
              This helps the AI create a more realistic and manageable plan.
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Your Availability Today</InputLabel>
                <Select
                  value={caregiverConstraints.available_time}
                  onChange={(e) => setCaregiverConstraints({
                    ...caregiverConstraints,
                    available_time: e.target.value
                  })}
                  label="Your Availability Today"
                >
                  <MenuItem value="full-day">Full Day (8+ hours)</MenuItem>
                  <MenuItem value="morning-only">Morning Only</MenuItem>
                  <MenuItem value="afternoon-only">Afternoon Only</MenuItem>
                  <MenuItem value="evening-only">Evening Only</MenuItem>
                  <MenuItem value="limited">Limited (2-4 hours)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Support Network Availability</InputLabel>
                <Select
                  value={caregiverConstraints.support_network}
                  onChange={(e) => setCaregiverConstraints({
                    ...caregiverConstraints,
                    support_network: e.target.value
                  })}
                  label="Support Network Availability"
                >
                  <MenuItem value="strong">Strong (Other caregivers available)</MenuItem>
                  <MenuItem value="moderate">Moderate (Some help available)</MenuItem>
                  <MenuItem value="limited">Limited (Minimal external support)</MenuItem>
                  <MenuItem value="none">None (I'm the only caregiver today)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Additional Considerations"
                placeholder="E.g., Patient had poor sleep last night, or we have a doctor's appointment at 2 PM..."
                value={caregiverConstraints.considerations}
                onChange={(e) => setCaregiverConstraints({
                  ...caregiverConstraints,
                  considerations: e.target.value
                })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConstraintsDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleConstraintsSubmit}
            startIcon={<CalendarIcon />}
          >
            Generate Plan
          </Button>
        </DialogActions>
      </Dialog>

      {/* Routine Manager Dialog */}
      {showRoutineManager && (
        <RoutineManager
          open={showRoutineManager}
          onClose={() => {
            setShowRoutineManager(false);
            setActiveRoutineType(null);
          }}
          routineType={activeRoutineType}
          patientId={patientId}
          initialActivities={getRoutineActivities(activeRoutineType)}
          onSave={handleRoutineSave}
        />
      )}

      {/* Cognitive Exercise Manager Dialog */}
      {showCognitiveExerciseManager && (
        <CognitiveExerciseManager
          open={showCognitiveExerciseManager}
          onClose={() => setShowCognitiveExerciseManager(false)}
          patientId={patientId}
          initialExercises={savedCognitiveExercises}
          onSave={handleCognitiveExercisesSave}
        />
      )}

      {/* Physical Activity Manager Dialog */}
      {showPhysicalActivityManager && (
        <PhysicalActivityManager
          open={showPhysicalActivityManager}
          onClose={() => setShowPhysicalActivityManager(false)}
          patientId={patientId}
          initialActivities={savedPhysicalActivities}
          onSave={handlePhysicalActivitiesSave}
        />
      )}

      {/* Meals & Nutrition Manager Dialog */}
      {showMealsNutritionManager && (
        <MealsNutritionManager
          open={showMealsNutritionManager}
          onClose={() => setShowMealsNutritionManager(false)}
          patientId={patientId}
          initialMeals={savedMeals}
          onSave={handleMealsSave}
        />
      )}

      {/* Therapy Session Manager Dialog */}
      {showTherapySessionManager && (
        <TherapySessionManager
          open={showTherapySessionManager}
          onClose={() => setShowTherapySessionManager(false)}
          patientId={patientId}
          initialSessions={savedTherapySessions}
          onSave={handleTherapySessionsSave}
        />
      )}

      {/* Social Engagement Manager Dialog */}
      {showSocialEngagementManager && (
        <SocialEngagementManager
          open={showSocialEngagementManager}
          onClose={() => setShowSocialEngagementManager(false)}
          patientId={patientId}
          initialActivities={savedSocialActivities}
          onSave={handleSocialActivitiesSave}
        />
      )}

      {/* Caregiver Self-Care Manager Dialog */}
      {showCaregiverSelfCareManager && (
        <CaregiverSelfCareManager
          open={showCaregiverSelfCareManager}
          onClose={() => setShowCaregiverSelfCareManager(false)}
          patientId={patientId}
          initialActivities={savedSelfCareActivities}
          onSave={handleSelfCareActivitiesSave}
        />
      )}
    </Box>
  );
};

export default DailyCareplan; 