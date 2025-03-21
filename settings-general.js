// General settings module
window.SettingsGeneral = (() => {
  // Load general settings from storage
  const loadGeneralSettings = () => {
    chrome.storage.local.get(['sequentialMode', 'openDelay'], ({ sequentialMode, openDelay }) => {
      // Sequential mode toggle
      const sequentialModeToggle = document.getElementById('sequential-mode');
      sequentialModeToggle.checked = sequentialMode === true;
      
      // Open delay input
      const openDelayInput = document.getElementById('open-delay');
      openDelayInput.value = openDelay || 500; // Default to 500ms if not set

      console.log('Settings loaded:', {
        sequentialMode,
        openDelay: openDelay || 500
      });
    });

    // Add change event listeners for real-time logging
    document.getElementById('sequential-mode').addEventListener('change', (e) => {
      console.log('Sequential mode changed:', {
        sequentialMode: e.target.checked
      });
    });

    document.getElementById('open-delay').addEventListener('input', (e) => {
      console.log('Delay value changed:', {
        openDelay: parseInt(e.target.value, 10) || 0
      });
    });
  };

  // Get general settings from the DOM for saving
  const getGeneralSettings = () => ({
    sequentialMode: document.getElementById('sequential-mode').checked,
    openDelay: parseInt(document.getElementById('open-delay').value, 10) || 0
  });

  // Public API
  return {
    loadGeneralSettings,
    getGeneralSettings
  };
})();