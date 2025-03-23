// General settings class
export class SettingsGeneral {
  constructor() {
    this.sequentialModeToggle = document.getElementById('sequential-mode');
    this.openDelayInput = document.getElementById('open-delay');
    this.setupEventListeners();
  }

  async loadGeneralSettings() {
    const { sequentialMode, openDelay } = await this.getStorageData(['sequentialMode', 'openDelay']);
    
    // Sequential mode toggle
    this.sequentialModeToggle.checked = sequentialMode === true;
    
    // Open delay input
    this.openDelayInput.value = openDelay || 500; // Default to 500ms if not set

    console.log('Settings loaded:', {
      sequentialMode,
      openDelay: openDelay || 500
    });
  }

  setupEventListeners() {
    this.sequentialModeToggle.addEventListener('change', (e) => {
      console.log('Sequential mode changed:', {
        sequentialMode: e.target.checked
      });
    });

    this.openDelayInput.addEventListener('input', (e) => {
      console.log('Delay value changed:', {
        openDelay: parseInt(e.target.value, 10) || 0
      });
    });
  }

  getGeneralSettings() {
    return {
      sequentialMode: this.sequentialModeToggle.checked,
      openDelay: parseInt(this.openDelayInput.value, 10) || 0
    };
  }

  getStorageData(keys) {
    return new Promise(resolve => {
      chrome.storage.local.get(keys, resolve);
    });
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new SettingsGeneral();
    }
    return this.instance;
  }
}

// Create singleton instance
const settingsGeneral = SettingsGeneral.getInstance();
export default settingsGeneral;