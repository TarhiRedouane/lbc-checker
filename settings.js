// Import all module instances
import settingsCategories from './settings-categories.js';
import settingsGeneral from './settings-general.js';
import settingsNotes from './settings-notes.js';
import settingsReminders from './settings-reminders.js';
import { initDarkMode } from './darkmode.js';

// Initialize settings on DOM load
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize all settings modules
  await settingsCategories.loadCategories();
  await settingsGeneral.loadGeneralSettings();
  await settingsNotes.loadNotes();
  await settingsReminders.loadReminders();
  settingsReminders.setupEventHandlers();
  
  // Initialize notes auto-save
  settingsNotes.setupAutoSave();
  
  // Event listeners
  document.getElementById('save-settings').addEventListener('click', saveSettings);
  document.getElementById('back-to-popup').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openPopup' });
    window.close();
  });

  // Initialize dark mode with settings flag
  initDarkMode(false);
});

// Save all settings function
const saveSettings = async () => {
  // Get values from all modules
  const categories = settingsCategories.getCategories();
  const generalSettings = settingsGeneral.getGeneralSettings();
  const notes = settingsNotes.getNotes();
  const reminders = settingsReminders.getReminders();
  
  // Log the settings being saved
  console.log('Settings saved:', {
    sequentialMode: generalSettings.sequentialMode,
    openDelay: generalSettings.openDelay,
    reminders
  });

  // Save all settings to Chrome storage
  await new Promise(resolve => {
    chrome.storage.local.set({
      categories,
      sequentialMode: generalSettings.sequentialMode,
      openDelay: generalSettings.openDelay,
      notes,
      reminders
    }, resolve);
  });
  
  // Show saved message
  const savedMessage = document.getElementById('saved-message');
  savedMessage.style.display = 'block';
  setTimeout(() => {
    savedMessage.style.display = 'none';
  }, 3000);
  
  // Schedule reminders with alarms
  settingsReminders.scheduleReminders(reminders);
};