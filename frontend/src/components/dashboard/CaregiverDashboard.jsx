import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Badge,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Insights as InsightsIcon,
  CalendarToday as CalendarIcon,
  Note as NoteIcon,
  Medication as MedicationIcon,
  Psychology as PsychologyIcon,
  SupportAgent as SupportAgentIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import PatientList from './PatientList';
import PatientProgress from './PatientProgress';
import PatientSettings from './PatientSettings';
import AddPatientDialog from './AddPatientDialog';
import PatientInsights from '../caregiver/PatientInsights';
import DailyCareplan from '../caregiver/DailyCareplan';
import PatientNotes from '../caregiver/PatientNotes';
import ReminderNotificationSystem from '../common/ReminderNotificationSystem';
import MoodTracking from '../caregiver/MoodTracking';
import MedicationManager from '../caregiver/MedicationManager';
import AppointmentManager from '../caregiver/AppointmentManager';
import AICareAssistant from '../caregiver/AICareAssistant';

const CaregiverDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [patientDetails, setPatientDetails] = useState(null);
  const [aiRecommendations, setAiRecommendations] = useState(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [stats, setStats] = useState({
    totalPatients: 0,
    activePatients: 0,
    totalSessions: 0,
    averageScore: 0,
    patientProgress: 0,
    pendingMedications: 0,
    upcomingAppointments: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch real patients from API
        const patientsResponse = await api.get('/caregiver/patients');
        const statsResponse = await api.get('/caregiver/stats');
        
        if (patientsResponse.data.success) {
          setPatients(patientsResponse.data.patients);
          
          // Set first patient as selected by default
          if (patientsResponse.data.patients.length > 0) {
            const firstPatient = patientsResponse.data.patients[0];
            setSelectedPatient(firstPatient);
            await fetchPatientDetails(firstPatient.id);
          }
        }
        
        if (statsResponse.data.success) {
          setStats(statsResponse.data.stats);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
        
        // Fallback to empty state
        setPatients([]);
        setStats({
          totalPatients: 0,
          activePatients: 0,
          totalSessions: 0,
          averageScore: 0,
          patientProgress: 0,
          pendingMedications: 0,
          upcomingAppointments: 0,
        });
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchPatientDetails = async (patientId) => {
    try {
      setLoading(true);
      
      // Fetch real patient details from API
      const response = await api.get(`/caregiver/patients/${patientId}`);
      
      if (response.data.success) {
        setPatientDetails(response.data.patient);
        await fetchAiRecommendations(patientId);
      } else {
        console.error('Failed to fetch patient details:', response.data.error);
      }
    } catch (error) {
      console.error('Error fetching patient details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAiRecommendations = async (patientId) => {
    try {
      setLoadingRecommendations(true);
      
      // Fetch AI recommendations from API
      const response = await api.get(`/caregiver/patients/${patientId}/recommendations`);
      
      if (response.data.success) {
        setAiRecommendations(response.data.recommendations);
      } else {
        setAiRecommendations('Unable to generate recommendations at this time.');
      }
    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
      setAiRecommendations('Unable to generate recommendations at this time.');
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    fetchPatientDetails(patient.id);
  };

  const handleAddPatient = async (patientData) => {
    try {
      // Add patient via API
      const response = await api.post('/caregiver/patients', patientData);
      
      if (response.data.success) {
        // Refresh patient list
        const patientsResponse = await api.get('/caregiver/patients');
        if (patientsResponse.data.success) {
          setPatients(patientsResponse.data.patients);
        }
        
        setShowAddPatient(false);
      } else {
        console.error('Failed to add patient:', response.data.error);
      }
    } catch (error) {
      console.error('Error adding patient:', error);
    }
  };

  if (loading && !patientDetails) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            Caregiver Dashboard
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowAddPatient(true)}
          >
            Add Patient
          </Button>
        </Box>

        {/* Dashboard Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Paper
                sx={{
                  p: 3,
                  background: 'rgba(19, 47, 76, 0.4)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <Typography variant="h6" gutterBottom>Total Patients</Typography>
                <Typography variant="h3">{stats.totalPatients}</Typography>
              </Paper>
            </motion.div>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Paper
                sx={{
                  p: 3,
                  background: 'rgba(19, 47, 76, 0.4)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <Typography variant="h6" gutterBottom>Patient Progress</Typography>
                <Typography variant="h3">{stats.patientProgress}%</Typography>
              </Paper>
            </motion.div>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Paper
                sx={{
                  p: 3,
                  background: 'rgba(19, 47, 76, 0.4)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <Typography variant="h6" gutterBottom>Medications</Typography>
                <Typography variant="h3">
                  <Badge badgeContent={stats.pendingMedications} color="error">
                    {stats.pendingMedications}
                  </Badge>
                </Typography>
              </Paper>
            </motion.div>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Paper
                sx={{
                  p: 3,
                  background: 'rgba(19, 47, 76, 0.4)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <Typography variant="h6" gutterBottom>Appointments</Typography>
                <Typography variant="h3">
                  <Badge badgeContent={stats.upcomingAppointments} color="primary">
                    {stats.upcomingAppointments}
                  </Badge>
                </Typography>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>

        {/* Main Content */}
        <Grid container spacing={3}>
          {/* Patient List */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Patients
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <PatientList 
                patients={patients} 
                selectedPatient={selectedPatient}
                onSelectPatient={handlePatientSelect}
              />
            </Paper>
          </Grid>
          
          {/* Patient Detail Area */}
          <Grid item xs={12} md={9}>
            <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
              {selectedPatient ? (
                <>
                  <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs 
                      value={activeTab} 
                      onChange={handleTabChange} 
                      variant="scrollable"
                      scrollButtons="auto"
                      sx={{ px: 2 }}
                    >
                      <Tab icon={<InsightsIcon />} label="Insights" />
                      <Tab icon={<CalendarIcon />} label="Daily Plan" />
                      <Tab icon={<NoteIcon />} label="Notes" />
                      <Tab icon={<AssessmentIcon />} label="Progress" />
                      <Tab icon={<PsychologyIcon />} label="Mood Tracking" />
                      <Tab icon={<MedicationIcon />} label="Medications" />
                      <Tab icon={<CalendarIcon />} label="Appointments" />
                      <Tab icon={<SupportAgentIcon />} label="AI Assistant" />
                      <Tab icon={<SettingsIcon />} label="Settings" />
                    </Tabs>
                  </Box>
                  
                  {/* Tab Panels */}
                  <Box sx={{ p: 3 }}>
                    {/* Insights Panel */}
                    {activeTab === 0 && (
                      <PatientInsights 
                        patientId={selectedPatient.id} 
                        patientData={patientDetails}
                        recommendations={aiRecommendations}
                        loadingRecommendations={loadingRecommendations}
                      />
                    )}
                    
                    {/* Daily Plan Panel */}
                    {activeTab === 1 && (
                      <DailyCareplan 
                        patientId={selectedPatient.id}
                        patientData={patientDetails}
                      />
                    )}
                    
                    {/* Notes Panel */}
                    {activeTab === 2 && (
                      <PatientNotes 
                        patientId={selectedPatient.id}
                      />
                    )}
                    
                    {/* Progress Panel */}
                    {activeTab === 3 && (
                      <PatientProgress 
                        patientId={selectedPatient.id}
                        patientData={patientDetails}
                      />
                    )}
                    
                    {/* Mood Tracking Panel */}
                    {activeTab === 4 && (
                      <MoodTracking 
                        patientId={selectedPatient.id}
                      />
                    )}
                    
                    {/* Medications Panel */}
                    {activeTab === 5 && (
                      <MedicationManager 
                        patientId={selectedPatient.id}
                        medications={patientDetails?.medications || []}
                      />
                    )}
                    
                    {/* Appointments Panel */}
                    {activeTab === 6 && (
                      <AppointmentManager 
                        patientId={selectedPatient.id}
                        appointments={patientDetails?.appointments || []}
                      />
                    )}
                    
                    {/* AI Assistant Panel */}
                    {activeTab === 7 && (
                      <AICareAssistant 
                        patientId={selectedPatient.id}
                        patientData={patientDetails}
                      />
                    )}
                    
                    {/* Settings Panel */}
                    {activeTab === 8 && (
                      <PatientSettings 
                        patientId={selectedPatient.id}
                        patientData={patientDetails}
                        onPatientUpdated={() => fetchPatientDetails(selectedPatient.id)}
                      />
                    )}
                  </Box>
                </>
              ) : (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary">
                    Select a patient to view details
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
      
      {/* Add Patient Dialog */}
      <AddPatientDialog 
        open={showAddPatient}
        onClose={() => setShowAddPatient(false)}
        onAdd={handleAddPatient}
      />
      
      {/* Reminder Notification System */}
      {selectedPatient && (
        <ReminderNotificationSystem patientId={selectedPatient.id} />
      )}
    </Container>
  );
};

export default CaregiverDashboard; 