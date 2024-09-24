document.addEventListener('DOMContentLoaded', function() {
    const subtitleElement = document.querySelector('.subtitle');
    const roles = ['Data Scientist', 'Statistician', 'Educator'];
    let currentRoleIndex = 0;
    let charIndex = 0;
    const typingSpeed = 100; // milliseconds per character
    const deletingSpeed = 50; // milliseconds per character
    const delayBetweenRoles = 2000; // delay before typing the next role

    // Create a cursor element in JavaScript
    const cursorElement = document.createElement('span');
    cursorElement.textContent = '|';
    cursorElement.style.display = 'inline-block';
    cursorElement.style.animation = 'none'; // Initially, no blinking while typing

    // CSS for blinking cursor
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes blink {
            50% { opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    // Add the cursor to the subtitle element
    subtitleElement.appendChild(cursorElement);

    function updateText() {
        subtitleElement.textContent = roles[currentRoleIndex].substring(0, charIndex);
        subtitleElement.appendChild(cursorElement); // Re-attach cursor after the text
    }

    function typeRole() {
        if (charIndex <= roles[currentRoleIndex].length) {
            updateText();
            charIndex++;
            cursorElement.style.animation = 'none'; // Cursor is solid during typing
            setTimeout(typeRole, typingSpeed);
        } else {
            cursorElement.style.animation = 'blink 0.7s step-start infinite'; // Cursor blinks after typing
            setTimeout(deleteRole, delayBetweenRoles);
        }
    }

    function deleteRole() {
        if (charIndex >= 0) {
            updateText();
            charIndex--;
            cursorElement.style.animation = 'none'; // Cursor is solid during deletion
            setTimeout(deleteRole, deletingSpeed);
        } else {
            currentRoleIndex = (currentRoleIndex + 1) % roles.length;
            cursorElement.style.animation = 'blink 0.7s step-start infinite'; // Cursor blinks while waiting
            setTimeout(typeRole, typingSpeed);
        }
    }

    // Start the typing animation
    typeRole();
});
