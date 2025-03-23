// Dark mode management class
export class DarkMode {
  constructor(isPopup = false) {
    this.modeToggle = document.getElementById('mode-toggle');
    this.body = document.body;
    this.isPopup = isPopup;
  }

  async initialize() {
    // Load user preference from storage
    const { darkMode = false } = await this.getStorageData(['darkMode']);
    this.applyTheme(darkMode);
    this.setupEventListeners();
  }

  applyTheme(isDark) {
    if (isDark) {
      this.body.classList.remove('light-mode');
      this.body.classList.add('dark-mode');
      this.modeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      this.body.classList.add('light-mode');
      this.body.classList.remove('dark-mode');
      this.modeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
  }

  setupEventListeners() {
    this.modeToggle.addEventListener('click', () => {
      const isCurrentlyLight = this.body.classList.contains('light-mode');
      this.applyTheme(isCurrentlyLight);
      chrome.storage.local.set({ darkMode: isCurrentlyLight });
    });
  }

  getStorageData(keys) {
    return new Promise(resolve => {
      chrome.storage.local.get(keys, resolve);
    });
  }

  static getInstance(isPopup = false) {
    if (!this.instance) {
      this.instance = new DarkMode(isPopup);
    }
    return this.instance;
  }
}

// Helper function to initialize dark mode
export const initDarkMode = (isPopup = false) => {
  const darkMode = DarkMode.getInstance(isPopup);
  darkMode.initialize();
};