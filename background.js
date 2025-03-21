// Store opened tab IDs in persistent storage
let openedTabs = new Set();
// Flag to prevent multiple concurrent context menu updates
let isUpdatingContextMenus = false;

// Load existing tab IDs from storage when extension loads
chrome.storage.local.get(['openedTabIds'], function(result) {
  if (result.openedTabIds) {
    openedTabs = new Set(result.openedTabIds);
    console.log('Loaded tab IDs from storage:', Array.from(openedTabs));
  }
});

// Make sure default-categories.js is imported in the manifest's background section
importScripts('default-categories.js');

// Initialize context menus when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  // First, ensure categories are initialized
  initializeCategories();
  
  // Wait a bit for categories to be initialized before creating menus
  setTimeout(() => {
    // Create context menus
    createContextMenus();
  }, 500);
});

// Function to initialize categories with default values if they don't exist
function initializeCategories() {
  chrome.storage.local.get(['categories'], (result) => {
    if (!result.categories || Object.keys(result.categories).length === 0) {
      console.log('No categories found in storage, initializing with defaults');
      chrome.storage.local.set({ categories: self.LBC_DEFAULT_CATEGORIES }, () => {
        console.log('Default categories initialized');
      });
    } else {
      console.log('Categories already exist in storage');
    }
  });
}

// Function to create context menus from scratch
function createContextMenus() {
  // Don't run if already updating
  if (isUpdatingContextMenus) {
    console.log('Context menu update already in progress, skipping');
    return;
  }
  
  isUpdatingContextMenus = true;
  
  // First remove all existing context menus
  chrome.contextMenus.removeAll(() => {
    console.log('All existing context menus removed');
    
    // Create the parent menu
    chrome.contextMenus.create({
      id: 'addToCategory',
      title: 'Add to LBC Category',
      contexts: ['page', 'link']
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error creating parent menu:', chrome.runtime.lastError);
      }
      
      // Get categories from storage
      chrome.storage.local.get(['categories'], (result) => {
        const categories = result.categories || self.LBC_DEFAULT_CATEGORIES;
        const categoryIds = Object.keys(categories);
        
        // Create submenu for each category
        let createdCount = 0;
        categoryIds.forEach((menuId, index) => {
          const category = categories[menuId];
          
          chrome.contextMenus.create({
            id: `category-${menuId}`,
            parentId: 'addToCategory',
            title: category.name,
            contexts: ['page', 'link']
          }, () => {
            if (chrome.runtime.lastError) {
              console.error(`Error creating submenu for ${category.name}:`, chrome.runtime.lastError);
            } else {
              createdCount++;
              console.log(`Created submenu for category: ${category.name}`);
              
              // Mark as complete when all menus have been created
              if (createdCount === categoryIds.length) {
                console.log('All context menus created successfully');
                isUpdatingContextMenus = false;
              }
            }
          });
        });
        
        // If there are no categories, release the lock
        if (categoryIds.length === 0) {
          console.log('No categories to create submenus for');
          isUpdatingContextMenus = false;
        }
      });
    });
  });
}

// Listen for storage changes to update context menus when categories are modified
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.categories) {
    console.log('Categories changed, updating context menus');
    createContextMenus();
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId.startsWith('category-')) {
    const menuId = info.menuItemId.replace('category-', '');
    const url = info.linkUrl || info.pageUrl;
    
    // Add the URL to the selected category
    addUrlToCategory(menuId, url);
  }
});

// Function to add a URL to a category
function addUrlToCategory(menuId, url) {
  chrome.storage.local.get(['categories'], (result) => {
    const categories = result.categories || self.LBC_DEFAULT_CATEGORIES;
    
    if (categories[menuId]) {
      // Check if the URL is already in the category
      if (!categories[menuId].links.includes(url)) {
        // Add the URL to the category
        categories[menuId].links.push(url);
        
        // Save the updated categories
        chrome.storage.local.set({ categories }, () => {
          // Show a notification that the URL was added
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon.png',
            title: 'URL Added',
            message: `Added to category: ${categories[menuId].name}`,
            priority: 0
          });
        });
      } else {
        // Show notification that URL already exists
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon.png',
          title: 'URL Already Exists',
          message: `This URL is already in category: ${categories[menuId].name}`,
          priority: 0
        });
      }
    }
  });
}

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

// ================ NOTIFICATION SYSTEM ================

// Handle alarm events for reminders
chrome.alarms.onAlarm.addListener((alarm) => {
  // Check if this is a reminder alarm (they all start with "reminder-")
  if (alarm.name.startsWith('reminder-')) {
    console.log(`Alarm triggered: ${alarm.name}`);
    
    // Get the reminder data associated with this alarm
    chrome.storage.local.get([alarm.name, 'categories'], (result) => {
      const reminder = result[alarm.name];
      const categories = result.categories;
      
      if (reminder && categories) {
        const category = categories[reminder.categoryId];
        
        if (category) {
          console.log(`Showing notification for category: ${category.name}`);
          
          // Create notification
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon.png',
            title: 'LBC Checker Reminder',
            message: `Time to check: ${category.name}`,
            buttons: [
              { title: 'Open Now' },
              { title: 'Dismiss' }
            ],
            priority: 2,
            requireInteraction: true // Notification persists until user interacts with it
          }, (notificationId) => {
            // Store the reminder and category info with the notification ID
            chrome.storage.local.set({
              ['notification-' + notificationId]: {
                reminderAlarm: alarm.name,
                categoryId: reminder.categoryId,
                time: new Date().toLocaleString()
              }
            }, () => {
              console.log(`Stored notification data for ${notificationId}`);
            });
          });
          
          // Reschedule the alarm for the next applicable day
          // The existing alarm is daily, but let's make sure it's only on the days selected
          scheduleNextAlarm(alarm.name, reminder);
        }
      }
    });
  }
});

// Function to schedule the next alarm based on selected days
function scheduleNextAlarm(alarmName, reminder) {
  // Get today's day of week (0 = Sunday, 1 = Monday, etc.)
  const today = new Date().getDay();
  
  // Find the next day that is enabled for this reminder
  let daysToAdd = 1;
  let nextDay = (today + daysToAdd) % 7;
  
  while (!reminder.days.includes(nextDay) && daysToAdd < 7) {
    daysToAdd++;
    nextDay = (today + daysToAdd) % 7;
  }
  
  console.log(`Next alarm for ${alarmName} will be in ${daysToAdd} days (${nextDay})`);
}

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  console.log(`Notification ${notificationId} button ${buttonIndex} clicked`);
  
  chrome.storage.local.get(['notification-' + notificationId, 'categories'], (result) => {
    const notificationData = result['notification-' + notificationId];
    
    if (notificationData) {
      if (buttonIndex === 0) { // Open Now button
        const categoryId = notificationData.categoryId;
        const categories = result.categories;
        
        if (categories && categories[categoryId]) {
          // Get the links for this category
          const links = categories[categoryId].links;
          
          if (links && links.length > 0) {
            // Instead of sending a message, directly open the links
            chrome.storage.local.get(['sequentialMode', 'openDelay'], function(settings) {
              const sequentialMode = settings.sequentialMode || false;
              const delay = settings.openDelay || 0;
              
              console.log('Opening links from notification with settings:', {
                sequentialMode: sequentialMode,
                delay: delay
              });
              
              if (sequentialMode && delay > 0) {
                console.log(`Opening ${links.length} links sequentially with ${delay}ms delay`);
                openLinksSequentially(links, delay);
              } else {
                console.log(`Opening ${links.length} links simultaneously`);
                links.forEach(link => {
                  if (link && typeof link === 'string' && link.trim()) {
                    createTab(link);
                  }
                });
              }
            });
          }
        }
      }
      
      // Clear the notification data
      chrome.storage.local.remove(['notification-' + notificationId]);
    }
  });
  
  // Close the notification
  chrome.notifications.clear(notificationId);
});

// Handle notification closed event (dismiss)
chrome.notifications.onClosed.addListener((notificationId) => {
  console.log(`Notification ${notificationId} closed`);
  
  // Clean up storage
  chrome.storage.local.remove(['notification-' + notificationId]);
});
