import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Grid,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Tooltip,
  Divider,
  Paper,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CompleteIcon,
  Schedule as ScheduleIcon,
  Restaurant as MealIcon,
  LocalCafe as BreakfastIcon,
  LunchDining as LunchIcon,
  DinnerDining as DinnerIcon,
  Cookie as SnackIcon,
  LocalDrink as DrinkIcon,
  AccessTime as TimeIcon,
  Medication as SupplementIcon,
  Warning as AllergyIcon,
  Favorite as HeartIcon,
} from '@mui/icons-material';
import { caregiverApi } from '../../services/apiService';

// Generate time options in 15-minute intervals
const generateTimeOptions = () => {
  const times = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      times.push(timeString);
    }
  }
  return times;
};

const timeOptions = generateTimeOptions();

const MealsNutritionManager = ({ 
  open, 
  onClose, 
  patientId,
  initialMeals = [],
  onSave 
}) => {
  const [meals, setMeals] = useState([]);
  const [currentMeal, setCurrentMeal] = useState({
    id: null,
    name: '',
    meal_type: 'breakfast',
    scheduled_time: '08:00',
    description: '',
    calories: '',
    dietary_notes: '',
    allergies: '',
    supplements: '',
    hydration_goal: '',
    preparation_notes: '',
    completion_status: 'pending'
  });
  const [editingIndex, setEditingIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);

  // Meal types with descriptions and appropriate times
  const mealTypes = [
    { value: 'breakfast', label: 'Breakfast', icon: BreakfastIcon, color: 'warning', description: 'Morning meal to start the day', defaultTime: '08:00' },
    { value: 'morning_snack', label: 'Morning Snack', icon: SnackIcon, color: 'info', description: 'Light snack between breakfast and lunch', defaultTime: '10:30' },
    { value: 'lunch', label: 'Lunch', icon: LunchIcon, color: 'primary', description: 'Midday main meal', defaultTime: '12:30' },
    { value: 'afternoon_snack', label: 'Afternoon Snack', icon: SnackIcon, color: 'info', description: 'Light snack between lunch and dinner', defaultTime: '15:30' },
    { value: 'dinner', label: 'Dinner', icon: DinnerIcon, color: 'secondary', description: 'Evening main meal', defaultTime: '18:30' },
    { value: 'evening_snack', label: 'Evening Snack', icon: SnackIcon, color: 'info', description: 'Light snack before bedtime', defaultTime: '20:30' },
    { value: 'hydration', label: 'Hydration', icon: DrinkIcon, color: 'success', description: 'Water and fluid intake', defaultTime: '09:00' },
    { value: 'supplements', label: 'Supplements', icon: SupplementIcon, color: 'error', description: 'Vitamins and dietary supplements', defaultTime: '09:00' }
  ];

  useEffect(() => {
    loadSavedMeals();
  }, [open, patientId]);

  const loadSavedMeals = async () => {
    if (!patientId) return;
    
    try {
      setLoading(true);
      const response = await caregiverApi.getPatientRoutines(patientId, 'meals_nutrition');
      
      if (response.success && response.routines) {
        setMeals(response.routines);
      } else {
        setMeals([]);
      }
    } catch (error) {
      console.error('Error loading saved meals:', error);
      setMeals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMealChange = (field, value) => {
    setCurrentMeal(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddMeal = () => {
    setCurrentMeal({
      id: null,
      name: '',
      meal_type: 'breakfast',
      scheduled_time: '08:00',
      description: '',
      calories: '',
      dietary_notes: '',
      allergies: '',
      supplements: '',
      hydration_goal: '',
      preparation_notes: '',
      completion_status: 'pending'
    });
    setEditingIndex(-1);
  };

  const handleEditMeal = (index) => {
    const meal = meals[index];
    setCurrentMeal(meal);
    setEditingIndex(index);
  };

  const handleSaveMeal = async () => {
    if (!currentMeal.name.trim()) {
      setError('Meal name is required');
      return;
    }

    const newMeal = {
      ...currentMeal,
      id: currentMeal.id || `meal_${Date.now()}`,
    };

    const updatedMeals = editingIndex >= 0
      ? meals.map((meal, index) => index === editingIndex ? newMeal : meal)
      : [...meals, newMeal];

    setMeals(updatedMeals);
    await saveMealsToBackend(updatedMeals);
    
    // Reset form
    setCurrentMeal({
      id: null,
      name: '',
      meal_type: 'breakfast',
      scheduled_time: '08:00',
      description: '',
      calories: '',
      dietary_notes: '',
      allergies: '',
      supplements: '',
      hydration_goal: '',
      preparation_notes: '',
      completion_status: 'pending'
    });
    setEditingIndex(-1);
    setError(null);
  };

  const handleDeleteMeal = async (index) => {
    const updatedMeals = meals.filter((_, i) => i !== index);
    setMeals(updatedMeals);
    await saveMealsToBackend(updatedMeals);
  };

  const handleToggleCompletion = async (index) => {
    const updatedMeals = meals.map((meal, i) => {
      if (i === index) {
        return {
          ...meal,
          completion_status: meal.completion_status === 'completed' ? 'pending' : 'completed'
        };
      }
      return meal;
    });
    
    setMeals(updatedMeals);
    await saveMealsToBackend(updatedMeals);
  };

  const saveMealsToBackend = async (mealList) => {
    if (!patientId) return;

    try {
      const routineData = {
        routine_type: 'meals_nutrition',
        activities: mealList.map(meal => ({
          name: meal.name,
          meal_type: meal.meal_type,
          scheduled_time: meal.scheduled_time,
          description: meal.description || '',
          calories: meal.calories || '',
          dietary_notes: meal.dietary_notes || '',
          allergies: meal.allergies || '',
          supplements: meal.supplements || '',
          hydration_goal: meal.hydration_goal || '',
          preparation_notes: meal.preparation_notes || '',
          completion_status: meal.completion_status || 'pending'
        }))
      };

      const response = await caregiverApi.savePatientRoutine(patientId, routineData);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to save meals');
      }
      
      console.log('Meals and nutrition saved successfully');
    } catch (error) {
      console.error('Error saving meals:', error);
      setError('Failed to save meals. Please try again.');
    }
  };

  const handleSave = async () => {
    await saveMealsToBackend(meals);
    if (onSave) onSave(meals);
    onClose();
  };

  const getMealTypeIcon = (type) => {
    const typeConfig = mealTypes.find(t => t.value === type);
    if (typeConfig) {
      const Icon = typeConfig.icon;
      return <Icon color={typeConfig.color} />;
    }
    return <MealIcon />;
  };

  const getCompletionStats = () => {
    const completed = meals.filter(meal => meal.completion_status === 'completed').length;
    const total = meals.length;
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const getMealsByType = (type) => {
    return meals.filter(meal => meal.meal_type === type);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Meals & Nutrition Planner</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getCompletionStats().total > 0 && (
              <Chip
                label={`${getCompletionStats().completed}/${getCompletionStats().total} Complete`}
                color={getCompletionStats().percentage === 100 ? 'success' : 'primary'}
                size="small"
              />
            )}
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
            <Tab label="Meal Plan" />
            <Tab label="Add/Edit Meal" />
          </Tabs>
        </Box>

        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {/* Meal Plan Tab */}
        {selectedTab === 0 && (
          <Box sx={{ p: 2 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Daily Meal & Nutrition Plan</Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      handleAddMeal();
                      setSelectedTab(1);
                    }}
                  >
                    Add Meal
                  </Button>
                </Box>

                {/* Meal Types Overview */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {mealTypes.map((type) => (
                    <Grid item xs={12} sm={6} md={3} key={type.value}>
                      <Paper 
                        sx={{ 
                          p: 2, 
                          textAlign: 'center', 
                          cursor: 'pointer', 
                          '&:hover': { 
                            bgcolor: 'action.hover',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)'
                          },
                          transition: 'all 0.2s ease-in-out'
                        }}
                        onClick={() => {
                          // Pre-populate the form with this meal type
                          setCurrentMeal({
                            ...currentMeal,
                            meal_type: type.value,
                            scheduled_time: type.defaultTime,
                            name: type.label // Pre-fill with the type name as starting point
                          });
                          setSelectedTab(1); // Switch to Add/Edit tab
                        }}
                      >
                        <type.icon color={type.color} sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="subtitle2" gutterBottom>{type.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {type.description}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold' }}>
                            Click to plan
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>

                {meals.length === 0 ? (
                  <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      No meals planned yet.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Add meals and nutrition plans to support healthy eating habits.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        handleAddMeal();
                        setSelectedTab(1);
                      }}
                    >
                      Plan First Meal
                    </Button>
                  </Paper>
                ) : (
                  <Grid container spacing={2}>
                    {meals
                      .sort((a, b) => a.scheduled_time?.localeCompare(b.scheduled_time) || 0)
                      .map((meal, index) => (
                        <Grid item xs={12} md={6} key={meal.id || index}>
                          <Card sx={{ height: '100%' }}>
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {getMealTypeIcon(meal.meal_type)}
                                  <Typography variant="h6" component="h3">
                                    {meal.name}
                                  </Typography>
                                </Box>
                                <Chip
                                  size="small"
                                  label={meal.completion_status === 'completed' ? 'Completed' : 'Pending'}
                                  color={meal.completion_status === 'completed' ? 'success' : 'default'}
                                  variant={meal.completion_status === 'completed' ? 'filled' : 'outlined'}
                                />
                              </Box>
                              
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {mealTypes.find(t => t.value === meal.meal_type)?.label || 'Unknown Type'}
                              </Typography>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <TimeIcon fontSize="small" color="action" />
                                <Typography variant="body2">
                                  {meal.scheduled_time}
                                </Typography>
                              </Box>

                              {meal.calories && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <HeartIcon fontSize="small" color="action" />
                                  <Typography variant="body2">
                                    {meal.calories} calories
                                  </Typography>
                                </Box>
                              )}

                              {meal.description && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                  {meal.description}
                                </Typography>
                              )}

                              {meal.allergies && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                  <AllergyIcon fontSize="small" color="warning" />
                                  <Typography variant="body2" color="warning.main">
                                    Allergies: {meal.allergies}
                                  </Typography>
                                </Box>
                              )}

                              {meal.dietary_notes && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                  📝 {meal.dietary_notes}
                                </Typography>
                              )}
                            </CardContent>
                            
                            <CardActions sx={{ justifyContent: 'space-between' }}>
                              <Box>
                                <Tooltip title="Edit Meal">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      handleEditMeal(index);
                                      setSelectedTab(1);
                                    }}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete Meal">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteMeal(index)}
                                    color="error"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                              
                              <Box>
                                <Tooltip title={meal.completion_status === 'completed' ? 'Mark as Pending' : 'Mark as Completed'}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleToggleCompletion(index)}
                                    color={meal.completion_status === 'completed' ? 'success' : 'default'}
                                  >
                                    <CompleteIcon />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </CardActions>
                          </Card>
                        </Grid>
                      ))}
                  </Grid>
                )}
              </Box>
            )}
          </Box>
        )}

        {/* Add/Edit Meal Tab */}
        {selectedTab === 1 && (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {editingIndex >= 0 ? 'Edit Meal' : 'Add New Meal'}
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Meal Name"
                  value={currentMeal.name}
                  onChange={(e) => handleMealChange('name', e.target.value)}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Meal Type</InputLabel>
                  <Select
                    value={currentMeal.meal_type}
                    onChange={(e) => handleMealChange('meal_type', e.target.value)}
                    label="Meal Type"
                  >
                    {mealTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <type.icon color={type.color} />
                          {type.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Scheduled Time</InputLabel>
                  <Select
                    value={currentMeal.scheduled_time}
                    onChange={(e) => handleMealChange('scheduled_time', e.target.value)}
                    label="Scheduled Time"
                  >
                    {timeOptions.map((time) => (
                      <MenuItem key={time} value={time}>
                        {time}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Calories (optional)"
                  value={currentMeal.calories}
                  onChange={(e) => handleMealChange('calories', e.target.value)}
                  placeholder="e.g., 350"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={currentMeal.description}
                  onChange={(e) => handleMealChange('description', e.target.value)}
                  placeholder="e.g., Grilled chicken with vegetables and rice"
                  multiline
                  rows={2}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Dietary Notes"
                  value={currentMeal.dietary_notes}
                  onChange={(e) => handleMealChange('dietary_notes', e.target.value)}
                  placeholder="e.g., Low sodium, high protein"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Allergies/Restrictions"
                  value={currentMeal.allergies}
                  onChange={(e) => handleMealChange('allergies', e.target.value)}
                  placeholder="e.g., Nuts, dairy, gluten"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Supplements"
                  value={currentMeal.supplements}
                  onChange={(e) => handleMealChange('supplements', e.target.value)}
                  placeholder="e.g., Vitamin D, Omega-3"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Hydration Goal"
                  value={currentMeal.hydration_goal}
                  onChange={(e) => handleMealChange('hydration_goal', e.target.value)}
                  placeholder="e.g., 2 glasses of water"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Preparation Notes"
                  value={currentMeal.preparation_notes}
                  onChange={(e) => handleMealChange('preparation_notes', e.target.value)}
                  placeholder="Special preparation instructions, cooking tips, or caregiver notes..."
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleSaveMeal}
                    disabled={!currentMeal.name.trim()}
                  >
                    {editingIndex >= 0 ? 'Update Meal' : 'Add Meal'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setSelectedTab(0);
                      setEditingIndex(-1);
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={handleSave}>
          Save All Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MealsNutritionManager;