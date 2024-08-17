document.addEventListener('DOMContentLoaded', function() {
    const subtitleElement = document.querySelector('.subtitle');
    const roles = ['Data Scientist', 'Statistician', 'Educator'];
    let currentRoleIndex = 0;
    let charIndex = 0;
    let typingSpeed = 100; // milliseconds per character
    let deletingSpeed = 50; // milliseconds per character
    let delayBetweenRoles = 2000; // delay before typing the next role

    function typeRole() {
        // Ensure the element is cleared before typing starts
        if (charIndex === 0) {
            subtitleElement.textContent = '';
        }

        if (charIndex < roles[currentRoleIndex].length) {
            subtitleElement.textContent += roles[currentRoleIndex].charAt(charIndex);
            charIndex++;
            setTimeout(typeRole, typingSpeed);
        } else {
            setTimeout(deleteRole, delayBetweenRoles);
        }
    }

    function deleteRole() {
        if (charIndex > 0) {
            subtitleElement.textContent = roles[currentRoleIndex].substring(0, charIndex - 1);
            charIndex--;
            setTimeout(deleteRole, deletingSpeed);
        } else {
            currentRoleIndex = (currentRoleIndex + 1) % roles.length;
            setTimeout(typeRole, typingSpeed);
        }
    }

    // Start the typing animation
    typeRole();
});
