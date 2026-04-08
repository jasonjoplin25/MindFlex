/**
 * API service for MindFlex frontend
 * Handles all API communication with the backend
 */
import axios from 'axios';

// API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const TOKEN_KEY = 'mindflex_token';
const REFRESH_TOKEN_KEY = 'mindflex_refresh_token';

export const tokenManager = {
  getAccessToken: () => localStorage.getItem(TOKEN_KEY),
  setAccessToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token) => localStorage.setItem(REFRESH_TOKEN_KEY, token),
  clearTokens: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
  setTokens: (accessToken, refreshToken) => {
    tokenManager.setAccessToken(accessToken);
    if (refreshToken) tokenManager.setRefreshToken(refreshToken);
  }
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = tokenManager.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken
        });

        const { access_token } = response.data;
        tokenManager.setAccessToken(access_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        tokenManager.clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API methods
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  uploadProfileImage: (formData) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    return api.post('/auth/upload-profile-image', formData, config);
  },
  changePassword: (currentPassword, newPassword) => 
    api.post('/auth/change-password', { current_password: currentPassword, new_password: newPassword }),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refresh_token: refreshToken }),
  verifyToken: () => api.get('/auth/verify'),
  getSessions: () => api.get('/auth/sessions')
};

// Schedule API endpoints
export const scheduleAPI = {
  getScheduleItems: () => api.get('/schedule/'),
  createScheduleItem: (data) => api.post('/schedule/', data),
  updateScheduleItem: (id, data) => api.put(`/schedule/${id}`, data),
  deleteScheduleItem: (id) => api.delete(`/schedule/${id}`),
  toggleScheduleItem: (id) => api.put(`/schedule/${id}/toggle`),
  reorderScheduleItems: (itemIds) => api.put('/schedule/reorder', { item_ids: itemIds }),
};

export const gamesAPI = {
  getGames: () => api.get('/games/'),
  getGame: (gameId) => api.get(`/games/${gameId}`),
  getGamesByType: (gameType) => api.get(`/games/type/${gameType}`),
  startSession: (gameId, difficulty) => 
    api.post('/games/sessions/start', { game_id: gameId, difficulty }),
  updateSession: (sessionId, data) => api.put(`/games/sessions/${sessionId}`, data),
  completeSession: (sessionId, finalScore, sessionData) => 
    api.post(`/games/sessions/${sessionId}/complete`, { final_score: finalScore, session_data: sessionData }),
  saveWin: (sessionId, winData) => 
    api.post(`/games/sessions/${sessionId}/save-win`, winData),
  getHistory: (limit = 10, gameType = null) => {
    const params = { limit };
    if (gameType) params.game_type = gameType;
    return api.get('/games/history', { params });
  },
  getLeaderboard: (gameId = null, difficulty = null, limit = 10, gameType = null) => {
    const params = { limit };
    if (gameId) params.game_id = gameId;
    if (difficulty) params.difficulty = difficulty;
    if (gameType) params.game_type = gameType;
    return api.get('/games/leaderboard', { params });
  },
  getStats: (timePeriodDays = 30) => api.get('/games/stats', { params: { time_period_days: timePeriodDays } }),
  // Mission Progress endpoints
  saveMissionProgress: (progressData) =>
    api.post('/games/mission-progress', progressData),
  getMissionProgress: (campaignType = null) => {
    const params = campaignType ? { campaign_type: campaignType } : {};
    return api.get('/games/mission-progress', { params });
  },
  checkMissionCompleted: (campaignType, missionNumber) =>
    api.get(`/games/mission-progress/check/${campaignType}/${missionNumber}`)
};

export const usersAPI = {
  getCurrentUser: () => api.get('/users/me'),
  updatePatientProfile: (data) => api.put('/users/me/patient-profile', data),
  updateCaregiverProfile: (data) => api.put('/users/me/caregiver-profile', data),
  getPreferences: () => api.get('/users/me/preferences'),
  updatePreferences: (preferences) => api.put('/users/me/preferences', preferences)
};

export const achievementsAPI = {
  getAchievements: () => api.get('/achievements/'),
  getUserAchievements: () => api.get('/achievements/user'),
  getUserAchievementStats: () => api.get('/achievements/user/stats'),
  getLeaderboard: () => api.get('/achievements/leaderboard')
};

export const caregiverAPI = {
  // Patient management
  getPatients: () => api.get('/caregiver/patients'),
  getPatientDetails: (patientId) => api.get(`/caregiver/patients/${patientId}`),
  addPatient: (patientData) => api.post('/caregiver/patients', patientData),
  updatePatient: (patientId, patientData) => api.put(`/caregiver/patients/${patientId}`, patientData),
  searchUsers: (query) => api.get('/caregiver/search-users', { params: { query } }),
  addExistingPatient: (userData) => api.post('/caregiver/add-existing-patient', userData),
  
  // Dashboard stats
  getStats: () => api.get('/caregiver/stats'),
  
  // AI-powered features
  getRecommendations: (patientId) => api.get(`/caregiver/patients/${patientId}/recommendations`),
  analyzePatient: (patientId) => api.post(`/caregiver/patients/${patientId}/analyze`),
  generateDailyPlan: (patientId, constraints) => api.post(`/caregiver/patients/${patientId}/daily-plan`, constraints),
  optimizeMedications: (patientId) => api.post(`/caregiver/patients/${patientId}/optimize-medications`),
  generateAppointmentPreparation: (patientId, appointmentId) => api.post(`/caregiver/patients/${patientId}/appointments/${appointmentId}/prepare`),

  // Patient routines
  getPatientRoutines: (patientId, routineType) => api.get(`/caregiver/patients/${patientId}/routines/${routineType}`),
  savePatientRoutine: (patientId, routineData) => api.post(`/caregiver/patients/${patientId}/routines`, routineData),
  
  // Medication management
  getPatientMedications: (patientId) => api.get(`/caregiver/patients/${patientId}/medications`),
  addPatientMedication: (patientId, medicationData) => api.post(`/caregiver/patients/${patientId}/medications`, medicationData),
  updatePatientMedication: (patientId, medicationId, medicationData) => 
    api.put(`/caregiver/patients/${patientId}/medications/${medicationId}`, medicationData),
  deletePatientMedication: (patientId, medicationId) => api.delete(`/caregiver/patients/${patientId}/medications/${medicationId}`),
  updateMedicationAdherence: (patientId, medicationId, date, taken) => 
    api.post(`/caregiver/patients/${patientId}/medications/${medicationId}/adherence`, { date, taken }),
  addMedicationSideEffect: (patientId, medicationId, sideEffect) => 
    api.post(`/caregiver/patients/${patientId}/medications/${medicationId}/side-effects`, { side_effect: sideEffect }),
  
  // Appointment management
  getPatientAppointments: (patientId) => api.get(`/caregiver/patients/${patientId}/appointments`),
  addPatientAppointment: (patientId, appointmentData) => api.post(`/caregiver/patients/${patientId}/appointments`, appointmentData),
  updatePatientAppointment: (patientId, appointmentId, appointmentData) => 
    api.put(`/caregiver/patients/${patientId}/appointments/${appointmentId}`, appointmentData),
  deletePatientAppointment: (patientId, appointmentId) => api.delete(`/caregiver/patients/${patientId}/appointments/${appointmentId}`),
  updateAppointmentStatus: (patientId, appointmentId, status) => 
    api.patch(`/caregiver/patients/${patientId}/appointments/${appointmentId}/status`, { status }),
  updateAppointmentSummary: (patientId, appointmentId, summary) => 
    api.patch(`/caregiver/patients/${patientId}/appointments/${appointmentId}/summary`, { summary }),
  
  // Notes management
  getPatientNotes: (patientId) => api.get(`/caregiver/patients/${patientId}/notes`),
  addPatientNote: (patientId, noteData) => api.post(`/caregiver/patients/${patientId}/notes`, noteData),
  updatePatientNote: (patientId, noteId, noteData) => api.put(`/caregiver/patients/${patientId}/notes/${noteId}`, noteData),
  deletePatientNote: (patientId, noteId) => api.delete(`/caregiver/patients/${patientId}/notes/${noteId}`),
  
  // Reminder management
  getPatientReminders: (patientId) => api.get(`/caregiver/patients/${patientId}/reminders`),
  createReminder: (patientId, reminderData) => api.post(`/caregiver/patients/${patientId}/reminders`, reminderData),
  updateReminder: (patientId, reminderId, reminderData) => api.put(`/caregiver/patients/${patientId}/reminders/${reminderId}`, reminderData),
  deleteReminder: (patientId, reminderId) => api.delete(`/caregiver/patients/${patientId}/reminders/${reminderId}`),
  toggleReminder: (patientId, reminderId) => api.post(`/caregiver/patients/${patientId}/reminders/${reminderId}/toggle`),
  
  // Mood tracking
  getMoodTracking: (patientId) => api.get(`/caregiver/patients/${patientId}/mood-tracking`),
  addMoodEntry: (patientId, moodData) => api.post(`/caregiver/patients/${patientId}/mood-tracking`, moodData),
  updateMoodEntry: (patientId, moodId, moodData) => api.put(`/caregiver/patients/${patientId}/mood-tracking/${moodId}`, moodData),
  deleteMoodEntry: (patientId, moodId) => api.delete(`/caregiver/patients/${patientId}/mood-tracking/${moodId}`),
  
  // AI Chat Assistant
  getChatHistory: (patientId) => api.get(`/caregiver/patients/${patientId}/chat-history`),
  sendChatMessage: (patientId, message) => api.post(`/caregiver/patients/${patientId}/chat`, { message }),
  clearChatHistory: (patientId) => api.delete(`/caregiver/patients/${patientId}/chat-history`),
  getPatientContext: (patientId) => api.get(`/caregiver/patients/${patientId}/context`),
  saveConversation: (conversationData) => api.post('/caregiver/conversations', conversationData),
  
  // Patient Settings
  updatePatientSettings: (patientId, settingsData) => api.put(`/caregiver/patients/${patientId}/settings`, settingsData),
  
  // User search
  searchUsers: (query) => api.get('/caregiver/search-users', { params: { query } })
};

export const assessmentAPI = {
  // Save raw assessment results to the backend
  save: (scores, rawResults) =>
    api.post('/assessment/save', { scores, raw_results: rawResults }),

  // Get AI interpretation of scores
  interpret: (scores, patientProfile) =>
    api.post('/assessment/interpret', { scores, patient_profile: patientProfile }),

  // Get a personalised 4-week improvement plan
  getImprovementPlan: (scores, patientProfile, gameHistory) =>
    api.post('/assessment/improvement-plan', { scores, patient_profile: patientProfile, game_history: gameHistory }),

  // Caregiver: get assessment history for a patient
  getHistory: (patientId) =>
    api.get(`/assessment/history/${patientId}`),

  // Caregiver: get progress trend analysis
  getTrends: (patientId) =>
    api.get(`/assessment/trends/${patientId}`),

  // Caregiver: generate a full assessment report
  generateReport: (patientId) =>
    api.post(`/assessment/report/${patientId}`),

  // Caregiver: get comprehensive AI insights (combines all data)
  getCaregiverInsights: (patientId) =>
    api.get(`/assessment/caregiver/insights/${patientId}`),
};

// Utility functions
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.error || error.response.data?.message || 'Server error';
    return { error: message, status: error.response.status };
  } else if (error.request) {
    // Request made but no response
    return { error: 'Network error - please check your connection', status: 0 };
  } else {
    // Something else went wrong
    return { error: error.message || 'Unknown error occurred', status: 0 };
  }
};

export const isAuthenticated = () => {
  const token = tokenManager.getAccessToken();
  if (!token) return false;
  
  try {
    // Check if token is expired (simple check)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export { api };
export default api;