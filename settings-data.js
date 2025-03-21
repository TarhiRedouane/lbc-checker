// Import default categories from shared file
// This file will set window.LBC_DEFAULT_CATEGORIES with the default categories data

// Export the data for use in other modules
window.SettingsData = {
  get defaultCategories() {
    return window.LBC_DEFAULT_CATEGORIES || {};
  }
};