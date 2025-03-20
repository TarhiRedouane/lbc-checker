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
  
  // Event listeners
  document.getElementById('save-settings').addEventListener('click', saveSettings);
  document.getElementById('back-to-popup').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openPopup' });
    window.close();
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
  
  // Create the category title
  const titleDiv = document.createElement('div');
  titleDiv.className = 'category-title';
  titleDiv.innerHTML = `<i class="${category.icon}"></i> ${category.name}`;
  categoryDiv.appendChild(titleDiv);
  
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
  
  // Save general settings
  const sequentialMode = document.getElementById('sequential-mode').checked;
  const openDelay = parseInt(document.getElementById('open-delay').value, 10) || 0;
  const notes = document.getElementById('notes-content').value;
  
  console.log('Settings saved:', {
    sequentialMode: sequentialMode,
    openDelay: openDelay
  });

  // Save all settings to Chrome storage
  chrome.storage.local.set({
    categories,
    sequentialMode,
    openDelay,
    notes
  }, () => {
    // Show saved message
    const savedMessage = document.getElementById('saved-message');
    savedMessage.style.display = 'block';
    setTimeout(() => {
      savedMessage.style.display = 'none';
    }, 3000);
  });
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