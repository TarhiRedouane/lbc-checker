// Import default categories
import { defaultCategories } from './default-categories.js';

// Background service class
class BackgroundService {
  constructor() {
    this.openedTabs = new Set();
    this.isUpdatingContextMenus = false;
    this.init();
  }

  async init() {
    // Load existing tab IDs from storage
    const { openedTabIds } = await this.getStorageData(['openedTabIds']);
    if (openedTabIds) {
      this.openedTabs.clear();
      openedTabIds.forEach(id => this.openedTabs.add(id));
      console.log('Loaded tab IDs from storage:', Array.from(this.openedTabs));
    }

    // Initialize context menus and event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Extension installation/update handler
    chrome.runtime.onInstalled.addListener(() => {
      this.initializeCategories();
      setTimeout(() => this.createContextMenus(), 500);
    });

    // Storage changes handler
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes.categories) {
        console.log('Categories changed, updating context menus');
        this.createContextMenus();
      }
    });

    // Context menu click handler
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (info.menuItemId.startsWith('category-')) {
        const menuId = info.menuItemId.replace('category-', '');
        const url = info.linkUrl || info.pageUrl;
        this.addUrlToCategory(menuId, url);
      }
    });

    // Message handler
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case 'openLinks':
          this.handleOpenLinks(request);
          return true;
        case 'closeAllTabs':
          this.closeAllTabs();
          break;
        case 'openSettings':
          chrome.tabs.create({ url: 'settings.html' });
          break;
        case 'openPopup':
          chrome.action.openPopup();
          break;
      }
    });

    // Tab removal handler
    chrome.tabs.onRemoved.addListener(tabId => {
      if (this.openedTabs.has(tabId)) {
        this.openedTabs.delete(tabId);
        this.saveTabIds();
        console.log(`Tab ${tabId} was closed manually and removed from tracking`);
      }
    });

    // Alarm handler for reminders
    chrome.alarms.onAlarm.addListener(alarm => {
      if (alarm.name.startsWith('reminder-')) {
        this.handleReminderAlarm(alarm);
      }
    });

    // Notification handlers
    chrome.notifications.onButtonClicked.addListener(this.handleNotificationClick.bind(this));
    chrome.notifications.onClosed.addListener(this.handleNotificationClosed.bind(this));
  }

  async initializeCategories() {
    const { categories } = await this.getStorageData(['categories']);
    if (!categories || Object.keys(categories).length === 0) {
      console.log('No categories found in storage, initializing with defaults');
      await this.setStorageData({ categories: defaultCategories });
      console.log('Default categories initialized');
    } else {
      console.log('Categories already exist in storage');
    }
  }

  async createContextMenus() {
    if (this.isUpdatingContextMenus) {
      console.log('Context menu update already in progress, skipping');
      return;
    }

    this.isUpdatingContextMenus = true;

    try {
      await this.removeAllContextMenus();
      await this.createParentMenu();
      await this.createCategorySubmenus();
    } catch (error) {
      console.error('Error creating context menus:', error);
    } finally {
      this.isUpdatingContextMenus = false;
    }
  }

  removeAllContextMenus() {
    return new Promise(resolve => {
      chrome.contextMenus.removeAll(resolve);
    });
  }

  createParentMenu() {
    return new Promise((resolve, reject) => {
      chrome.contextMenus.create({
        id: 'addToCategory',
        title: 'Add to LBC Category',
        contexts: ['page', 'link']
      }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  async createCategorySubmenus() {
    const { categories } = await this.getStorageData(['categories']);
    const finalCategories = categories || defaultCategories;

    const createSubmenuPromises = Object.entries(finalCategories).map(([menuId, category]) => {
      return new Promise((resolve, reject) => {
        chrome.contextMenus.create({
          id: `category-${menuId}`,
          parentId: 'addToCategory',
          title: category.name,
          contexts: ['page', 'link']
        }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
    });

    await Promise.all(createSubmenuPromises);
  }

  async addUrlToCategory(menuId, url) {
    const { categories } = await this.getStorageData(['categories']);
    const finalCategories = categories || defaultCategories;

    if (finalCategories[menuId]) {
      if (!finalCategories[menuId].links.includes(url)) {
        finalCategories[menuId].links.push(url);
        await this.setStorageData({ categories: finalCategories });
        this.showNotification('URL Added', `Added to category: ${finalCategories[menuId].name}`);
      } else {
        this.showNotification('URL Already Exists', `This URL is already in category: ${finalCategories[menuId].name}`);
      }
    }
  }

  showNotification(title, message, buttons = []) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon.png',
      title,
      message,
      buttons,
      priority: 0
    });
  }

  saveTabIds() {
    this.setStorageData({
      openedTabIds: Array.from(this.openedTabs)
    });
  }

  validateLinks(links) {
    if (!Array.isArray(links)) {
      console.error('Invalid links format:', links);
      return [];
    }
    return links;
  }

  async createTab(url) {
    const tab = await new Promise(resolve => {
      chrome.tabs.create({ url: url.trim() }, resolve);
    });
    this.openedTabs.add(tab.id);
    this.saveTabIds();
    console.log(`Opened tab ID: ${tab.id} with URL: ${tab.url}`);
    return tab;
  }

  async openLinksSequentially(links, delay = 0) {
    const validLinks = this.validateLinks(links);
    console.log(`Starting sequential link opening: ${validLinks.length} links with ${delay}ms delay`);

    for (const [index, link] of validLinks.entries()) {
      if (link?.trim()) {
        console.log(`Opening link ${index + 1}/${validLinks.length}: ${link}`);
        await this.createTab(link);

        if (index < validLinks.length - 1 && delay > 0) {
          console.log(`Waiting ${delay}ms before opening next link...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    console.log('Finished opening all links sequentially');
  }

  async handleOpenLinks(request) {
    const { sequentialMode, openDelay = 0 } = await this.getStorageData(['sequentialMode', 'openDelay']);
    console.log('Opening links with settings:', { sequentialMode, openDelay });

    const validLinks = this.validateLinks(request.links);

    if (validLinks.length === 0) {
      console.error('No valid links to open');
      return;
    }

    if (sequentialMode && openDelay > 0) {
      console.log(`Opening ${validLinks.length} links sequentially with ${openDelay}ms delay`);
      await this.openLinksSequentially(validLinks, openDelay);
    } else {
      console.log(`Opening ${validLinks.length} links simultaneously`);
      validLinks.forEach(link => {
        if (link?.trim()) {
          this.createTab(link);
        }
      });
    }
  }

  closeAllTabs() {
    console.log('Closing all tabs:', Array.from(this.openedTabs));
    if (this.openedTabs.size > 0) {
      chrome.tabs.remove(Array.from(this.openedTabs), () => {
        if (chrome.runtime.lastError) {
          console.error(`Error closing tabs: ${chrome.runtime.lastError.message}`);
        }
        this.openedTabs.clear();
        this.saveTabIds();
      });
    }
  }

  async handleReminderAlarm(alarm) {
    console.log(`Alarm triggered: ${alarm.name}`);
    
    const { [alarm.name]: reminder, categories } = await this.getStorageData([alarm.name, 'categories']);
    if (reminder && categories) {
      const category = categories[reminder.categoryId];
      if (category) {
        console.log(`Showing notification for category: ${category.name}`);
        this.showReminderNotification(alarm.name, category);
        this.scheduleNextAlarm(alarm.name, reminder);
      }
    }
  }

  showReminderNotification(alarmName, category) {
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
      requireInteraction: true
    }, notificationId => {
      this.setStorageData({
        [`notification-${notificationId}`]: {
          reminderAlarm: alarmName,
          categoryId: category.id,
          time: new Date().toLocaleString()
        }
      });
    });
  }

  async handleNotificationClick(notificationId, buttonIndex) {
    console.log(`Notification ${notificationId} button ${buttonIndex} clicked`);
    
    const { [`notification-${notificationId}`]: notificationData, categories } = 
      await this.getStorageData([`notification-${notificationId}`, 'categories']);

    if (notificationData && buttonIndex === 0) { // Open Now button
      const categoryId = notificationData.categoryId;
      const category = categories?.[categoryId];

      if (category?.links?.length > 0) {
        const { sequentialMode, openDelay = 0 } = await this.getStorageData(['sequentialMode', 'openDelay']);
        
        if (sequentialMode && openDelay > 0) {
          await this.openLinksSequentially(category.links, openDelay);
        } else {
          category.links.forEach(link => {
            if (link?.trim()) {
              this.createTab(link);
            }
          });
        }
      }
    }

    await this.setStorageData({ [`notification-${notificationId}`]: null });
    chrome.notifications.clear(notificationId);
  }

  handleNotificationClosed(notificationId) {
    console.log(`Notification ${notificationId} closed`);
    this.setStorageData({ [`notification-${notificationId}`]: null });
  }

  scheduleNextAlarm(alarmName, reminder) {
    const today = new Date().getDay();
    let daysToAdd = 1;
    let nextDay = (today + daysToAdd) % 7;

    while (!reminder.days.includes(nextDay) && daysToAdd < 7) {
      daysToAdd++;
      nextDay = (today + daysToAdd) % 7;
    }

    console.log(`Next alarm for ${alarmName} will be in ${daysToAdd} days (${nextDay})`);
  }

  getStorageData(keys) {
    return new Promise(resolve => {
      chrome.storage.local.get(keys, resolve);
    });
  }

  setStorageData(data) {
    return new Promise(resolve => {
      chrome.storage.local.set(data, resolve);
    });
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new BackgroundService();
    }
    return this.instance;
  }
}

// Initialize the background service
const backgroundService = BackgroundService.getInstance();
