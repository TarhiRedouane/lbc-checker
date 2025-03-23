// Import SettingsData for default categories
import SettingsData from './settings-data.js';

// Categories management class for settings
export class SettingsCategories {
  constructor() {
    this.container = document.getElementById('categories-container');
  }

  async loadCategories() {
    const { categories } = await this.getStorageData(['categories']);
    const finalCategories = categories || SettingsData.defaultCategories;
    this.container.innerHTML = ''; // Clear container
    
    // Create UI for each category
    Object.keys(finalCategories).forEach(menuId => {
      const category = finalCategories[menuId];
      const categoryElement = this.createCategoryElement(menuId, category);
      this.container.appendChild(categoryElement);
    });
  }

  createCategoryElement(menuId, category) {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'category';
    categoryDiv.dataset.menuId = menuId;
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'category-header';
    
    const titleDiv = document.createElement('div');
    titleDiv.className = 'category-title';
    titleDiv.innerHTML = `<i class="${category.icon}"></i> ${category.name}`;
    headerDiv.appendChild(titleDiv);
    
    const restoreButton = document.createElement('button');
    restoreButton.className = 'restore-defaults';
    restoreButton.innerHTML = '<i class="fas fa-undo-alt"></i> Restore Default Links';
    restoreButton.addEventListener('click', () => {
      this.restoreDefaultLinks(menuId, categoryDiv);
    });
    headerDiv.appendChild(restoreButton);
    
    categoryDiv.appendChild(headerDiv);
    
    const linksContainer = document.createElement('div');
    linksContainer.className = 'links-container';
    categoryDiv.appendChild(linksContainer);
    
    category.links.forEach(link => {
      const linkItem = this.createLinkItem(link);
      linksContainer.appendChild(linkItem);
    });
    
    const addLinkButton = document.createElement('button');
    addLinkButton.className = 'add-link';
    addLinkButton.innerHTML = '<i class="fas fa-plus"></i> Add Link';
    addLinkButton.addEventListener('click', () => {
      const newLinkItem = this.createLinkItem('');
      linksContainer.appendChild(newLinkItem);
    });
    categoryDiv.appendChild(addLinkButton);
    
    return categoryDiv;
  }

  restoreDefaultLinks(menuId, categoryElement) {
    const defaultCategory = SettingsData.defaultCategories[menuId];
    if (defaultCategory) {
      if (confirm(`Are you sure you want to restore default links for "${defaultCategory.name}"? This will replace all your custom links for this category.`)) {
        const linksContainer = categoryElement.querySelector('.links-container');
        linksContainer.innerHTML = '';
        
        defaultCategory.links.forEach(link => {
          const linkItem = this.createLinkItem(link);
          linksContainer.appendChild(linkItem);
        });
        
        const savedMessage = document.getElementById('saved-message');
        savedMessage.textContent = `Default links restored for ${defaultCategory.name}`;
        savedMessage.style.display = 'block';
        setTimeout(() => {
          savedMessage.textContent = 'Settings saved successfully!';
          savedMessage.style.display = 'none';
        }, 3000);
      }
    }
  }

  createLinkItem(link) {
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

  getCategories() {
    const categories = {};
    
    const categoryElements = document.querySelectorAll('.category');
    categoryElements.forEach(categoryElement => {
      const menuId = categoryElement.dataset.menuId;
      const name = categoryElement.querySelector('.category-title').textContent.trim();
      const icon = categoryElement.querySelector('.category-title i').className;
      
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
    
    return categories;
  }

  getStorageData(keys) {
    return new Promise(resolve => {
      chrome.storage.local.get(keys, resolve);
    });
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new SettingsCategories();
    }
    return this.instance;
  }
}

// Create singleton instance
const settingsCategories = SettingsCategories.getInstance();
export default settingsCategories;