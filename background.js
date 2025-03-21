// Store opened tab IDs in persistent storage
const openedTabs = new Set();
// Flag to prevent multiple concurrent context menu updates
let isUpdatingContextMenus = false;

// Load existing tab IDs from storage when extension loads
chrome.storage.local.get(['openedTabIds'], ({ openedTabIds }) => {
  if (openedTabIds) {
    openedTabs.clear();
    openedTabIds.forEach(id => openedTabs.add(id));
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
const initializeCategories = () => {
  chrome.storage.local.get(['categories'], ({ categories }) => {
    if (!categories || Object.keys(categories).length === 0) {
      console.log('No categories found in storage, initializing with defaults');
      chrome.storage.local.set({ categories: self.LBC_DEFAULT_CATEGORIES }, () => {
        console.log('Default categories initialized');
      });
    } else {
      console.log('Categories already exist in storage');
    }
  });
};

// Function to create context menus from scratch
const createContextMenus = () => {
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
      chrome.storage.local.get(['categories'], ({ categories }) => {
        const finalCategories = categories || self.LBC_DEFAULT_CATEGORIES;
        
        // Create submenu for each category
        let createdCount = 0;
        Object.entries(finalCategories).forEach(([menuId, category], index) => {
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
              if (createdCount === Object.keys(finalCategories).length) {
                console.log('All context menus created successfully');
                isUpdatingContextMenus = false;
              }
            }
          });
        });
        
        // If there are no categories, release the lock
        if (Object.keys(finalCategories).length === 0) {
          console.log('No categories to create submenus for');
          isUpdatingContextMenus = false;
        }
      });
    });
  });
};

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
const addUrlToCategory = (menuId, url) => {
  chrome.storage.local.get(['categories'], ({ categories }) => {
    const finalCategories = categories || self.LBC_DEFAULT_CATEGORIES;
    
    if (finalCategories[menuId]) {
      // Check if the URL is already in the category
      if (!finalCategories[menuId].links.includes(url)) {
        // Add the URL to the category
        finalCategories[menuId].links.push(url);
        
        // Save the updated categories
        chrome.storage.local.set({ categories: finalCategories }, () => {
          // Show a notification that the URL was added
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon.png',
            title: 'URL Added',
            message: `Added to category: ${finalCategories[menuId].name}`,
            priority: 0
          });
        });
      } else {
        // Show notification that URL already exists
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon.png',
          title: 'URL Already Exists',
          message: `This URL is already in category: ${finalCategories[menuId].name}`,
          priority: 0
        });
      }
    }
  });
};

// Helper function to save tab IDs to storage
const saveTabIds = () => {
  chrome.storage.local.set({
    openedTabIds: Array.from(openedTabs)
  }, () => {
    console.log('Saved tab IDs to storage:', Array.from(openedTabs));
  });
};

// Helper function to validate links
const validateLinks = links => {
  if (!Array.isArray(links)) {
    console.error('Invalid links format:', links);
    return [];
  }
  return links;
};

// Create a promise-based tab creation function
const createTab = url => {
  return new Promise(resolve => {
    chrome.tabs.create({ url: url.trim() }, tab => {
      openedTabs.add(tab.id);
      saveTabIds();
      console.log(`Opened tab ID: ${tab.id} with URL: ${tab.url}`);
      resolve(tab);
    });
  });
};

// Function to open links sequentially with delay
const openLinksSequentially = async (links, delay = 0) => {
  const validLinks = validateLinks(links);
  console.log(`Starting sequential link opening: ${validLinks.length} links with ${delay}ms delay`);
  
  for (const [index, link] of validLinks.entries()) {
    if (link?.trim()) {
      console.log(`Opening link ${index + 1}/${validLinks.length}: ${link}`);
      await createTab(link);
      
      // Only wait if there are more links to open
      if (index < validLinks.length - 1 && delay > 0) {
        console.log(`Waiting ${delay}ms before opening next link...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  console.log('Finished opening all links sequentially');
};

// Message handler for extension actions
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'openLinks':
      chrome.storage.local.get(['sequentialMode', 'openDelay'], ({ sequentialMode, openDelay = 0 }) => {
        console.log('Opening links with settings:', { sequentialMode, openDelay });
        
        const validLinks = validateLinks(request.links);
        
        if (validLinks.length === 0) {
          console.error('No valid links to open');
          return;
        }
        
        if (sequentialMode && openDelay > 0) {
          console.log(`Opening ${validLinks.length} links sequentially with ${openDelay}ms delay`);
          openLinksSequentially(validLinks, openDelay);
        } else {
          console.log(`Opening ${validLinks.length} links simultaneously`);
          validLinks.forEach(link => {
            if (link?.trim()) {
              createTab(link);
            }
          });
        }
      });
      return true;

    case 'closeAllTabs':
      console.log('Received closeAllTabs action');
      console.log('Stored tab IDs to close:', Array.from(openedTabs));

      if (openedTabs.size > 0) {
        const tabIdsToClose = Array.from(openedTabs);
        chrome.tabs.remove(tabIdsToClose, () => {
          if (chrome.runtime.lastError) {
            console.error(`Error closing tabs by ID: ${chrome.runtime.lastError.message}`);
          }
          console.log('Closed tabs successfully by ID');
          openedTabs.clear();
          saveTabIds();
        });
      } else {
        console.log('No stored tab IDs to close');
      }
      break;

    case 'openSettings':
      chrome.tabs.create({ url: 'settings.html' });
      break;

    case 'openPopup':
      chrome.action.openPopup();
      break;
  }
});

// Listen for tab close events to keep our tracking up to date
chrome.tabs.onRemoved.addListener(tabId => {
  if (openedTabs.has(tabId)) {
    openedTabs.delete(tabId);
    saveTabIds();
    console.log(`Tab ${tabId} was closed manually and removed from tracking`);
  }
});

// ================ NOTIFICATION SYSTEM ================

// Handle alarm events for reminders
chrome.alarms.onAlarm.addListener(alarm => {
  // Check if this is a reminder alarm (they all start with "reminder-")
  if (alarm.name.startsWith('reminder-')) {
    console.log(`Alarm triggered: ${alarm.name}`);
    
    // Get the reminder data associated with this alarm
    chrome.storage.local.get([alarm.name, 'categories'], ({ [alarm.name]: reminder, categories }) => {
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
          }, notificationId => {
            // Store the reminder and category info with the notification ID
            chrome.storage.local.set({
              [`notification-${notificationId}`]: {
                reminderAlarm: alarm.name,
                categoryId: reminder.categoryId,
                time: new Date().toLocaleString()
              }
            }, () => {
              console.log(`Stored notification data for ${notificationId}`);
            });
          });
          
          // Reschedule the alarm for the next applicable day
          scheduleNextAlarm(alarm.name, reminder);
        }
      }
    });
  }
});

// Function to schedule the next alarm based on selected days
const scheduleNextAlarm = (alarmName, reminder) => {
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
};

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  console.log(`Notification ${notificationId} button ${buttonIndex} clicked`);
  
  chrome.storage.local.get([`notification-${notificationId}`, 'categories'], (result) => {
    const notificationData = result[`notification-${notificationId}`];
    
    if (notificationData) {
      if (buttonIndex === 0) { // Open Now button
        const categoryId = notificationData.categoryId;
        const { categories } = result;
        
        if (categories?.[categoryId]?.links) {
          // Get the links for this category
          const links = categories[categoryId].links;
          
          if (links?.length > 0) {
            // Instead of sending a message, directly open the links
            chrome.storage.local.get(['sequentialMode', 'openDelay'], ({ sequentialMode, openDelay = 0 }) => {
              console.log('Opening links from notification with settings:', {
                sequentialMode,
                openDelay
              });
              
              if (sequentialMode && openDelay > 0) {
                console.log(`Opening ${links.length} links sequentially with ${openDelay}ms delay`);
                openLinksSequentially(links, openDelay);
              } else {
                console.log(`Opening ${links.length} links simultaneously`);
                links.forEach(link => {
                  if (link?.trim()) {
                    createTab(link);
                  }
                });
              }
            });
          }
        }
      }
      
      // Clear the notification data
      chrome.storage.local.remove([`notification-${notificationId}`]);
    }
  });
  
  // Close the notification
  chrome.notifications.clear(notificationId);
});

// Handle notification closed event (dismiss)
chrome.notifications.onClosed.addListener(notificationId => {
  console.log(`Notification ${notificationId} closed`);
  
  // Clean up storage
  chrome.storage.local.remove([`notification-${notificationId}`]);
});
