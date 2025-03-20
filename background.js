// Store opened tab IDs in persistent storage
let openedTabs = new Set();

// Load existing tab IDs from storage when extension loads
chrome.storage.local.get(['openedTabIds'], function(result) {
  if (result.openedTabIds) {
    openedTabs = new Set(result.openedTabIds);
    console.log('Loaded tab IDs from storage:', Array.from(openedTabs));
  }
});

// Helper function to save tab IDs to storage
function saveTabIds() {
  chrome.storage.local.set({
    openedTabIds: Array.from(openedTabs)
  }, function() {
    console.log('Saved tab IDs to storage:', Array.from(openedTabs));
  });
}

// Function to open links sequentially with delay
async function openLinksSequentially(links, delay = 0) {
  console.log(`Opening ${links.length} links with ${delay}ms delay`);
  
  for (const link of links) {
    if (link.trim()) {
      // Create a new tab with the link
      chrome.tabs.create({ url: link.trim() }, (tab) => {
        // Store the ID of the tab
        openedTabs.add(tab.id);
        saveTabIds();
        console.log(`Opened tab ID: ${tab.id} with URL: ${tab.url}`);
      });
      
      // If delay is specified, wait before opening the next tab
      if (delay > 0 && links.indexOf(link) < links.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openLinks') {
    // Check if sequential mode is enabled and get the delay
    chrome.storage.local.get(['sequentialMode', 'openDelay'], function(result) {
      const sequentialMode = result.sequentialMode || false;
      const delay = result.openDelay || 0;
      
      if (sequentialMode && delay > 0) {
        // Open links sequentially with delay
        openLinksSequentially(request.links, delay);
      } else {
        // Open all links at once (original behavior)
        for (const link of request.links) {
          if (link.trim()) {
            chrome.tabs.create({ url: link.trim() }, (tab) => {
              openedTabs.add(tab.id);
              saveTabIds();
              console.log(`Opened tab ID: ${tab.id} with URL: ${tab.url}`);
            });
          }
        }
      }
    });
    return true; // Indicate we'll respond asynchronously
  }
  else if (request.action === 'closeAllTabs') {
    console.log('Received closeAllTabs action');
    console.log('Stored tab IDs to close:', Array.from(openedTabs));

    // Close tabs by stored IDs
    if (openedTabs.size > 0) {
      const tabIdsToClose = Array.from(openedTabs);

      chrome.tabs.remove(tabIdsToClose, () => {
        if (chrome.runtime.lastError) {
          console.error(`Error closing tabs by ID: ${chrome.runtime.lastError.message}`);
          // Some tabs might not exist anymore, but we can still clear our tracking
        }
        console.log(`Closed tabs successfully by ID`);
        // Clear our tracking set after closing
        openedTabs.clear();
        saveTabIds(); // Update storage after clearing tabs
      });
    } else {
      console.log('No stored tab IDs to close');
    }
  }
  // Handle opening settings page
  else if (request.action === 'openSettings') {
    chrome.tabs.create({ url: 'settings.html' });
  }
  // Handle opening popup from settings
  else if (request.action === 'openPopup') {
    chrome.action.openPopup();
  }
});

// Listen for tab close events to keep our tracking up to date
chrome.tabs.onRemoved.addListener((tabId) => {
  if (openedTabs.has(tabId)) {
    openedTabs.delete(tabId);
    saveTabIds();
    console.log(`Tab ${tabId} was closed manually and removed from tracking`);
  }
});
