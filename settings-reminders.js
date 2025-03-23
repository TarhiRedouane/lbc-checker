// Import default categories for initialization
import { defaultCategories } from './default-categories.js';

// Reminders management class
export class SettingsReminders {
  constructor() {
    this.container = document.getElementById('reminders-container');
  }

  async loadReminders() {
    const { reminders = [] } = await this.getStorageData(['reminders']);
    this.container.innerHTML = ''; // Clear container
    
    if (reminders.length > 0) {
      // Create UI for each reminder
      reminders.forEach((reminder, index) => {
        const reminderElement = this.createReminderElement(reminder, index);
        this.container.appendChild(reminderElement);
      });
    } else {
      // Add a default reminder if none exist
      this.addNewReminder();
    }
  }

  addNewReminder() {
    const reminder = {
      categoryId: 'menu1', // Default to first category
      time: '09:00',
      active: true,
      days: [1, 2, 3, 4, 5] // Monday to Friday by default
    };
    
    // Get current number of reminders to assign proper index
    const currentCount = document.querySelectorAll('.reminder-item').length;
    const reminderElement = this.createReminderElement(reminder, currentCount);
    this.container.appendChild(reminderElement);
  }

  createReminderElement(reminder, index) {
    const reminderDiv = document.createElement('div');
    reminderDiv.className = 'reminder-item';
    reminderDiv.dataset.index = index;
    
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'reminder-details';
    
    // Create category select dropdown
    const categorySelect = document.createElement('select');
    categorySelect.className = 'reminder-select';
    
    this.populateCategorySelect(categorySelect, reminder.categoryId);
    
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
      const dayId = `day-reminder-${index}-${i}`;
      
      const dayInput = document.createElement('input');
      dayInput.type = 'checkbox';
      dayInput.id = dayId;
      dayInput.className = 'day-checkbox';
      dayInput.checked = reminder.days ? reminder.days.includes(i) : false;
      dayInput.value = i;
      dayInput.dataset.reminderIndex = index;
      dayInput.dataset.dayIndex = i;
      
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

  async populateCategorySelect(selectElement, selectedMenuId) {
    const { categories } = await this.getStorageData(['categories']);
    const finalCategories = categories || defaultCategories;
    
    Object.keys(finalCategories).forEach(menuId => {
      const category = finalCategories[menuId];
      const option = document.createElement('option');
      option.value = menuId;
      option.textContent = category.name;
      
      if (menuId === selectedMenuId) {
        option.selected = true;
      }
      
      selectElement.appendChild(option);
    });
  }

  getReminders() {
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

  scheduleReminders(reminders) {
    // Clear all existing reminder alarms
    chrome.alarms.clearAll(() => {
      console.log('Cleared all existing alarms');
      
      // Only create alarms for active reminders
      const activeReminders = reminders.filter(reminder => reminder.active);
      
      activeReminders.forEach((reminder, index) => {
        const alarmName = `reminder-${index}`;
        
        // Store the reminder data with the alarm name
        chrome.storage.local.set({
          [alarmName]: reminder
        }, () => {
          console.log(`Stored reminder data for alarm: ${alarmName}`);
        });
        
        // Schedule the alarm based on the time setting
        this.scheduleAlarmForReminder(alarmName, reminder);
      });
    });
  }

  scheduleAlarmForReminder(alarmName, reminder) {
    const [hours, minutes] = reminder.time.split(':');
    const scheduledTime = new Date();
    scheduledTime.setHours(parseInt(hours, 10));
    scheduledTime.setMinutes(parseInt(minutes, 10));
    scheduledTime.setSeconds(0);
    scheduledTime.setMilliseconds(0);
    
    // If the time has already passed today, schedule it for tomorrow
    const now = new Date();
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    // Check if the day of week is enabled for this reminder
    const dayOfWeek = scheduledTime.getDay();
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
      
      scheduledTime.setDate(scheduledTime.getDate() + daysToAdd);
    }
    
    // Calculate delay in minutes for the alarm
    const delayInMinutes = (scheduledTime.getTime() - now.getTime()) / (1000 * 60);
    
    // Create the alarm
    chrome.alarms.create(alarmName, {
      delayInMinutes,
      periodInMinutes: 60 * 24 // Daily check
    });
    
    console.log(`Scheduled alarm ${alarmName} for ${scheduledTime.toLocaleString()} (in ${delayInMinutes.toFixed(2)} minutes)`);
  }

  setupEventHandlers() {
    document.getElementById('add-reminder').addEventListener('click', () => {
      this.addNewReminder();
    });
  }

  getStorageData(keys) {
    return new Promise(resolve => {
      chrome.storage.local.get(keys, resolve);
    });
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new SettingsReminders();
    }
    return this.instance;
  }
}

// Create singleton instance
const settingsReminders = SettingsReminders.getInstance();
export default settingsReminders;