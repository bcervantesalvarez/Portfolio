document.addEventListener('DOMContentLoaded', () => {
    // Define arrays of indices for new projects and new blog posts
    const newProjectsIndices = [0, 7]; // Example indices for new project cards [0-3] first row, [4-7] second row
    const newBlogPostIndices = [0,1]; // Example indices for new blog posts [0-N] where N = n-1 blog pages

    // Function to add banners to specified elements
    const addNewBanners = (selector, indices) => {
        const elements = document.querySelectorAll(selector);
        indices.forEach(index => {
            if (elements.length > index) { // Check if the element exists
                const newBanner = document.createElement('div');
                newBanner.className = 'new-banner';
                newBanner.textContent = 'New!';
                elements[index].prepend(newBanner);
            }
        });
    };

    // Adding banners to project cards
    addNewBanners('.quarto-grid-item', newProjectsIndices);

    // Adding banners to blog posts
    addNewBanners('.quarto-post', newBlogPostIndices);
});
