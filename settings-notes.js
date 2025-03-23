// Notes management class
export class SettingsNotes {
  constructor() {
    this.notesTextarea = document.getElementById('notes-content');
    this.autoSaveIndicator = document.getElementById('auto-save-indicator');
    this.saveTimeout = null;
  }

  async loadNotes() {
    const { notes } = await this.getStorageData(['notes']);
    if (notes) {
      this.notesTextarea.value = notes;
    }
  }

  setupAutoSave() {
    this.notesTextarea.addEventListener('input', () => {
      // Clear any pending save
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
      }

      // Set a new timeout to save after 500ms of no typing
      this.saveTimeout = setTimeout(() => {
        chrome.storage.local.set({ notes: this.notesTextarea.value }, () => {
          // Show save indicator
          this.autoSaveIndicator.style.display = 'flex';
          // Hide it after 2 seconds
          setTimeout(() => {
            this.autoSaveIndicator.style.display = 'none';
          }, 2000);
        });
      }, 500);
    });
  }

  getNotes() {
    return this.notesTextarea.value;
  }

  getStorageData(keys) {
    return new Promise(resolve => {
      chrome.storage.local.get(keys, resolve);
    });
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new SettingsNotes();
    }
    return this.instance;
  }
}

// Create singleton instance
const settingsNotes = SettingsNotes.getInstance();
export default settingsNotes;