let currentTypingSession = null;

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log('content.js: Message received:', request.action); // Log message received

    if (request.action === "emulateTyping") {
        console.log("content.js: Action received: emulateTyping");
        currentTypingSession = Math.random().toString(); // Create a new unique typing session identifier
        navigator.clipboard
            .readText()
            .then((clipText) => {
                console.log("content.js: Clipboard text read:", clipText); // Log clipboard text
                emulateTyping(clipText, currentTypingSession, request.delayedStart);
            });
    } else if (request.action === "stopTyping") {
        currentTypingSession = null; // Invalidate the current typing session
    }
});

// Listen for any keydown event at the window level
window.addEventListener("keydown", function () {
    currentTypingSession = null; // Invalidate the current typing session
    console.log('content.js: Keydown event detected'); // Log keydown event
});

// Listen for paste events on all input and textarea elements
document.querySelectorAll('input, textarea').forEach(element => {
    element.addEventListener('paste', (e) => {
        // Prevent the default paste action
        e.preventDefault();
        
        // Get the text from the clipboard
        const text = (e.clipboardData || window.clipboardData).getData('text');
        
        // Simulate typing
        emulateTyping(text, currentTypingSession);
    });
});

function emulateTyping(text, session, delayedStart) {
    const activeElement = document.activeElement;
    console.log('content.js: Active element:', activeElement); // Log the active element

    let i = 0;

    const startTyping = function () {
        function typeNextCharacter() {
            console.log('content.js: Typing character', text[i]); // Log character being typed

            if (i < text.length && session === currentTypingSession) {
                // Create a KeyboardEvent instance
                let event = new KeyboardEvent("keydown", {
                    key: text[i],
                    code: "Key" + text[i].toUpperCase(),
                    charCode: text[i].charCodeAt(0),
                    keyCode: text[i].charCodeAt(0),
                    which: text[i].charCodeAt(0),
                });

                // Dispatch the event
                activeElement.dispatchEvent(event);

                // Attempt to insert the text using document.execCommand
                document.execCommand("insertText", false, text[i]);

                // Add the delay between character insertions.
                let delay = calculateDelay(text[i],text[i+1])

                setTimeout(typeNextCharacter, delay);
                i++;
            }
        }

        typeNextCharacter();
    };

    //More natural delay calculation.
    const calculateDelay = (currentChar, nextChar) => {
        // Base typing speed (milliseconds)
        const baseDelay = 10;
        // Introduce variability
        const variability = 50;
        // Adjust speed for spaces and punctuation for a more natural effect
        const isSpaceOrPunctuation = /[\s,.!?;:]/;

        let delay = baseDelay + Math.random() * variability;

        // If the next character is a space or punctuation, add a slight pause
        if (isSpaceOrPunctuation.test(nextChar)) {
            delay += 100;
        }

        // If the current character is a space or punctuation, add a slight pause
        if (isSpaceOrPunctuation.test(currentChar)) {
            delay += 50;
        }

        return delay;
    };

    if (delayedStart) {
        console.log('content.js: Starting typing with a delay');
        setTimeout(startTyping, 0); // Delay is in milliseconds
    } else {
        startTyping();
    }
}
