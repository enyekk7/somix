import axios from 'axios';

// Default to Railway backend in production
const API_BASE_URL = import.meta.env.VITE_API_BASE || 
  (import.meta.env.PROD ? 'https://somix-production.up.railway.app/api' : 'http://localhost:3001/api');

/**
 * Get mission progress for a user
 * @param {string} address - User wallet address
 * @returns {Promise<Object>} Mission progress data
 */
export async function getMissionProgress(address) {
  try {
    const response = await axios.get(`${API_BASE_URL}/missions/progress/${address}`);
    return response.data;
  } catch (error) {
    console.error('Error getting mission progress:', error);
    throw error;
  }
}

/**
 * Check and update mission progress
 * @param {string} address - User wallet address
 * @returns {Promise<Object>} Updated progress data
 */
export async function checkMissionProgress(address) {
  try {
    const response = await axios.post(`${API_BASE_URL}/missions/check-progress/${address}`);
    return response.data;
  } catch (error) {
    console.error('Error checking mission progress:', error);
    throw error;
  }
}

/**
 * Claim mission reward
 * @param {string} address - User wallet address
 * @param {string} missionId - Mission ID
 * @returns {Promise<Object>} Claim result
 */
export async function claimMissionReward(address, missionId) {
  try {
    const response = await axios.post(`${API_BASE_URL}/missions/claim/${address}/${missionId}`);
    return response.data;
  } catch (error) {
    console.error('Error claiming mission reward:', error);
    throw error;
  }
}

/**
 * Daily checkin
 * @param {string} address - User wallet address
 * @returns {Promise<Object>} Checkin result
 */
export async function dailyCheckin(address) {
  try {
    const response = await axios.post(`${API_BASE_URL}/missions/checkin/${address}`);
    return response.data;
  } catch (error) {
    console.error('Error checking in:', error);
    throw error;
  }
}

export default {
  getMissionProgress,
  checkMissionProgress,
  claimMissionReward,
  dailyCheckin
};
