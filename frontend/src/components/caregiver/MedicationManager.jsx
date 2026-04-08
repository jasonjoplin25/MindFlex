import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Grid,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  LinearProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Medication as MedicationIcon,
  CheckCircle as TakenIcon,
  Cancel as MissedIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  AccessTime as TimeIcon,
  SettingsApplications as SettingsIcon,
  Notifications as NotificationIcon,
  PriorityHigh as InteractionIcon,
  BiotechOutlined as SideEffectIcon,
  Lightbulb as TipIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { format, parse, isWithinInterval } from 'date-fns';
import { caregiverApi } from '../../services/apiService';

const MedicationChip = styled(Chip)(({ theme, status }) => {
  const colors = {
    taken: theme.palette.success.main,
    missed: theme.palette.error.main,
    upcoming: theme.palette.info.main,
    interaction: theme.palette.warning.main,
    sideEffect: theme.palette.warning.dark,
  };
  
  return {
    backgroundColor: colors[status] || theme.palette.grey[500],
    color: theme.palette.getContrastText(colors[status] || theme.palette.grey[500]),
    '& .MuiChip-icon': {
      color: 'inherit',
    },
  };
});

const MedicationManager = ({ patientId, medications = [] }) => {
  const [medicationList, setMedicationList] = useState(medications.length > 0 ? medications : []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [showAIOptimization, setShowAIOptimization] = useState(false);
  const [optimizationLoading, setOptimizationLoading] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [showInteractions, setShowInteractions] = useState(false);
  const [sideEffectsTracking, setSideEffectsTracking] = useState({});
  const [openSideEffectDialog, setOpenSideEffectDialog] = useState(false);
  const [currentSideEffect, setCurrentSideEffect] = useState({ medication: null, effects: [] });
  
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: 'daily',
    time: new Date(),
    instructions: '',
    startDate: new Date(),
    endDate: null,
    active: true,
    reminder: true,
  });

  useEffect(() => {
    if (medications.length === 0) {
      fetchMedications();
    }
  }, [patientId]);

  const fetchMedications = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await caregiverApi.getPatientMedications(patientId);
      
      if (response.success) {
        setMedicationList(response.medications || []);
      } else {
        setError(response.error || 'Failed to load medication data. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching medications:', error);
      setError('Failed to load medication data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedication = () => {
    setOpenAddDialog(true);
  };

  const handleEditMedication = (medication) => {
    setSelectedMedication({
      ...medication,
      startDate: medication.start_date ? new Date(medication.start_date) : new Date(),
      endDate: medication.end_date ? new Date(medication.end_date) : null,
      time: medication.times && medication.times.length > 0 
        ? medication.times[0] 
        : (medication.time || new Date())
    });
    setOpenEditDialog(true);
  };

  const handleSaveMedication = async () => {
    setLoading(true);
    
    try {
      const medicationData = {
        ...newMedication,
        time: typeof newMedication.time === 'string' ? newMedication.time : format(newMedication.time, 'HH:mm'),
        startDate: format(new Date(newMedication.startDate), 'yyyy-MM-dd'),
        endDate: newMedication.endDate ? format(new Date(newMedication.endDate), 'yyyy-MM-dd') : null
      };
      
      const response = await caregiverApi.addPatientMedication(patientId, medicationData);
      
      if (response.success) {
        setMedicationList([...medicationList, response.medication]);
        setOpenAddDialog(false);
        setNewMedication({
          name: '',
          dosage: '',
          frequency: 'daily',
          time: new Date(),
          instructions: '',
          startDate: new Date(),
          endDate: null,
          active: true,
          reminder: true,
        });
      } else {
        setError(response.error || 'Failed to add medication. Please try again.');
      }
    } catch (error) {
      console.error('Error adding medication:', error);
      setError('Failed to add medication. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMedication = async () => {
    setLoading(true);
    
    try {
      const response = await caregiverApi.updatePatientMedication(patientId, selectedMedication.id, selectedMedication);
      
      if (response.success) {
        const updatedList = medicationList.map(med => 
          med.id === selectedMedication.id ? response.medication : med
        );
        
        setMedicationList(updatedList);
        setOpenEditDialog(false);
        setSelectedMedication(null);
      } else {
        setError(response.error || 'Failed to update medication. Please try again.');
      }
    } catch (error) {
      console.error('Error updating medication:', error);
      setError('Failed to update medication. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMedication = async (medicationId) => {
    if (!window.confirm('Are you sure you want to delete this medication?')) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await caregiverApi.deletePatientMedication(patientId, medicationId);
      
      if (response.success) {
        const updatedList = medicationList.filter(med => med.id !== medicationId);
        setMedicationList(updatedList);
      } else {
        setError(response.error || 'Failed to delete medication. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting medication:', error);
      setError('Failed to delete medication. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeMedications = async () => {
    setOptimizationLoading(true);
    
    try {
      const response = await caregiverApi.optimizeMedications(patientId);
      
      if (response.success) {
        setOptimizationResult(response.optimization);
        setShowAIOptimization(true);
      } else {
        setError(response.error || 'Failed to optimize medication schedule. Please try again.');
      }
    } catch (error) {
      console.error('Error optimizing medications:', error);
      setError('Failed to optimize medication schedule. Please try again.');
    } finally {
      setOptimizationLoading(false);
    }
  };

  const handleToggleAdherence = async (medicationId, date, currentStatus) => {
    try {
      // In a production app, you would use the real API:
      // await caregiverApi.updateMedicationAdherence(patientId, medicationId, date, !currentStatus);
      
      // Mock updating adherence
      const updatedList = medicationList.map(med => {
        if (med.id === medicationId) {
          const updatedAdherence = med.adherence.map(a => 
            a.date === date ? { ...a, taken: !currentStatus } : a
          );
          return { ...med, adherence: updatedAdherence };
        }
        return med;
      });
      
      setMedicationList(updatedList);
    } catch (error) {
      console.error('Error updating adherence:', error);
      setError('Failed to update medication adherence. Please try again.');
    }
  };

  const handleAddSideEffect = (medication) => {
    setCurrentSideEffect({
      medication,
      effect: '',
    });
    setOpenSideEffectDialog(true);
  };

  const handleSaveSideEffect = async () => {
    if (!currentSideEffect.effect) return;
    
    try {
      // In a production app, you would use the real API:
      // await caregiverApi.addMedicationSideEffect(patientId, currentSideEffect.medication.id, currentSideEffect.effect);
      
      // Mock adding side effect
      const updatedList = medicationList.map(med => {
        if (med.id === currentSideEffect.medication.id) {
          const updatedSideEffects = [...(med.sideEffects || []), currentSideEffect.effect];
          return { ...med, sideEffects: updatedSideEffects };
        }
        return med;
      });
      
      setMedicationList(updatedList);
      setOpenSideEffectDialog(false);
      setCurrentSideEffect({ medication: null, effect: '' });
    } catch (error) {
      console.error('Error adding side effect:', error);
      setError('Failed to add side effect. Please try again.');
    }
  };

  const calculateAdherenceRate = (medication) => {
    if (!medication.adherence || medication.adherence.length === 0) return 100;
    
    const takenCount = medication.adherence.filter(a => a.taken).length;
    return Math.round((takenCount / medication.adherence.length) * 100);
  };

  const renderMedicationTable = () => (
    <TableContainer component={Paper} sx={{ mt: 2, borderRadius: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Medication</TableCell>
            <TableCell>Dosage</TableCell>
            <TableCell>Schedule</TableCell>
            <TableCell>Instructions</TableCell>
            <TableCell>Adherence</TableCell>
            <TableCell>Side Effects</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {medicationList.map((med) => (
            <TableRow key={med.id}>
              <TableCell>{med.name}</TableCell>
              <TableCell>{med.dosage}</TableCell>
              <TableCell>
                {med.frequency === 'daily' ? 'Daily at ' : 'Twice daily at '}
                {med.times && med.times.length > 0 
                  ? med.times.join(' and ') 
                  : med.time || 'Not specified'}
              </TableCell>
              <TableCell>{med.instructions}</TableCell>
              <TableCell>
                <Tooltip title={`${calculateAdherenceRate(med)}% taken as prescribed`}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={calculateAdherenceRate(med)} 
                        color={calculateAdherenceRate(med) > 80 ? "success" : 
                               calculateAdherenceRate(med) > 50 ? "warning" : "error"}
                        sx={{ height: 10, borderRadius: 5 }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {calculateAdherenceRate(med)}%
                    </Typography>
                  </Box>
                </Tooltip>
              </TableCell>
              <TableCell>
                {med.sideEffects && med.sideEffects.length > 0 ? (
                  <Box>
                    {med.sideEffects.map((effect, idx) => (
                      <Chip 
                        key={idx} 
                        label={effect} 
                        size="small" 
                        icon={<SideEffectIcon />} 
                        sx={{ m: 0.5 }} 
                      />
                    ))}
                    <IconButton size="small" onClick={() => handleAddSideEffect(med)}>
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ) : (
                  <Button 
                    size="small" 
                    startIcon={<AddIcon />} 
                    onClick={() => handleAddSideEffect(med)}
                  >
                    Add
                  </Button>
                )}
              </TableCell>
              <TableCell>
                <Box>
                  <IconButton size="small" onClick={() => handleEditMedication(med)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteMedication(med.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderInteractionWarnings = () => (
    <Card sx={{ mt: 3, mb: 3, borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <WarningIcon color="warning" sx={{ mr: 1 }} />
          <Typography variant="h6">Potential Medication Interactions</Typography>
        </Box>
        
        {optimizationResult?.potential_interactions?.length > 0 ? (
          <List>
            {optimizationResult.potential_interactions.map((interaction, idx) => (
              <ListItem key={idx}>
                <ListItemIcon>
                  <InteractionIcon color={interaction.severity === 'high' ? 'error' : 'warning'} />
                </ListItemIcon>
                <ListItemText 
                  primary={`${interaction.medications.join(' + ')}`} 
                  secondary={interaction.description} 
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography>No potential interactions detected between current medications.</Typography>
        )}
      </CardContent>
    </Card>
  );

  const renderAddEditDialog = (isEdit) => {
    const dialogData = isEdit ? selectedMedication : newMedication;
    const setDialogData = isEdit 
      ? (data) => setSelectedMedication({ ...selectedMedication, ...data }) 
      : (data) => setNewMedication({ ...newMedication, ...data });
    
    return (
      <Dialog 
        open={isEdit ? openEditDialog : openAddDialog} 
        onClose={() => isEdit ? setOpenEditDialog(false) : setOpenAddDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {isEdit ? 'Edit Medication' : 'Add New Medication'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Medication Name"
                value={dialogData.name}
                onChange={(e) => setDialogData({ name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Dosage"
                value={dialogData.dosage}
                onChange={(e) => setDialogData({ dosage: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Frequency</InputLabel>
                <Select
                  value={dialogData.frequency}
                  label="Frequency"
                  onChange={(e) => setDialogData({ frequency: e.target.value })}
                >
                  <MenuItem value="daily">Once Daily</MenuItem>
                  <MenuItem value="twice-daily">Twice Daily</MenuItem>
                  <MenuItem value="as-needed">As Needed</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <TimePicker
                  label="Time"
                  value={
                    typeof dialogData.time === 'string' && dialogData.time
                      ? parse(
                          (dialogData.time.includes(','))
                            ? dialogData.time.split(',')[0] 
                            : dialogData.time, 
                          'HH:mm', 
                          new Date()
                        )
                      : dialogData.time instanceof Date 
                        ? dialogData.time 
                        : new Date()
                  }
                  onChange={(newTime) => {
                    const formattedTime = format(new Date(newTime), 'HH:mm');
                    setDialogData({ 
                      time: dialogData.frequency === 'twice-daily' 
                        ? `${formattedTime},20:00` 
                        : formattedTime 
                    });
                  }}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Instructions"
                value={dialogData.instructions}
                onChange={(e) => setDialogData({ instructions: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={dialogData.startDate instanceof Date ? dialogData.startDate : (dialogData.startDate ? new Date(dialogData.startDate) : new Date())}
                  onChange={(newDate) => setDialogData({ startDate: newDate })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date (Optional)"
                  value={dialogData.endDate instanceof Date ? dialogData.endDate : (dialogData.endDate ? new Date(dialogData.endDate) : null)}
                  onChange={(newDate) => setDialogData({ endDate: newDate })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={dialogData.active} 
                    onChange={(e) => setDialogData({ active: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={dialogData.reminder} 
                    onChange={(e) => setDialogData({ reminder: e.target.checked })}
                  />
                }
                label="Set Reminders"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => isEdit ? setOpenEditDialog(false) : setOpenAddDialog(false)}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={isEdit ? handleUpdateMedication : handleSaveMedication}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const renderSideEffectDialog = () => (
    <Dialog
      open={openSideEffectDialog}
      onClose={() => setOpenSideEffectDialog(false)}
    >
      <DialogTitle>
        Add Side Effect for {currentSideEffect?.medication?.name}
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Side Effect Description"
          value={currentSideEffect.effect}
          onChange={(e) => setCurrentSideEffect({ ...currentSideEffect, effect: e.target.value })}
          margin="normal"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenSideEffectDialog(false)}>Cancel</Button>
        <Button 
          variant="contained" 
          onClick={handleSaveSideEffect}
          disabled={!currentSideEffect.effect}
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
          <MedicationIcon sx={{ mr: 1 }} />
          Smart Medication Management
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<SettingsIcon />} 
            onClick={() => setShowInteractions(!showInteractions)} 
            sx={{ mr: 1 }}
          >
            {showInteractions ? 'Hide Interactions' : 'Show Interactions'}
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={handleOptimizeMedications} 
            disabled={optimizationLoading}
            sx={{ mr: 1 }}
          >
            {optimizationLoading ? <CircularProgress size={24} /> : 'AI Optimize Schedule'}
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={handleAddMedication}
          >
            Add Medication
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {showAIOptimization && optimizationResult && (
        <Card sx={{ mb: 3, borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                AI-Optimized Medication Schedule
              </Typography>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={() => setShowAIOptimization(false)}
              >
                Hide
              </Button>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Recommended Schedule Changes:
                </Typography>
                <List>
                  {optimizationResult.optimized_schedule.map((item, idx) => (
                    <ListItem key={idx}>
                      <ListItemIcon>
                        <TimeIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary={`${item.name}: Change to ${item.suggested_time}`} 
                        secondary={item.reason} 
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Additional Recommendations:
                </Typography>
                <List>
                  {optimizationResult.recommendations.map((rec, idx) => (
                    <ListItem key={idx}>
                      <ListItemIcon>
                        <TipIcon />
                      </ListItemIcon>
                      <ListItemText primary={rec} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" startIcon={<SaveIcon />}>
                  Apply Changes
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {showInteractions && renderInteractionWarnings()}

      {loading && !medicationList.length ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        medicationList.length > 0 ? (
          renderMedicationTable()
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="body1" gutterBottom>
              No medications added yet.
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={handleAddMedication}
              sx={{ mt: 1 }}
            >
              Add Medication
            </Button>
          </Paper>
        )
      )}

      {/* Add/Edit Medication Dialog */}
      {renderAddEditDialog(false)}
      {selectedMedication && renderAddEditDialog(true)}
      
      {/* Side Effect Dialog */}
      {currentSideEffect.medication && renderSideEffectDialog()}
    </Box>
  );
};

export default MedicationManager; 