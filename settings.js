// Define the categories with their icons and initial links
const defaultCategories = {
  'menu1': {
    name: 'Page Checker',
    icon: 'fas fa-check',
    links: [
      "https://www.facebook.com/account_status",
      "https://www.facebook.com/support/?tab_type=APPEALS",
      "https://www.facebook.com/settings/?tab=profile_recommendations&show_recommendable_nux=0",
      "https://www.facebook.com/settings/?tab=profile_management_history"
    ]
  },
  'menu2': {
    name: 'Profile Checker',
    icon: 'fas fa-user',
    links: [
      "https://www.facebook.com/account_status",
      "https://www.facebook.com/accountquality",
      "https://business.facebook.com/billing_hub/payment_activity?asset_id=",
      "https://www.facebook.com/id/hub/",
      "https://business.facebook.com/latest/monetization/monetization_policy_issues/monetization_policy_issues_violations?asset_id=",
      "https://www.facebook.com/support/?tab_type=APPEALS",
      "https://www.facebook.com/settings/identity_confirmation/",
      "https://www.facebook.com/primary_location/info?_rdc=2&_rdr",
      "https://adsmanager.facebook.com/adsmanager/manage/ad_account_settings/ad_account_setup",
      "https://business.facebook.com/business-support-home/contact-support",
      "https://adsmanager.facebook.com/adsmanager/manage/accounts?act="
    ]
  },
  'menu3': {
    name: 'New Account Checker',
    icon: 'fas fa-broom',
    links: [
      "https://www.facebook.com/profile_status/?referrer=profile_settings",
      "https://accountscenter.facebook.com/personal_info",
      "https://www.facebook.com/your_information/?tab=your_information&tile=personal_info_grouping",
      "https://accountscenter.facebook.com/password_and_security",
      "https://www.facebook.com/notifications",
      "https://www.facebook.com/business-support-home/"
    ]
  },
  'menu4': {
    name: 'Country Restriction',
    icon: 'fas fa-globe',
    links: [
      "https://www.facebook.com/settings/?tab=followers_and_public_content"
    ]
  },
  'menu5': {
    name: 'FB Group Creator',
    icon: 'fas fa-users',
    links: [
      "https://www.facebook.com/groups/create/"
    ]
  },
  'menu6': {
    name: 'BM Checker',
    icon: 'fas fa-briefcase',
    links: [
      "https://business.facebook.com/billing_hub/payment_activity?asset_id=",
      "https://business.facebook.com/latest/settings/ad_accounts?business_id=",
      "https://business.facebook.com/latest/monetization/monetization_policy_issues/monetization_policy_issues_violations?asset_id=",
      "https://business.facebook.com/latest/settings/pages?business_id=",
      "https://business.facebook.com/latest/settings/business_users?business_id=",
      "https://business.facebook.com/business-support-home",
      "https://business.facebook.com/billing_hub/accounts?business_id="
    ]
  },
  'menu7': {
    name: 'FB Page Creator',
    icon: 'fas fa-plus',
    links: [
      "https://www.facebook.com/pages/creation/"
    ]
  },
  'menu9': {
    name: 'Admins Manager',
    icon: 'fas fa-user-cog',
    links: [
      "https://www.facebook.com/settings/?tab=profile_access"
    ]
  },
  'menu10': {
    name: 'Moderation Assist',
    icon: 'fas fa-tools',
    links: [
      "https://www.facebook.com/professional_dashboard/moderation_assist"
    ]
  }
};

// Initialize the settings page
document.addEventListener('DOMContentLoaded', () => {
  loadCategories();
  loadGeneralSettings();
  loadNotes();
  loadReminders();
  
  // Event listeners
  document.getElementById('save-settings').addEventListener('click', saveSettings);
  document.getElementById('back-to-popup').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openPopup' });
    window.close();
  });
  
  // Add reminder button
  document.getElementById('add-reminder').addEventListener('click', () => {
    addNewReminder();
  });

  // Initialize dark mode with settings flag
  initDarkMode(false);

  // Setup notes auto-save
  setupNotesAutoSave();
});

// Load general settings from storage
function loadGeneralSettings() {
  chrome.storage.local.get(['sequentialMode', 'openDelay'], (result) => {
    // Sequential mode toggle
    const sequentialModeToggle = document.getElementById('sequential-mode');
    sequentialModeToggle.checked = result.sequentialMode === true;
    
    // Open delay input
    const openDelayInput = document.getElementById('open-delay');
    openDelayInput.value = result.openDelay || 500; // Default to 500ms if not set

    console.log('Settings loaded:', {
      sequentialMode: result.sequentialMode,
      openDelay: result.openDelay || 500
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
}

// Load categories from storage or use defaults
function loadCategories() {
  chrome.storage.local.get(['categories'], (result) => {
    const categories = result.categories || defaultCategories;
    const container = document.getElementById('categories-container');
    container.innerHTML = ''; // Clear container
    
    // Create UI for each category
    Object.keys(categories).forEach(menuId => {
      const category = categories[menuId];
      const categoryElement = createCategoryElement(menuId, category);
      container.appendChild(categoryElement);
    });
  });
}

// Create a category element with its links
function createCategoryElement(menuId, category) {
  const categoryDiv = document.createElement('div');
  categoryDiv.className = 'category';
  categoryDiv.dataset.menuId = menuId;
  
  // Create the category header with title and actions
  const headerDiv = document.createElement('div');
  headerDiv.className = 'category-header';
  
  // Create the category title
  const titleDiv = document.createElement('div');
  titleDiv.className = 'category-title';
  titleDiv.innerHTML = `<i class="${category.icon}"></i> ${category.name}`;
  headerDiv.appendChild(titleDiv);
  
  // Create restore defaults button
  const restoreButton = document.createElement('button');
  restoreButton.className = 'restore-defaults';
  restoreButton.innerHTML = '<i class="fas fa-undo-alt"></i> Restore Default Links';
  restoreButton.addEventListener('click', () => {
    restoreDefaultLinks(menuId, categoryDiv);
  });
  headerDiv.appendChild(restoreButton);
  
  categoryDiv.appendChild(headerDiv);
  
  // Create the links container
  const linksContainer = document.createElement('div');
  linksContainer.className = 'links-container';
  categoryDiv.appendChild(linksContainer);
  
  // Add each link
  category.links.forEach((link, index) => {
    const linkItem = createLinkItem(link);
    linksContainer.appendChild(linkItem);
  });
  
  // Add button to add a new link
  const addLinkButton = document.createElement('button');
  addLinkButton.className = 'add-link';
  addLinkButton.innerHTML = '<i class="fas fa-plus"></i> Add Link';
  addLinkButton.addEventListener('click', () => {
    const newLinkItem = createLinkItem('');
    linksContainer.appendChild(newLinkItem);
  });
  categoryDiv.appendChild(addLinkButton);
  
  return categoryDiv;
}

// Restore default links for a specific category
function restoreDefaultLinks(menuId, categoryElement) {
  if (defaultCategories[menuId]) {
    // Show confirmation dialog
    if (confirm(`Are you sure you want to restore default links for "${defaultCategories[menuId].name}"? This will replace all your custom links for this category.`)) {
      const linksContainer = categoryElement.querySelector('.links-container');
      linksContainer.innerHTML = ''; // Clear existing links
      
      // Add default links back
      defaultCategories[menuId].links.forEach(link => {
        const linkItem = createLinkItem(link);
        linksContainer.appendChild(linkItem);
      });
      
      // Show confirmation message
      const savedMessage = document.getElementById('saved-message');
      savedMessage.textContent = `Default links restored for ${defaultCategories[menuId].name}`;
      savedMessage.style.display = 'block';
      setTimeout(() => {
        savedMessage.textContent = 'Settings saved successfully!';
        savedMessage.style.display = 'none';
      }, 3000);
    }
  }
}

// Create a link input item
function createLinkItem(link) {
  const linkItem = document.createElement('div');
  linkItem.className = 'link-item';
  
  const linkInput = document.createElement('input');
  linkInput.type = 'text';
  linkInput.className = 'link-input';
  linkInput.value = link;
  linkItem.appendChild(linkInput);
  
  const deleteButton = document.createElement('span');
  deleteButton.className = 'delete-link';
  deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
  deleteButton.addEventListener('click', () => {
    linkItem.remove();
  });
  linkItem.appendChild(deleteButton);
  
  return linkItem;
}

// Load reminders from storage or create empty array
function loadReminders() {
  chrome.storage.local.get(['reminders'], (result) => {
    const reminders = result.reminders || [];
    const container = document.getElementById('reminders-container');
    container.innerHTML = ''; // Clear container
    
    if (reminders.length > 0) {
      // Create UI for each reminder
      reminders.forEach((reminder, index) => {
        const reminderElement = createReminderElement(reminder, index);
        container.appendChild(reminderElement);
      });
    } else {
      // Add a default reminder if none exist
      addNewReminder();
    }
  });
}

// Create a new reminder element
function addNewReminder() {
  const reminder = {
    categoryId: 'menu1', // Default to first category
    time: '09:00',
    active: true,
    days: [1, 2, 3, 4, 5] // Monday to Friday by default
  };
  
  const reminderElement = createReminderElement(reminder);
  document.getElementById('reminders-container').appendChild(reminderElement);
}

// Create a reminder element with its settings
function createReminderElement(reminder, index) {
  const reminderDiv = document.createElement('div');
  reminderDiv.className = 'reminder-item';
  reminderDiv.dataset.index = index;
  
  const detailsDiv = document.createElement('div');
  detailsDiv.className = 'reminder-details';
  
  // Create category select dropdown
  const categorySelect = document.createElement('select');
  categorySelect.className = 'reminder-select';
  
  // We need to populate the dropdown with all categories
  chrome.storage.local.get(['categories'], (result) => {
    const categories = result.categories || defaultCategories;
    
    Object.keys(categories).forEach(menuId => {
      const category = categories[menuId];
      const option = document.createElement('option');
      option.value = menuId;
      option.textContent = category.name;
      
      if (menuId === reminder.categoryId) {
        option.selected = true;
      }
      
      categorySelect.appendChild(option);
    });
  });
  
  // Create time input
  const timeInput = document.createElement('input');
  timeInput.type = 'time';
  timeInput.className = 'reminder-time-input';
  timeInput.value = reminder.time || '09:00';
  
  // Create active toggle
  const activeDiv = document.createElement('div');
  activeDiv.className = 'reminder-active';
  
  const activeLabel = document.createElement('span');
  activeLabel.className = 'reminder-active-label';
  activeLabel.textContent = 'Active';
  activeDiv.appendChild(activeLabel);
  
  const activeToggle = document.createElement('label');
  activeToggle.className = 'toggle-switch';
  
  const activeCheckbox = document.createElement('input');
  activeCheckbox.type = 'checkbox';
  activeCheckbox.checked = reminder.active !== false;
  
  const activeSlider = document.createElement('span');
  activeSlider.className = 'slider';
  
  activeToggle.appendChild(activeCheckbox);
  activeToggle.appendChild(activeSlider);
  activeDiv.appendChild(activeToggle);
  
  // Add days of week selection
  const daysDiv = document.createElement('div');
  daysDiv.className = 'reminder-days';
  
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // Sun to Sat
  
  for (let i = 0; i < 7; i++) {
    const dayId = `day-${index !== undefined ? index : 'new'}-${i}`;
    
    const dayInput = document.createElement('input');
    dayInput.type = 'checkbox';
    dayInput.id = dayId;
    dayInput.className = 'day-checkbox';
    dayInput.checked = reminder.days ? reminder.days.includes(i) : false;
    dayInput.value = i;
    
    const dayLabel = document.createElement('label');
    dayLabel.htmlFor = dayId;
    dayLabel.className = 'day-label';
    dayLabel.textContent = dayNames[i];
    
    daysDiv.appendChild(dayInput);
    daysDiv.appendChild(dayLabel);
  }
  
  // Create delete button
  const deleteButton = document.createElement('span');
  deleteButton.className = 'reminder-delete';
  deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
  deleteButton.addEventListener('click', () => {
    reminderDiv.remove();
  });
  
  // Assemble the reminder item
  detailsDiv.appendChild(categorySelect);
  detailsDiv.appendChild(timeInput);
  detailsDiv.appendChild(activeDiv);
  detailsDiv.appendChild(daysDiv);
  
  reminderDiv.appendChild(detailsDiv);
  reminderDiv.appendChild(deleteButton);
  
  return reminderDiv;
}

// Save settings to Chrome storage
function saveSettings() {
  // Save categories
  const categories = {};
  
  // Get all categories
  const categoryElements = document.querySelectorAll('.category');
  categoryElements.forEach(categoryElement => {
    const menuId = categoryElement.dataset.menuId;
    const name = categoryElement.querySelector('.category-title').textContent.trim();
    const icon = categoryElement.querySelector('.category-title i').className;
    
    // Get all links for this category
    const links = [];
    const linkInputs = categoryElement.querySelectorAll('.link-input');
    linkInputs.forEach(input => {
      if (input.value.trim()) {
        links.push(input.value.trim());
      }
    });
    
    categories[menuId] = {
      name,
      icon,
      links
    };
  });
  
  // Save reminders
  const reminders = [];
  const reminderElements = document.querySelectorAll('.reminder-item');
  
  reminderElements.forEach(reminderElement => {
    const categoryId = reminderElement.querySelector('.reminder-select').value;
    const time = reminderElement.querySelector('.reminder-time-input').value;
    const active = reminderElement.querySelector('.reminder-active input').checked;
    
    // Get selected days
    const days = [];
    const dayCheckboxes = reminderElement.querySelectorAll('.day-checkbox');
    dayCheckboxes.forEach(checkbox => {
      if (checkbox.checked) {
        days.push(parseInt(checkbox.value));
      }
    });
    
    reminders.push({
      categoryId,
      time,
      active,
      days
    });
  });
  
  // Save general settings
  const sequentialMode = document.getElementById('sequential-mode').checked;
  const openDelay = parseInt(document.getElementById('open-delay').value, 10) || 0;
  const notes = document.getElementById('notes-content').value;
  
  console.log('Settings saved:', {
    sequentialMode: sequentialMode,
    openDelay: openDelay,
    reminders: reminders
  });

  // Save all settings to Chrome storage
  chrome.storage.local.set({
    categories,
    sequentialMode,
    openDelay,
    notes,
    reminders
  }, () => {
    // Show saved message
    const savedMessage = document.getElementById('saved-message');
    savedMessage.style.display = 'block';
    setTimeout(() => {
      savedMessage.style.display = 'none';
    }, 3000);
    
    // Schedule reminders with alarms
    scheduleReminders(reminders);
  });
}

// Schedule reminders with Chrome alarms
function scheduleReminders(reminders) {
  // First clear all existing reminder alarms
  chrome.alarms.clearAll(() => {
    console.log('Cleared all existing alarms');
    
    // Only create alarms for active reminders
    const activeReminders = reminders.filter(reminder => reminder.active);
    
    if (activeReminders.length > 0) {
      // For each active reminder, create an alarm
      activeReminders.forEach((reminder, index) => {
        const alarmName = `reminder-${index}`;
        
        // Store the reminder data with the alarm name for retrieval later
        chrome.storage.local.set({
          [alarmName]: reminder
        }, () => {
          console.log(`Stored reminder data for alarm: ${alarmName}`);
        });
        
        // Schedule the alarm based on the time setting
        scheduleAlarmForReminder(alarmName, reminder);
      });
    }
  });
}

// Schedule an alarm for a specific reminder
function scheduleAlarmForReminder(alarmName, reminder) {
  // Get the current time
  const now = new Date();
  
  // Parse the reminder time
  const [hours, minutes] = reminder.time.split(':');
  
  // Calculate when this alarm should next fire
  const scheduledTime = new Date();
  scheduledTime.setHours(parseInt(hours, 10));
  scheduledTime.setMinutes(parseInt(minutes, 10));
  scheduledTime.setSeconds(0);
  scheduledTime.setMilliseconds(0);
  
  // If the time has already passed today, schedule it for tomorrow
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }
  
  // Check if the day of week is enabled for this reminder
  const dayOfWeek = scheduledTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  if (!reminder.days.includes(dayOfWeek)) {
    // Find next enabled day
    let daysToAdd = 1;
    let nextDay = (dayOfWeek + daysToAdd) % 7;
    
    while (!reminder.days.includes(nextDay) && daysToAdd < 7) {
      daysToAdd++;
      nextDay = (dayOfWeek + daysToAdd) % 7;
    }
    
    // If no days are enabled, don't schedule
    if (daysToAdd >= 7) {
      console.log(`No enabled days for reminder: ${alarmName}`);
      return;
    }
    
    // Adjust the date to the next enabled day
    scheduledTime.setDate(scheduledTime.getDate() + daysToAdd);
  }
  
  // Calculate delay in minutes for the alarm (from now)
  const delayInMinutes = (scheduledTime.getTime() - now.getTime()) / (1000 * 60);
  
  // Create the alarm
  chrome.alarms.create(alarmName, {
    delayInMinutes: delayInMinutes,
    periodInMinutes: 60 * 24 // Daily check
  });
  
  console.log(`Scheduled alarm ${alarmName} for ${scheduledTime.toLocaleString()} (in ${delayInMinutes.toFixed(2)} minutes)`);
}

// Load notes from storage
function loadNotes() {
  chrome.storage.local.get(['notes'], (result) => {
    const notesTextarea = document.getElementById('notes-content');
    if (result.notes) {
      notesTextarea.value = result.notes;
    }
  });
}

// Setup auto-save functionality for notes
function setupNotesAutoSave() {
  const notesTextarea = document.getElementById('notes-content');
  const autoSaveIndicator = document.getElementById('auto-save-indicator');
  let saveTimeout;

  notesTextarea.addEventListener('input', () => {
    // Clear any pending save
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Set a new timeout to save after 500ms of no typing
    saveTimeout = setTimeout(() => {
      chrome.storage.local.set({ notes: notesTextarea.value }, () => {
        // Show save indicator
        autoSaveIndicator.style.display = 'flex';
        // Hide it after 2 seconds
        setTimeout(() => {
          autoSaveIndicator.style.display = 'none';
        }, 2000);
      });
    }, 500);
  });
}