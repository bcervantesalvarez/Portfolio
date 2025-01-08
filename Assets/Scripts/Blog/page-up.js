// Function to scroll to the top
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  // Attach an event listener to the parent pagination container using delegation
  function enableScrollOnPaginationClicks() {
    const paginationContainer = document.querySelector('.pagination');
    if (!paginationContainer) return;
  
    paginationContainer.addEventListener('click', (event) => {
      // Check if the clicked element is an <a> tag within the pagination container
      const target = event.target;
      if (target.tagName.toLowerCase() === 'a') {
        scrollToTop();
      }
    });
  }
  
  // Initialize the delegation after the DOM content is loaded
  document.addEventListener('DOMContentLoaded', enableScrollOnPaginationClicks);
  