// Default categories data - contains all predefined menu categories with their names, icons, and links
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

// For non-module scripts
if (typeof window !== 'undefined') {
  window.LBC_DEFAULT_CATEGORIES = defaultCategories;
}

// For service workers and background scripts
if (typeof self !== 'undefined') {
  self.LBC_DEFAULT_CATEGORIES = defaultCategories;
}