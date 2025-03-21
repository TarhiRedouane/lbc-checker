// Notes module for managing user notes
window.SettingsNotes = (function() {
  // Load notes from storage
  function loadNotes() {
    chrome.storage.local.get(['notes'], (result) => {
      const notesTextarea = document.getElementById('notes-content');
      if (result.notes) {
        notesTextarea.value = result.notes;
      }
    });
  }

  // Setup auto-save functionality for notes
  function setupAutoSave() {
    const notesTextarea = document.getElementById('notes-content');
    const autoSaveIndicator = document.getElementById('auto-save-indicator');
    let saveTimeout;

    notesTextarea.addEventListener('input', () => {
      // Clear any pending save
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }

      // Set a new timeout to save after 500ms of no typing
      saveTimeout = setTimeout(() => {
        chrome.storage.local.set({ notes: notesTextarea.value }, () => {
          // Show save indicator
          autoSaveIndicator.style.display = 'flex';
          // Hide it after 2 seconds
          setTimeout(() => {
            autoSaveIndicator.style.display = 'none';
          }, 2000);
        });
      }, 500);
    });
  }

  // Get notes content
  function getNotes() {
    return document.getElementById('notes-content').value;
  }
  
  // Public API
  return {
    loadNotes,
    setupAutoSave,
    getNotes
  };
})();