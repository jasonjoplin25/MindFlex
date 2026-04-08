/**
 * Shuffles an array using the Fisher-Yates algorithm
 * @param {Array} array - The array to shuffle
 * @returns {Array} - The shuffled array
 */
export const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

/**
 * Generates a random integer between min and max (inclusive)
 * @param {number} min - The minimum value
 * @param {number} max - The maximum value
 * @returns {number} - A random integer
 */
export const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Formats time in milliseconds to MM:SS format
 * @param {number} milliseconds - Time in milliseconds
 * @returns {string} - Formatted time string
 */
export const formatTime = (milliseconds) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Calculates a score based on time, accuracy, and difficulty
 * @param {number} timeMs - Time taken in milliseconds
 * @param {number} accuracy - Accuracy percentage (0-100)
 * @param {number} difficulty - Difficulty multiplier (1-3)
 * @returns {number} - Calculated score
 */
export const calculateScore = (timeMs, accuracy, difficulty) => {
  // Base score calculation
  const timeScore = Math.max(0, 30000 - timeMs) / 300; // Time component
  const accuracyScore = accuracy * difficulty; // Accuracy component
  
  // Combine components with weights
  const score = Math.round((timeScore * 0.4) + (accuracyScore * 0.6));
  
  return Math.max(0, score); // Ensure score is not negative
};

/**
 * Generates a random color in hex format
 * @returns {string} - Hex color code
 */
export const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

/**
 * Checks if two arrays have the same elements (order doesn't matter)
 * @param {Array} arr1 - First array
 * @param {Array} arr2 - Second array
 * @returns {boolean} - True if arrays have the same elements
 */
export const arraysMatch = (arr1, arr2) => {
  if (arr1.length !== arr2.length) return false;
  
  const sortedArr1 = [...arr1].sort();
  const sortedArr2 = [...arr2].sort();
  
  return sortedArr1.every((element, index) => element === sortedArr2[index]);
};

/**
 * Delays execution for a specified time
 * @param {number} ms - Time to delay in milliseconds
 * @returns {Promise} - Promise that resolves after the delay
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generates a unique ID
 * @returns {string} - Unique ID
 */
export const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}; 