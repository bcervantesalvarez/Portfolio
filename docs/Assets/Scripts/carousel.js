document.addEventListener("DOMContentLoaded", function() {
    // Initialize the carousel
    var myCarousel = document.querySelector('#carouselExampleIndicators');
    var carousel = new bootstrap.Carousel(myCarousel, {
      interval: 5000, // Auto-slide interval (5 seconds)
      wrap: true      // Allows carousel to loop
    });
  
    // Event listeners for manual control
    var prevButton = document.querySelector('.carousel-control-prev');
    var nextButton = document.querySelector('.carousel-control-next');
  
    prevButton.addEventListener('click', function(event) {
      event.preventDefault();
      carousel.prev(); // Go to the previous slide
    });
  
    nextButton.addEventListener('click', function(event) {
      event.preventDefault();
      carousel.next(); // Go to the next slide
    });
  });  