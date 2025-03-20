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

// Helper function to validate links
function validateLinks(links) {
  if (!links || !Array.isArray(links)) {
    console.error('Invalid links format:', links);
    return [];
  }
  return links;
}

// Create a promise-based tab creation function
function createTab(url) {
  return new Promise((resolve) => {
    chrome.tabs.create({ url: url.trim() }, (tab) => {
      openedTabs.add(tab.id);
      saveTabIds();
      console.log(`Opened tab ID: ${tab.id} with URL: ${tab.url}`);
      resolve(tab);
    });
  });
}

// Function to open links sequentially with delay
async function openLinksSequentially(links, delay = 0) {
  links = validateLinks(links);
  console.log(`Starting sequential link opening: ${links.length} links with ${delay}ms delay`);
  
  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    if (link && typeof link === 'string' && link.trim()) {
      console.log(`Opening link ${i + 1}/${links.length}: ${link}`);
      await createTab(link);
      
      // Only wait if there are more links to open
      if (i < links.length - 1 && delay > 0) {
        console.log(`Waiting ${delay}ms before opening next link...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  console.log('Finished opening all links sequentially');
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openLinks') {
    chrome.storage.local.get(['sequentialMode', 'openDelay'], function(result) {
      const sequentialMode = result.sequentialMode || false;
      const delay = result.openDelay || 0;
      
      console.log('Opening links with settings:', {
        sequentialMode: sequentialMode,
        delay: delay
      });
      
      const validLinks = validateLinks(request.links);
      
      if (validLinks.length === 0) {
        console.error('No valid links to open');
        return;
      }
      
      if (sequentialMode && delay > 0) {
        console.log(`Opening ${validLinks.length} links sequentially with ${delay}ms delay`);
        openLinksSequentially(validLinks, delay);
      } else {
        console.log(`Opening ${validLinks.length} links simultaneously`);
        // Open all links at once (original behavior)
        validLinks.forEach(link => {
          if (link && typeof link === 'string' && link.trim()) {
            createTab(link);
          }
        });
      }
    });
    return true;
  }
  else if (request.action === 'closeAllTabs') {
    console.log('Received closeAllTabs action');
    console.log('Stored tab IDs to close:', Array.from(openedTabs));

    if (openedTabs.size > 0) {
      const tabIdsToClose = Array.from(openedTabs);
      chrome.tabs.remove(tabIdsToClose, () => {
        if (chrome.runtime.lastError) {
          console.error(`Error closing tabs by ID: ${chrome.runtime.lastError.message}`);
        }
        console.log(`Closed tabs successfully by ID`);
        openedTabs.clear();
        saveTabIds();
      });
    } else {
      console.log('No stored tab IDs to close');
    }
  }
  else if (request.action === 'openSettings') {
    chrome.tabs.create({ url: 'settings.html' });
  }
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
