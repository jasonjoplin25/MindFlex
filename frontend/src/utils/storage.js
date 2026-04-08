/**
 * Utilities for working with browser localStorage
 */

/**
 * Get an item from localStorage
 * @param {string} key - The key to retrieve
 * @returns {any} The parsed value or null if not found
 */
export const getLocalStorage = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error getting item ${key} from localStorage:`, error);
    return null;
  }
};

/**
 * Set an item in localStorage
 * @param {string} key - The key to set
 * @param {any} value - The value to store (will be JSON stringified)
 * @returns {boolean} True if successful, false otherwise
 */
export const setLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error setting item ${key} in localStorage:`, error);
    return false;
  }
};

/**
 * Remove an item from localStorage
 * @param {string} key - The key to remove
 * @returns {boolean} True if successful, false otherwise
 */
export const removeLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing item ${key} from localStorage:`, error);
    return false;
  }
};

/**
 * Clear all items from localStorage
 * @returns {boolean} True if successful, false otherwise
 */
export const clearLocalStorage = () => {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
}; 