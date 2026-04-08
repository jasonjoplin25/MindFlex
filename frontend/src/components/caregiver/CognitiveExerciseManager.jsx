import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Checkbox,
  FormControlLabel,
  Divider,
  Tooltip,
  Paper,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CompletedIcon,
  RadioButtonUnchecked as IncompleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Timer as TimerIcon,
  Psychology as BrainIcon,
  Gamepad as GamepadIcon,
  TrendingUp as ProgressIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material';
import { caregiverApi } from '../../services/apiService';
import { getGames } from '../../services/gameService';
import { EXERCISE_GAME_MAPPING } from '../../utils/exerciseGameMapping';

const CognitiveExerciseManager = ({ 
  open, 
  onClose, 
  patientId, 
  initialActivities = [],
  onSave 
}) => {
  const [exercises, setExercises] = useState([]);
  const [availableGames, setAvailableGames] = useState([]);
  const [editingExercise, setEditingExercise] = useState(null);
  const [newExercise, setNewExercise] = useState({
    name: '',
    game_name: '',
    game_type: '',
    difficulty: 'medium',
    duration_minutes: 15,
    scheduled_time: '',
    frequency: 'daily',
    goals: [],
    notes: '',
    completion_status: 'pending'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cognitive exercise types with actual available games
  const exerciseTypes = {
    memory: {
      name: 'Memory Training',
      description: 'Improve working memory and recall abilities',
      icon: '🧠',
      games: ['Memory Match', 'Word Scramble']
    },
    attention: {
      name: 'Attention Training', 
      description: 'Enhance focus and selective attention',
      icon: '👁️',
      games: ['Reaction Time', 'Pattern Recognition']
    },
    reasoning: {
      name: 'Executive Function',
      description: 'Strengthen planning and cognitive flexibility',
      icon: '⚙️',
      games: ['Math Challenge', 'Pattern Recognition']
    },
    processing_speed: {
      name: 'Processing Speed',
      description: 'Improve reaction time and processing efficiency',
      icon: '⚡',
      games: ['Reaction Time', 'Snake Game']
    }
  };

  useEffect(() => {
    if (open && patientId) {
      loadCognitiveExercises();
      loadAvailableGames();
    }
  }, [open, patientId]);

  const loadCognitiveExercises = async () => {
    try {
      setLoading(true);
      const response = await caregiverApi.getPatientRoutines(patientId, 'cognitive');
      if (response.success) {
        setExercises(response.routines || []);
      } else {
        // Initialize with suggested exercises if none saved
        const suggestedExercises = [
          'Memory Match - Easy',
          'Focus Training - Medium', 
          'Problem Solving - Medium'
        ];
        const formattedExercises = suggestedExercises.map((exercise, index) => ({
          id: `temp_${index}`,
          name: exercise,
          game_name: 'Memory Match',
          game_type: 'memory',
          difficulty: 'medium',
          duration_minutes: 15,
          scheduled_time: `${9 + index}:00`,
          frequency: 'daily',
          goals: ['cognitive_improvement'],
          notes: '',
          completion_status: 'pending',
          created_at: new Date().toISOString()
        }));
        setExercises(formattedExercises);
      }
    } catch (error) {
      console.error('Error loading cognitive exercises:', error);
      setError('Failed to load cognitive exercises');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableGames = async () => {
    try {
      const { data, error } = await getGames();
      if (error) {
        console.error('Error loading games:', error);
        setAvailableGames([]);
      } else {
        setAvailableGames(data || []);
      }
    } catch (error) {
      console.error('Error loading games:', error);
      setAvailableGames([]);
    }
  };

  const handleAddExercise = () => {
    if (!newExercise.name.trim()) return;

    const exercise = {
      ...newExercise,
      id: `new_${Date.now()}`,
      created_at: new Date().toISOString()
    };

    setExercises([...exercises, exercise]);
    setNewExercise({
      name: '',
      game_name: '',
      game_type: '',
      difficulty: 'medium',
      duration_minutes: 15,
      scheduled_time: '',
      frequency: 'daily',
      goals: [],
      notes: '',
      completion_status: 'pending'
    });
  };

  const handleEditExercise = (exercise) => {
    setEditingExercise({ ...exercise });
  };

  const handleUpdateExercise = () => {
    if (!editingExercise) return;

    setExercises(exercises.map(exercise => 
      exercise.id === editingExercise.id ? editingExercise : exercise
    ));
    setEditingExercise(null);
  };

  const handleDeleteExercise = (exerciseId) => {
    setExercises(exercises.filter(exercise => exercise.id !== exerciseId));
  };

  const handleToggleCompletion = async (exerciseId) => {
    const updatedExercises = exercises.map(exercise => 
      exercise.id === exerciseId 
        ? { 
            ...exercise, 
            completion_status: exercise.completion_status === 'completed' ? 'pending' : 'completed',
            completed_at: exercise.completion_status === 'completed' ? null : new Date().toISOString()
          }
        : exercise
    );
    
    setExercises(updatedExercises);
    
    // Auto-save when completion status changes
    try {
      console.log('Auto-saving cognitive exercises after completion toggle');
      const response = await caregiverApi.savePatientRoutine(patientId, {
        routine_type: 'cognitive',
        activities: updatedExercises
      });
      
      if (response.success && onSave) {
        onSave(updatedExercises);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  const handleSaveExercises = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Saving cognitive exercises:', {
        patientId,
        exercisesCount: exercises.length,
        exercises: exercises
      });
      
      const response = await caregiverApi.savePatientRoutine(patientId, {
        routine_type: 'cognitive',
        activities: exercises
      });

      if (response.success) {
        console.log('Cognitive exercises saved successfully');
        if (onSave) {
          onSave(exercises);
        }
        onClose();
      } else {
        setError(response.error || 'Failed to save cognitive exercises');
      }
    } catch (error) {
      console.error('Error saving cognitive exercises:', error);
      setError(`Failed to save cognitive exercises: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'default';
    }
  };

  const getGameTypeIcon = (gameType) => {
    return exerciseTypes[gameType]?.icon || '🎮';
  };

  const getCompletionStats = () => {
    const total = exercises.length;
    const completed = exercises.filter(ex => ex.completion_status === 'completed').length;
    return { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const stats = getCompletionStats();

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BrainIcon color="primary" />
            <Typography variant="h6">
              Cognitive Exercise Planning
            </Typography>
          </Box>
          <Chip 
            label={`${stats.completed}/${stats.total} Completed (${stats.percentage}%)`}
            color={stats.percentage === 100 ? 'success' : 'primary'}
            variant="outlined"
          />
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Available Games Overview */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {availableGames.map((game) => {
            const getGameIcon = (gameName) => {
              switch (gameName) {
                case 'Math Challenge': return '🧮';
                case 'Memory Match': return '🧠';
                case 'Pattern Recognition': return '🔍';
                case 'Reaction Time': return '⚡';
                case 'Snake Game': return '🐍';
                case 'Word Scramble': return '🔤';
                default: return '🎮';
              }
            };
            
            return (
              <Grid item xs={12} sm={6} md={4} key={game.id}>
                <Paper sx={{ p: 2, textAlign: 'center', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                  <Typography variant="h4" sx={{ mb: 1 }}>{getGameIcon(game.name)}</Typography>
                  <Typography variant="subtitle2" gutterBottom>{game.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {game.description || 'Cognitive training game'}
                  </Typography>
                </Paper>
              </Grid>
            );
          })}
        </Grid>

        {/* Add New Exercise Section */}
        <Card sx={{ mb: 3, backgroundColor: 'rgba(25, 118, 210, 0.04)' }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <AddIcon sx={{ mr: 1 }} />
              Plan New Cognitive Exercise
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Exercise Name"
                  value={newExercise.name}
                  onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                  size="small"
                  placeholder="e.g., Morning Memory Challenge"
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Game</InputLabel>
                  <Select
                    value={newExercise.game_name}
                    label="Game"
                    onChange={(e) => setNewExercise({ 
                      ...newExercise, 
                      game_name: e.target.value,
                      game_type: 'custom'
                    })}
                  >
                    {availableGames.map((game) => {
                      const getGameIcon = (gameName) => {
                        switch (gameName) {
                          case 'Math Challenge': return '🧮';
                          case 'Memory Match': return '🧠';
                          case 'Pattern Recognition': return '🔍';
                          case 'Reaction Time': return '⚡';
                          case 'Snake Game': return '🐍';
                          case 'Word Scramble': return '🔤';
                          default: return '🎮';
                        }
                      };
                      
                      return (
                        <MenuItem key={game.id} value={game.name}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{getGameIcon(game.name)}</span>
                            {game.name}
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Difficulty</InputLabel>
                  <Select
                    value={newExercise.difficulty}
                    label="Difficulty"
                    onChange={(e) => setNewExercise({ ...newExercise, difficulty: e.target.value })}
                  >
                    <MenuItem value="easy">Easy</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="hard">Hard</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Time</InputLabel>
                  <Select
                    value={newExercise.scheduled_time}
                    label="Time"
                    onChange={(e) => setNewExercise({ ...newExercise, scheduled_time: e.target.value })}
                  >
                    {Array.from({ length: 96 }, (_, i) => {
                      const hours = Math.floor(i / 4);
                      const minutes = (i % 4) * 15;
                      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                      const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      });
                      return (
                        <MenuItem key={timeString} value={timeString}>
                          {displayTime}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Duration (minutes)"
                  type="number"
                  value={newExercise.duration_minutes}
                  onChange={(e) => setNewExercise({ ...newExercise, duration_minutes: parseInt(e.target.value) || 15 })}
                  size="small"
                  inputProps={{ min: 5, max: 60 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Frequency</InputLabel>
                  <Select
                    value={newExercise.frequency}
                    label="Frequency"
                    onChange={(e) => setNewExercise({ ...newExercise, frequency: e.target.value })}
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="bi-weekly">Bi-weekly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Goals & Notes"
                  value={newExercise.notes}
                  onChange={(e) => setNewExercise({ ...newExercise, notes: e.target.value })}
                  size="small"
                  multiline
                  rows={2}
                  placeholder="e.g., Focus on improving working memory, target 80% accuracy"
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddExercise}
                    disabled={!newExercise.name.trim() || !newExercise.game_name}
                  >
                    Add Exercise
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Scheduled Exercises List */}
        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <ScheduleIcon sx={{ mr: 1 }} />
          Scheduled Cognitive Exercises
        </Typography>
        
        {exercises.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No cognitive exercises planned yet. Add some exercises to get started with brain training!
          </Alert>
        ) : (
          <List>
            {exercises
              .sort((a, b) => a.scheduled_time?.localeCompare(b.scheduled_time) || 0)
              .map((exercise, index) => (
                <React.Fragment key={exercise.id}>
                  <ListItem
                    sx={{
                      backgroundColor: exercise.completion_status === 'completed' ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                      borderRadius: 1,
                      mb: 1,
                      border: '1px solid',
                      borderColor: exercise.completion_status === 'completed' ? 'success.light' : 'divider'
                    }}
                  >
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" component="div">
                          {exercise.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title={exercise.completion_status === 'completed' ? 'Mark Incomplete' : 'Mark Complete'}>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleCompletion(exercise.id)}
                              color={exercise.completion_status === 'completed' ? 'success' : 'default'}
                            >
                              {exercise.completion_status === 'completed' ? <CompletedIcon /> : <IncompleteIcon />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Exercise">
                            <IconButton size="small" onClick={() => handleEditExercise(exercise)}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Exercise">
                            <IconButton size="small" onClick={() => handleDeleteExercise(exercise.id)} color="error">
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 0.5 }}>
                        <Chip
                          label={exercise.scheduled_time}
                          size="small"
                          icon={<TimerIcon />}
                          variant="outlined"
                        />
                        <Chip
                          label={`${(() => {
                            switch (exercise.game_name) {
                              case 'Math Challenge': return '🧮';
                              case 'Memory Match': return '🧠';
                              case 'Pattern Recognition': return '🔍';
                              case 'Reaction Time': return '⚡';
                              case 'Snake Game': return '🐍';
                              case 'Word Scramble': return '🔤';
                              default: return '🎮';
                            }
                          })()} ${exercise.game_name || 'No game selected'}`}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={exercise.difficulty}
                          size="small"
                          color={getDifficultyColor(exercise.difficulty)}
                          variant="outlined"
                        />
                        <Chip
                          label={`${exercise.duration_minutes}min`}
                          size="small"
                          icon={<ScheduleIcon />}
                          variant="outlined"
                        />
                      </Box>
                      {exercise.notes && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {exercise.notes}
                        </Typography>
                      )}
                      {exercise.completion_status === 'completed' && exercise.completed_at && (
                        <Typography variant="caption" color="success.main">
                          Completed at {new Date(exercise.completed_at).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </Typography>
                      )}
                    </Box>
                  </ListItem>
                  {index < exercises.length - 1 && <Divider />}
                </React.Fragment>
              ))}
          </List>
        )}

        {/* Edit Exercise Dialog */}
        {editingExercise && (
          <Dialog open={true} onClose={() => setEditingExercise(null)} maxWidth="sm" fullWidth>
            <DialogTitle>Edit Cognitive Exercise</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Exercise Name"
                    value={editingExercise.name}
                    onChange={(e) => setEditingExercise({ ...editingExercise, name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Game</InputLabel>
                    <Select
                      value={editingExercise.game_name}
                      label="Game"
                      onChange={(e) => setEditingExercise({ ...editingExercise, game_name: e.target.value })}
                    >
                      {availableGames.map((game) => {
                        const getGameIcon = (gameName) => {
                          switch (gameName) {
                            case 'Math Challenge': return '🧮';
                            case 'Memory Match': return '🧠';
                            case 'Pattern Recognition': return '🔍';
                            case 'Reaction Time': return '⚡';
                            case 'Snake Game': return '🐍';
                            case 'Word Scramble': return '🔤';
                            default: return '🎮';
                          }
                        };
                        
                        return (
                          <MenuItem key={game.id} value={game.name}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <span>{getGameIcon(game.name)}</span>
                              {game.name}
                            </Box>
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Difficulty</InputLabel>
                    <Select
                      value={editingExercise.difficulty}
                      label="Difficulty"
                      onChange={(e) => setEditingExercise({ ...editingExercise, difficulty: e.target.value })}
                    >
                      <MenuItem value="easy">Easy</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="hard">Hard</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Goals & Notes"
                    value={editingExercise.notes}
                    onChange={(e) => setEditingExercise({ ...editingExercise, notes: e.target.value })}
                    multiline
                    rows={3}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditingExercise(null)} startIcon={<CancelIcon />}>
                Cancel
              </Button>
              <Button 
                variant="contained" 
                onClick={handleUpdateExercise}
                startIcon={<SaveIcon />}
              >
                Save Changes
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSaveExercises}
          disabled={loading}
          startIcon={<SaveIcon />}
        >
          {loading ? 'Saving...' : 'Save Exercise Plan'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CognitiveExerciseManager;