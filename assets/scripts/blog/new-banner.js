document.addEventListener('DOMContentLoaded', () => {
    // Function to check if the current page is the first page based on the URL hash
    function isFirstPage() {
      const hash = window.location.hash;
      // If there's no page indicator in the hash or it's set to page=1, we consider it the first page
      return !hash.includes('page=') || hash.includes('page=1');
    }
  
    // Only proceed if on the first blog page
    if (!isFirstPage()) return;
  
    // Define arrays of indices for new projects and new blog posts
    const newProjectsIndices = [2, 7]; 
    const newBlogPostIndices = [0];
  
    // Function to add banners to specified elements
    const addNewBanners = (selector, indices) => {
      const elements = document.querySelectorAll(selector);
      indices.forEach(index => {
        if (elements.length > index) { 
          const newBanner = document.createElement('div');
          newBanner.className = 'new-banner';
          newBanner.textContent = 'New!';
          elements[index].prepend(newBanner);
        }
      });
    };
  
    // Adding banners to project cards and blog posts
    addNewBanners('.quarto-grid-item', newProjectsIndices);
    addNewBanners('.quarto-post', newBlogPostIndices);
  });
  