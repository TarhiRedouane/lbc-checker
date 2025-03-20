// Default links for each menu item (will be used if custom links are not set)
const defaultLinks = {
  'menu1': [
    "https://www.facebook.com/account_status",
    "https://www.facebook.com/support/?tab_type=APPEALS",
    "https://www.facebook.com/settings/?tab=profile_recommendations&show_recommendable_nux=0",
    "https://www.facebook.com/settings/?tab=profile_management_history"
  ],
  'menu2': [
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
  ],
  'menu3': [
    "https://www.facebook.com/profile_status/?referrer=profile_settings",
    "https://accountscenter.facebook.com/personal_info",
    "https://www.facebook.com/your_information/?tab=your_information&tile=personal_info_grouping",
    "https://accountscenter.facebook.com/password_and_security",
    "https://www.facebook.com/notifications",
    "https://www.facebook.com/business-support-home/"
  ],
  'menu4': [
    "https://www.facebook.com/settings/?tab=followers_and_public_content"
  ],
  'menu5': [
    "https://www.facebook.com/groups/create/"
  ],
  'menu6': [
    "https://business.facebook.com/billing_hub/payment_activity?asset_id=",
    "https://business.facebook.com/latest/settings/ad_accounts?business_id=",
    "https://business.facebook.com/latest/monetization/monetization_policy_issues/monetization_policy_issues_violations?asset_id=",
    "https://business.facebook.com/latest/settings/pages?business_id=",
    "https://business.facebook.com/latest/settings/business_users?business_id=",
    "https://business.facebook.com/business-support-home",
    "https://business.facebook.com/billing_hub/accounts?business_id="
  ],
  'menu7': [
    "https://www.facebook.com/pages/creation/"
  ],
  'menu9': [
    "https://www.facebook.com/settings/?tab=profile_access"
  ],
  'menu10': [
    "https://www.facebook.com/professional_dashboard/moderation_assist"
  ]
};

// Open links function that uses stored links or defaults
function executeLinks(menuId) {
  console.log('Getting links for menu:', menuId);
  
  // Get links from storage
  chrome.storage.local.get(['categories'], function(result) {
    let links;
    
    if (result.categories && result.categories[menuId] && result.categories[menuId].links) {
      links = result.categories[menuId].links;
      console.log('Found stored links:', links);
    } else {
      links = defaultLinks[menuId];
      console.log('Using default links:', links);
    }
    
    // Send message to background script to open links
    chrome.runtime.sendMessage({ action: 'openLinks', links: links });
  });
}

// Initialize event listeners when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Add click event listeners for each menu item
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(item => {
    item.addEventListener('click', function() {
      if (this.id === 'settings-button') {
        chrome.runtime.sendMessage({ action: 'openSettings' });
        window.close(); // Close popup
      } else {
        executeLinks(this.id);
      }
    });
  });
  
  // Close all tabs functionality
  document.getElementById('close-all-tabs').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'closeAllTabs' });
  });
  
  // Initialize dark mode
  initDarkMode();
});

// Initialize dark mode from saved preference
function initDarkMode() {
  const modeToggle = document.getElementById('mode-toggle');
  const body = document.body;
  
  // Load user preference from storage
  chrome.storage.local.get(['darkMode'], function(result) {
    const isDarkMode = result.darkMode === true;
    
    // Apply the mode based on saved preference
    if (isDarkMode) {
      body.classList.remove('light-mode');
      body.classList.add('dark-mode');
      modeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      body.classList.add('light-mode');
      body.classList.remove('dark-mode');
      modeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
  });
  
  // Toggle dark/light mode
  modeToggle.addEventListener('click', () => {
    if (body.classList.contains('light-mode')) {
      // Switch to dark mode
      body.classList.remove('light-mode');
      body.classList.add('dark-mode');
      modeToggle.innerHTML = '<i class="fas fa-sun"></i>';
      chrome.storage.local.set({ darkMode: true });
    } else {
      // Switch to light mode
      body.classList.add('light-mode');
      body.classList.remove('dark-mode');
      modeToggle.innerHTML = '<i class="fas fa-moon"></i>';
      chrome.storage.local.set({ darkMode: false });
    }
  });
}
