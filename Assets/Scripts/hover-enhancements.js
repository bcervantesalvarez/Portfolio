document.addEventListener('DOMContentLoaded', (event) => {
    const newItemsIndices = [0]; // Example: Marks the 
    const cards = document.querySelectorAll('.quarto-grid-item');

    newItemsIndices.forEach(index => {
        if (cards.length > index) { // Check if the card exists
            const newBanner = document.createElement('div');
            newBanner.className = 'new-banner';
            newBanner.textContent = 'New!';
            cards[index].prepend(newBanner);
        }
    });
});
