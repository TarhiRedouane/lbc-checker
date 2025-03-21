// Categories management module for settings
window.SettingsCategories = (() => {
  // Load categories from storage or use defaults
  const loadCategories = () => {
    chrome.storage.local.get(['categories'], ({ categories }) => {
      const finalCategories = categories || window.SettingsData.defaultCategories;
      const container = document.getElementById('categories-container');
      container.innerHTML = ''; // Clear container
      
      // Create UI for each category
      Object.entries(finalCategories).forEach(([menuId, category]) => {
        const categoryElement = createCategoryElement(menuId, category);
        container.appendChild(categoryElement);
      });
    });
  };

  // Create a category element with its links
  const createCategoryElement = (menuId, category) => {
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
    category.links.forEach((link) => {
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
  };

  // Restore default links for a specific category
  const restoreDefaultLinks = (menuId, categoryElement) => {
    const defaultCategory = window.SettingsData.defaultCategories[menuId];
    if (defaultCategory) {
      // Show confirmation dialog
      if (confirm(`Are you sure you want to restore default links for "${defaultCategory.name}"? This will replace all your custom links for this category.`)) {
        const linksContainer = categoryElement.querySelector('.links-container');
        linksContainer.innerHTML = ''; // Clear existing links
        
        // Add default links back
        defaultCategory.links.forEach(link => {
          const linkItem = createLinkItem(link);
          linksContainer.appendChild(linkItem);
        });
        
        // Show confirmation message
        const savedMessage = document.getElementById('saved-message');
        savedMessage.textContent = `Default links restored for ${defaultCategory.name}`;
        savedMessage.style.display = 'block';
        setTimeout(() => {
          savedMessage.textContent = 'Settings saved successfully!';
          savedMessage.style.display = 'none';
        }, 3000);
      }
    }
  };

  // Create a link input item
  const createLinkItem = (link) => {
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
  };

  // Get categories from the DOM for saving
  const getCategories = () => {
    const categories = {};
    
    // Get all categories
    document.querySelectorAll('.category').forEach(categoryElement => {
      const menuId = categoryElement.dataset.menuId;
      const [icon, name] = Array.from(categoryElement.querySelector('.category-title').childNodes)
        .filter(node => node.nodeType !== Node.TEXT_NODE)
        .map(node => node.className || node.textContent.trim());
      
      // Get all links for this category
      const links = Array.from(categoryElement.querySelectorAll('.link-input'))
        .map(input => input.value.trim())
        .filter(Boolean);
      
      categories[menuId] = {
        name,
        icon,
        links
      };
    });
    
    return categories;
  };
  
  // Public API
  return {
    loadCategories,
    getCategories
  };
})();