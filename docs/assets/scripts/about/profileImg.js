document.addEventListener('DOMContentLoaded', function() {
    const aboutEntity = document.querySelector('.about-entity');

    // Function to trigger the shining effect
    function triggerShine() {
      aboutEntity.classList.add('shining');

      // Remove the class after the animation duration to reset the effect
      setTimeout(function() {
        aboutEntity.classList.remove('shining');
      }, 1500); // Match this with the duration of the shine animation (2 seconds)
    }

    // Initial trigger
    triggerShine();

    // Trigger the shining effect every 10 seconds
    setInterval(triggerShine, 10000);
  });


