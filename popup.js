// Open links when the menu items are clicked
function executeLinks(links) {
  console.log('Executing links:', links); // Debug log
  chrome.runtime.sendMessage({ action: 'openLinks', links: links });
}

// Add event listeners for menu items
document.getElementById('menu1').addEventListener('click', () => executeLinks([
  "https://www.facebook.com/account_status",
  "https://www.facebook.com/support/?tab_type=APPEALS",
  "https://www.facebook.com/settings/?tab=profile_recommendations&show_recommendable_nux=0",
  "https://www.facebook.com/settings/?tab=profile_management_history"
]));

document.getElementById('menu2').addEventListener('click', () => executeLinks([
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
]));

document.getElementById('menu3').addEventListener('click', () => executeLinks([
  "https://www.facebook.com/profile_status/?referrer=profile_settings",
  "https://accountscenter.facebook.com/personal_info",
  "https://www.facebook.com/your_information/?tab=your_information&tile=personal_info_grouping",
  "https://accountscenter.facebook.com/password_and_security",
  "https://www.facebook.com/notifications",
  "https://www.facebook.com/business-support-home/"
]));

document.getElementById('menu4').addEventListener('click', () => executeLinks([
  "https://www.facebook.com/settings/?tab=followers_and_public_content"
]));

document.getElementById('menu5').addEventListener('click', () => executeLinks([
  "https://www.facebook.com/groups/create/"
]));

document.getElementById('menu6').addEventListener('click', () => executeLinks([
  "https://business.facebook.com/billing_hub/payment_activity?asset_id=",
  "https://business.facebook.com/latest/settings/ad_accounts?business_id=",
  "https://business.facebook.com/latest/monetization/monetization_policy_issues/monetization_policy_issues_violations?asset_id=",
  "https://business.facebook.com/latest/settings/pages?business_id=",
  "https://business.facebook.com/latest/settings/business_users?business_id=",
  "https://business.facebook.com/business-support-home",
  "https://business.facebook.com/billing_hub/accounts?business_id="
]));

document.getElementById('menu7').addEventListener('click', () => executeLinks([
  "https://www.facebook.com/pages/creation/"
]));

document.getElementById('menu9').addEventListener('click', () => executeLinks([
  "https://www.facebook.com/settings/?tab=profile_access"
]));

document.getElementById('menu10').addEventListener('click', () => executeLinks([
  "https://www.facebook.com/professional_dashboard/moderation_assist"
]));

// Close all tabs functionality
document.getElementById('close-all-tabs').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'closeAllTabs' });
});
