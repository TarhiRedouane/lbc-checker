// Main settings controller that orchestrates all modules
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all settings modules
  window.SettingsCategories.loadCategories();
  window.SettingsGeneral.loadGeneralSettings();
  window.SettingsNotes.loadNotes();
  window.SettingsReminders.loadReminders();
  window.SettingsReminders.setupEventHandlers();
  
  // Initialize notes auto-save
  window.SettingsNotes.setupAutoSave();
  
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
function saveSettings() {
  // Get values from all modules
  const categories = window.SettingsCategories.getCategories();
  const generalSettings = window.SettingsGeneral.getGeneralSettings();
  const notes = window.SettingsNotes.getNotes();
  const reminders = window.SettingsReminders.getReminders();
  
  // Log the settings being saved
  console.log('Settings saved:', {
    sequentialMode: generalSettings.sequentialMode,
    openDelay: generalSettings.openDelay,
    reminders: reminders
  });

  // Save all settings to Chrome storage
  chrome.storage.local.set({
    categories,
    sequentialMode: generalSettings.sequentialMode,
    openDelay: generalSettings.openDelay,
    notes,
    reminders
  }, () => {
    // Show saved message
    const savedMessage = document.getElementById('saved-message');
    savedMessage.style.display = 'block';
    setTimeout(() => {
      savedMessage.style.display = 'none';
    }, 3000);
    
    // Schedule reminders with alarms
    window.SettingsReminders.scheduleReminders(reminders);
  });
}