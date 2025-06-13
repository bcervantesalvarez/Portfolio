document.addEventListener('DOMContentLoaded', function() {
    const subtitleElement = document.querySelector('.subtitle');
    const roles = ['Data Scientist', 'Statistician', 'Educator'];
    let currentRoleIndex = 0;
    let charIndex = 0;
    const typingSpeed = 100;
    const deletingSpeed = 50;
    const delayBetweenRoles = 2000;

    // Store original content to preserve it
    const originalContent = subtitleElement.innerHTML;
    
    // Create a wrapper for just the text content
    const textWrapper = document.createElement('span');
    textWrapper.className = 'role-text';
    
    // Create cursor element
    const cursorElement = document.createElement('span');
    cursorElement.textContent = '|';
    cursorElement.style.display = 'inline-block';
    cursorElement.style.animation = 'none';

    // CSS for blinking cursor
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes blink {
            50% { opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    // Clear subtitle and add our controlled elements
    subtitleElement.innerHTML = '';
    subtitleElement.appendChild(textWrapper);
    subtitleElement.appendChild(cursorElement);

    function updateText() {
        // SAFE: Only update the text wrapper, not the entire subtitle
        textWrapper.textContent = roles[currentRoleIndex].substring(0, charIndex);
    }

    function typeRole() {
        if (charIndex <= roles[currentRoleIndex].length) {
            updateText();
            charIndex++;
            cursorElement.style.animation = 'none';
            setTimeout(typeRole, typingSpeed);
        } else {
            cursorElement.style.animation = 'blink 0.7s step-start infinite';
            setTimeout(deleteRole, delayBetweenRoles);
        }
    }

    function deleteRole() {
        if (charIndex >= 0) {
            updateText();
            charIndex--;
            cursorElement.style.animation = 'none';
            setTimeout(deleteRole, deletingSpeed);
        } else {
            currentRoleIndex = (currentRoleIndex + 1) % roles.length;
            cursorElement.style.animation = 'blink 0.7s step-start infinite';
            setTimeout(typeRole, typingSpeed);
        }
    }

    // Start the typing animation
    typeRole();
});