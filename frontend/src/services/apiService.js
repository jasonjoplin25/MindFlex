/**
 * Legacy API service - deprecated in favor of services/api.js
 * This file provides backward compatibility for existing components
 */
import { gamesAPI, caregiverAPI } from './api';

// Game API functions (backward compatibility)
export const gameApi = {
  getGames: async () => {
    const response = await gamesAPI.getGames();
    return response.data;
  },
  
  getGameById: async (gameId) => {
    const response = await gamesAPI.getGame(gameId);
    return response.data;
  },
  
  logScore: async (scoreData) => {
    console.warn('gameApi.logScore is deprecated. Use GameSessionManager from gameService.js');
    // Legacy compatibility - map to session completion
    const response = await gamesAPI.completeSession(scoreData.sessionId, scoreData.score, scoreData);
    return response.data;
  },
  
  getGameHistory: async () => {
    const response = await gamesAPI.getHistory();
    return response.data;
  },
  
  getAnalytics: async (patientId, gameType, timePeriod) => {
    console.warn('gameApi.getAnalytics is deprecated. Use gamesAPI.getStats');
    const response = await gamesAPI.getStats(30); // Default to 30 days
    return response.data;
  },
};

// Placeholder APIs for features not yet implemented in the new backend
export const therapyApi = {
  getCategories: async () => {
    console.warn('Therapy API not yet implemented in new backend');
    return [];
  },
  getSoundsByCategory: async () => [],
  getSoundById: async () => null,
  getRecommendations: async () => [],
  logSession: async () => ({ success: false, message: 'Not implemented' }),
};

export const caregiverApi = {
  // Patient management
  getPatients: async () => {
    const response = await caregiverAPI.getPatients();
    return response.data;
  },
  
  getPatientDetails: async (patientId) => {
    const response = await caregiverAPI.getPatientDetails(patientId);
    return response.data;
  },
  
  addPatient: async (patientData) => {
    const response = await caregiverAPI.addPatient(patientData);
    return response.data;
  },
  
  updatePatient: async (patientId, patientData) => {
    const response = await caregiverAPI.updatePatient(patientId, patientData);
    return response.data;
  },
  
  searchUsers: async (query) => {
    const response = await caregiverAPI.searchUsers(query);
    return response.data;
  },
  
  addExistingPatient: async (userData) => {
    const response = await caregiverAPI.addExistingPatient(userData);
    return response.data;
  },
  
  // Dashboard and analytics
  getStats: async () => {
    const response = await caregiverAPI.getStats();
    return response.data;
  },
  
  // Reminder system
  getPatientReminders: async (patientId) => {
    const response = await caregiverAPI.getPatientReminders(patientId);
    return response.data;
  },

  createReminder: async (patientId, reminderData) => {
    const response = await caregiverAPI.createReminder(patientId, reminderData);
    return response.data;
  },

  updateReminder: async (patientId, reminderId, reminderData) => {
    const response = await caregiverAPI.updateReminder(patientId, reminderId, reminderData);
    return response.data;
  },

  deleteReminder: async (patientId, reminderId) => {
    const response = await caregiverAPI.deleteReminder(patientId, reminderId);
    return response.data;
  },

  toggleReminder: async (patientId, reminderId) => {
    const response = await caregiverAPI.toggleReminder(patientId, reminderId);
    return response.data;
  },

  // AI-powered features
  analyzePatient: async (patientId) => {
    const response = await caregiverAPI.analyzePatient(patientId);
    return response.data;
  },
  
  generateDailyPlan: async (patientId, constraints) => {
    const response = await caregiverAPI.generateDailyPlan(patientId, constraints);
    return response.data;
  },

  // Patient routines management
  getPatientRoutines: async (patientId, routineType) => {
    const response = await caregiverAPI.getPatientRoutines(patientId, routineType);
    return response.data;
  },

  savePatientRoutine: async (patientId, routineData) => {
    const response = await caregiverAPI.savePatientRoutine(patientId, routineData);
    return response.data;
  },
  
  getRecommendations: async (patientId) => {
    const response = await caregiverAPI.getRecommendations(patientId);
    return response.data;
  },
  
  // Medication management
  getPatientMedications: async (patientId) => {
    const response = await caregiverAPI.getPatientMedications(patientId);
    return response.data;
  },
  
  addPatientMedication: async (patientId, medicationData) => {
    const response = await caregiverAPI.addPatientMedication(patientId, medicationData);
    return response.data;
  },
  
  updatePatientMedication: async (patientId, medicationId, medicationData) => {
    const response = await caregiverAPI.updatePatientMedication(patientId, medicationId, medicationData);
    return response.data;
  },
  
  deletePatientMedication: async (patientId, medicationId) => {
    const response = await caregiverAPI.deletePatientMedication(patientId, medicationId);
    return response.data;
  },
  
  optimizeMedications: async (patientId) => {
    const response = await caregiverAPI.optimizeMedications(patientId);
    return response.data;
  },
  
  updateMedicationAdherence: async (patientId, medicationId, date, taken) => {
    const response = await caregiverAPI.updateMedicationAdherence(patientId, medicationId, date, taken);
    return response.data;
  },
  
  addMedicationSideEffect: async (patientId, medicationId, sideEffect) => {
    const response = await caregiverAPI.addMedicationSideEffect(patientId, medicationId, sideEffect);
    return response.data;
  },
  
  // Appointment management
  getPatientAppointments: async (patientId) => {
    const response = await caregiverAPI.getPatientAppointments(patientId);
    return response.data;
  },
  
  addPatientAppointment: async (patientId, appointmentData) => {
    const response = await caregiverAPI.addPatientAppointment(patientId, appointmentData);
    return response.data;
  },
  
  updatePatientAppointment: async (patientId, appointmentId, appointmentData) => {
    const response = await caregiverAPI.updatePatientAppointment(patientId, appointmentId, appointmentData);
    return response.data;
  },
  
  deletePatientAppointment: async (patientId, appointmentId) => {
    const response = await caregiverAPI.deletePatientAppointment(patientId, appointmentId);
    return response.data;
  },
  
  updateAppointmentStatus: async (patientId, appointmentId, status) => {
    const response = await caregiverAPI.updateAppointmentStatus(patientId, appointmentId, status);
    return response.data;
  },
  
  updateAppointmentSummary: async (patientId, appointmentId, summary) => {
    const response = await caregiverAPI.updateAppointmentSummary(patientId, appointmentId, summary);
    return response.data;
  },
  
  generateAppointmentPreparation: async (patientId, appointmentId) => {
    const response = await caregiverAPI.generateAppointmentPreparation(patientId, appointmentId);
    return response.data;
  },
  
  // Notes management
  getPatientNotes: async (patientId) => {
    const response = await caregiverAPI.getPatientNotes(patientId);
    return response.data;
  },
  
  addPatientNote: async (patientId, noteData) => {
    const response = await caregiverAPI.addPatientNote(patientId, noteData);
    return response.data;
  },
  
  updatePatientNote: async (patientId, noteId, noteData) => {
    const response = await caregiverAPI.updatePatientNote(patientId, noteId, noteData);
    return response.data;
  },
  
  deletePatientNote: async (patientId, noteId) => {
    const response = await caregiverAPI.deletePatientNote(patientId, noteId);
    return response.data;
  },
  
  // Mood tracking
  getMoodTracking: async (patientId) => {
    const response = await caregiverAPI.getMoodTracking(patientId);
    return response.data;
  },
  
  addMoodEntry: async (patientId, moodData) => {
    const response = await caregiverAPI.addMoodEntry(patientId, moodData);
    return response.data;
  },
  
  updateMoodEntry: async (patientId, moodId, moodData) => {
    const response = await caregiverAPI.updateMoodEntry(patientId, moodId, moodData);
    return response.data;
  },
  
  deleteMoodEntry: async (patientId, moodId) => {
    const response = await caregiverAPI.deleteMoodEntry(patientId, moodId);
    return response.data;
  },
  
  // AI Chat Assistant
  getChatHistory: async (patientId) => {
    const response = await caregiverAPI.getChatHistory(patientId);
    return response.data;
  },
  
  sendChatMessage: async (patientId, message) => {
    const response = await caregiverAPI.sendChatMessage(patientId, message);
    return response.data;
  },
  
  clearChatHistory: async (patientId) => {
    const response = await caregiverAPI.clearChatHistory(patientId);
    return response.data;
  },
  
  // Patient context for AI assistant
  getPatientContext: async (patientId) => {
    const response = await caregiverAPI.getPatientContext(patientId);
    return response.data;
  },

  // User search for adding existing patients
  searchUsers: async (query) => {
    const response = await caregiverAPI.searchUsers(query);
    return response.data;
  },
  
  // Patient Settings
  updatePatientSettings: async (patientId, settingsData) => {
    const response = await caregiverAPI.updatePatientSettings(patientId, settingsData);
    return response.data;
  },
  
  // Legacy compatibility methods
  getMedications: async (patientId) => {
    return await caregiverApi.getPatientMedications(patientId);
  },
  
  addMedication: async (patientId, medicationData) => {
    return await caregiverApi.addPatientMedication(patientId, medicationData);
  },
  
  updateMedication: async (patientId, medicationId, medicationData) => {
    return await caregiverApi.updatePatientMedication(patientId, medicationId, medicationData);
  },
  
  deleteMedication: async (patientId, medicationId) => {
    return await caregiverApi.deletePatientMedication(patientId, medicationId);
  },
  
  getAppointments: async (patientId) => {
    return await caregiverApi.getPatientAppointments(patientId);
  },
  
  addAppointment: async (patientId, appointmentData) => {
    return await caregiverApi.addPatientAppointment(patientId, appointmentData);
  },
  
  updateAppointment: async (patientId, appointmentId, appointmentData) => {
    return await caregiverApi.updatePatientAppointment(patientId, appointmentId, appointmentData);
  },
  
  deleteAppointment: async (patientId, appointmentId) => {
    return await caregiverApi.deletePatientAppointment(patientId, appointmentId);
  },
  
  getNotes: async (patientId) => {
    return await caregiverApi.getPatientNotes(patientId);
  },
  
  addNote: async (patientId, noteData) => {
    return await caregiverApi.addPatientNote(patientId, noteData);
  },
  
  getPatientProgress: async (patientId) => {
    // This would map to patient details or a specific progress endpoint
    const patientDetails = await caregiverApi.getPatientDetails(patientId);
    return patientDetails?.game_history || [];
  },
  
  addProgressEntry: async (patientId, progressData) => {
    // This might be handled through the games API instead
    console.warn('addProgressEntry: Use gamesAPI for recording game progress');
    return { success: false, message: 'Use gamesAPI for recording game progress' };
  }
}; 