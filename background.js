// Store opened tab IDs - make it persistent
let openedTabs = new Set();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openLinks') {
    for (const link of request.links) {
      if (link.trim()) {
        chrome.tabs.create({ url: link.trim() }, (tab) => {
          // Store the ID of each tab opened by the extension
          openedTabs.add(tab.id);
          console.log(`Opened tab ID: ${tab.id} with URL: ${tab.url}`);
        });
      }
    }
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
      });
    } else {
      console.log('No stored tab IDs to close');
    }
  }
});
