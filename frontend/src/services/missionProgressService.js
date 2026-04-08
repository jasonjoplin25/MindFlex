import { gamesAPI, handleApiError } from './api';

class MissionProgressService {
  
  async saveMissionProgress(campaignType, missionNumber, score = 0, durationSeconds = 0, sessionData = null) {
    try {
      const progressData = {
        campaign_type: campaignType,
        mission_number: missionNumber,
        score,
        duration_seconds: durationSeconds,
        session_data: sessionData
      };

      console.log('Saving mission progress:', progressData);
      const response = await gamesAPI.saveMissionProgress(progressData);
      console.log('Mission progress saved successfully:', response.data);
      return { data: response.data, error: null };
    } catch (error) {
      console.error('Error saving mission progress:', error);
      const apiError = handleApiError(error);
      return { data: null, error: apiError };
    }
  }

  async getMissionProgress(campaignType = null) {
    try {
      const response = await gamesAPI.getMissionProgress(campaignType);
      console.log('Mission progress loaded:', response.data);
      return { data: response.data, error: null };
    } catch (error) {
      console.error('Error loading mission progress:', error);
      const apiError = handleApiError(error);
      return { data: null, error: apiError };
    }
  }

  async checkMissionCompleted(campaignType, missionNumber) {
    try {
      const response = await gamesAPI.checkMissionCompleted(campaignType, missionNumber);
      return { data: response.data, error: null };
    } catch (error) {
      console.error('Error checking mission completion:', error);
      const apiError = handleApiError(error);
      return { data: null, error: apiError };
    }
  }

  // Helper method to get completed missions for a campaign
  getCompletedMissionsForCampaign(progressData, campaignType) {
    if (!progressData || !progressData.progress) {
      return [];
    }
    
    const campaignProgress = progressData.progress[campaignType];
    if (!campaignProgress) {
      return [];
    }

    return campaignProgress.map(mission => mission.mission_number).sort((a, b) => a - b);
  }

  // Helper method to check if a specific mission is completed from progress data
  isMissionCompleted(progressData, campaignType, missionNumber) {
    const completedMissions = this.getCompletedMissionsForCampaign(progressData, campaignType);
    return completedMissions.includes(missionNumber);
  }

  // Helper method to get the highest completed mission number for a campaign
  getHighestCompletedMission(progressData, campaignType) {
    const completedMissions = this.getCompletedMissionsForCampaign(progressData, campaignType);
    return completedMissions.length > 0 ? Math.max(...completedMissions) : 0;
  }

  // Helper method to get the next unlocked mission (highest completed + 1, or 1 if none completed)
  getNextUnlockedMission(progressData, campaignType) {
    const highest = this.getHighestCompletedMission(progressData, campaignType);
    return Math.min(highest + 1, 10); // Max 10 missions
  }
}

// Create singleton instance
const missionProgressService = new MissionProgressService();

export default missionProgressService;
export { MissionProgressService };