// Import default categories for initialization
import { defaultCategories } from './default-categories.js';

// Settings data management class
export class SettingsData {
  static get defaultCategories() {
    return defaultCategories;
  }
}

export default SettingsData;