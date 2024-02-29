document.addEventListener('DOMContentLoaded', function() {
    const gridItems = document.querySelectorAll('.quarto-grid-item');

    gridItems.forEach(item => {
        item.addEventListener('mousemove', function(e) {
            const bounds = this.getBoundingClientRect();
            const centerX = bounds.left + bounds.width / 2;
            const centerY = bounds.top + bounds.height / 2;
            const deltaX = e.clientX - centerX;
            const deltaY = e.clientY - centerY;
            const maxDistance = 50; // Maximum distance the card will move

            // Calculate the movement ratio
            const ratioX = Math.max(-1, Math.min(1, deltaX / maxDistance));
            const ratioY = Math.max(-1, Math.min(1, deltaY / maxDistance));

            // Apply the transformation
            const translateX = ratioX * 10; // Adjust this value if you want more or less movement
            const translateY = ratioY * 10; // Adjust this value if you want more or less movement

            this.style.transform = `scale(1.1) translate(${translateX}px, ${translateY}px)`;
        });

        item.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1) translate(0px, 0px)';
        });
    });
});

