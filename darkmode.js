// Common dark mode functionality
function initDarkMode(isPopup = false) {
  const modeToggle = document.getElementById('mode-toggle');
  const body = document.body;
  
  // Load user preference from storage
  chrome.storage.local.get(['darkMode'], function(result) {
    const isDarkMode = result.darkMode === true;
    
    // Apply the mode based on saved preference
    if (isDarkMode) {
      body.classList.remove('light-mode');
      body.classList.add('dark-mode');
      modeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      body.classList.add('light-mode');
      body.classList.remove('dark-mode');
      modeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
  });
  
  // Toggle dark/light mode
  modeToggle.addEventListener('click', () => {
    const isCurrentlyLight = body.classList.contains('light-mode');
    
    if (isCurrentlyLight) {
      // Switch to dark mode
      body.classList.remove('light-mode');
      body.classList.add('dark-mode');
      modeToggle.innerHTML = '<i class="fas fa-sun"></i>';
      chrome.storage.local.set({ darkMode: true });
    } else {
      // Switch to light mode
      body.classList.add('light-mode');
      body.classList.remove('dark-mode');
      modeToggle.innerHTML = '<i class="fas fa-moon"></i>';
      chrome.storage.local.set({ darkMode: false });
    }
  });
}

// Export the function for use in other files
window.initDarkMode = initDarkMode;