import api from './api';

class CustomMissionService {
  // Create a new custom mission
  async createMission(missionData) {
    try {
      const response = await api.post('/games/missions', missionData);
      return { data: response.data, error: null };
    } catch (error) {
      console.error('Error creating custom mission:', error);
      return { data: null, error: error.response?.data?.error || 'Failed to create mission' };
    }
  }

  // Get user's custom missions
  async getUserMissions(includePublic = false) {
    try {
      const response = await api.get(`/games/missions?include_public=${includePublic}`);
      return { data: response.data.missions, error: null };
    } catch (error) {
      console.error('Error fetching custom missions:', error);
      return { data: null, error: error.response?.data?.error || 'Failed to fetch missions' };
    }
  }

  // Get a specific custom mission
  async getMission(missionId) {
    try {
      const response = await api.get(`/games/missions/${missionId}`);
      return { data: response.data.mission, error: null };
    } catch (error) {
      console.error('Error fetching custom mission:', error);
      return { data: null, error: error.response?.data?.error || 'Failed to fetch mission' };
    }
  }

  // Update a custom mission
  async updateMission(missionId, updateData) {
    try {
      const response = await api.put(`/games/missions/${missionId}`, updateData);
      return { data: response.data.mission, error: null };
    } catch (error) {
      console.error('Error updating custom mission:', error);
      return { data: null, error: error.response?.data?.error || 'Failed to update mission' };
    }
  }

  // Delete a custom mission
  async deleteMission(missionId) {
    try {
      await api.delete(`/games/missions/${missionId}`);
      return { error: null };
    } catch (error) {
      console.error('Error deleting custom mission:', error);
      return { error: error.response?.data?.error || 'Failed to delete mission' };
    }
  }

  // Migrate localStorage missions to database
  async migrateFromLocalStorage() {
    try {
      const localStorageMissions = localStorage.getItem('customMissions');
      if (!localStorageMissions) {
        return { data: { migrated_count: 0, message: 'No localStorage missions found' }, error: null };
      }

      const missions = JSON.parse(localStorageMissions);
      const response = await api.post('/games/missions/migrate-from-localStorage', { missions });
      
      // Clear localStorage after successful migration
      if (response.data.migrated_count > 0) {
        localStorage.removeItem('customMissions');
      }

      return { data: response.data, error: null };
    } catch (error) {
      console.error('Error migrating missions:', error);
      return { data: null, error: error.response?.data?.error || 'Failed to migrate missions' };
    }
  }

  // Extract animal type from grid data
  extractAnimalType(gridData) {
    const animalTypes = [
      'turtle', 'ladybug', 'spider', 'butterfly', 'bee', 'feather', 'penguin',
      'flamingo', 'owl', 'parrot', 'swan', 'lobster', 'lizard', 'squirrel',
      'rabbit', 'hedgehog', 'mouse', 'skunk', 'cat', 'monkey', 'poodle'
    ];

    for (const row of gridData) {
      for (const cell of row) {
        if (animalTypes.includes(cell)) {
          return cell;
        }
      }
    }
    return 'turtle'; // default
  }
}

export default new CustomMissionService();