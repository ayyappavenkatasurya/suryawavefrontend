// frontend/src/utils/storage.js

/**
 * @file Centralized utility for safe interaction with localStorage.
 * This prevents crashes when the browser's privacy settings block storage access.
 */

const isStorageAvailable = (() => {
  try {
    const testKey = '__test_storage_availability__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    console.warn('localStorage is not available. The session will not persist across tabs/reloads.');
    return false;
  }
})();

/**
 * Safely retrieves an item from localStorage.
 * @param {string} key The key of the item to retrieve.
 * @returns {string|null} The item's value, or null if storage is unavailable or the item doesn't exist.
 */
export const safeGetLocalStorage = (key) => {
  if (!isStorageAvailable) return null;
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`Could not get item "${key}" from localStorage:`, error);
    return null;
  }
};

/**
 * Safely sets an item in localStorage.
 * @param {string} key The key of the item to set.
 * @param {string} value The value to set.
 */
export const safeSetLocalStorage = (key, value) => {
  if (!isStorageAvailable) return;
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`Could not set item "${key}" in localStorage:`, error);
  }
};

/**
 * Safely removes an item from localStorage.
 * @param {string} key The key of the item to remove.
 */
export const safeRemoveLocalStorage = (key) => {
  if (!isStorageAvailable) return;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Could not remove item "${key}" from localStorage:`, error);
  }
};