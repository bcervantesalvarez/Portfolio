document.addEventListener('DOMContentLoaded', () => {
    // Define arrays of indices for new projects and new blog posts
    const newProjectsIndices = [0]; // Example indices for new project cards
    const newBlogPostIndices = [0]; // Example indices for new blog posts

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
