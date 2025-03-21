// Reminders module for scheduled notifications
window.SettingsReminders = (function() {
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
      const categories = result.categories || window.SettingsData.defaultCategories;
      
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

  // Get reminders from the DOM for saving
  function getReminders() {
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
    
    return reminders;
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

  // Setup handler for the add reminder button
  function setupEventHandlers() {
    document.getElementById('add-reminder').addEventListener('click', () => {
      addNewReminder();
    });
  }

  // Public API
  return {
    loadReminders,
    getReminders,
    scheduleReminders,
    setupEventHandlers
  };
})();