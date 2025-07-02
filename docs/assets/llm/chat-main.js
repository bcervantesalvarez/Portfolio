// assets/llm/chat-main.js
/**
 * Main Chat Application Logic
 * Coordinates all modules and handles user interactions
 */

import { chatState } from './chat-config.js';
import { 
  elements, 
  addMessage, 
  addTypingIndicator, 
  removeTypingIndicator, 
  streamText, 
  showGuidingQuestions, 
  handleSpecialCommands,
  setupInputResize,
  setupDropdowns 
} from './chat-ui.js';
import { generateLocalResponse, simulateThinking } from './chat-local.js';
import { initializeQwen, generateQwenResponse, isQwenReady } from './chat-qwen.js';
import { ingestCurrentPage } from "./chat-rag.js";

document.addEventListener("DOMContentLoaded", () => ingestCurrentPage());

// Main chat handler
async function ask(text) {
  elements.input.disabled = true;
  elements.sendButton.disabled = true;

  addMessage("you", text);
  const typingIndicator = addTypingIndicator();

  try {
    let reply;

    /* ── LOCAL (Yappify 1.0) ───────────────────────────────────── */
    if (chatState.currentModel === "local") {
      reply = await generateLocalResponse(text);   // ← await the Promise
      await simulateThinking();                    // optional typing delay
    }

    /* ── Qwen (remote-size) ───────────────────────────────────── */
    else if (chatState.currentModel === "qwen") {
      if (!await isQwenReady()) {
        addMessage("system", "Qwen model is loading…", "loading");
        const ok = await initializeQwen();
        if (!ok) { enableInput(); return; }
        return ask(text);                          // rerun with Qwen ready
      }
      reply = await generateQwenResponse(text);
    }

    /* ── stream the assistant reply ───────────────────────────── */
    removeTypingIndicator(typingIndicator);
    const { content } = addMessage("bot", "");
    await streamText(content, reply, 30);

  } catch (err) {
    removeTypingIndicator(typingIndicator);
    console.error(err);
    addMessage("system", "⚠️ Error. Please try again.", "warning");
  } finally {
    enableInput();
  }
}

/* helper so we don’t repeat two lines */
function enableInput() {
  elements.input.disabled = false;
  elements.sendButton.disabled = false;
}

// Initialize chat interface
function initializeChat() {
  console.log("✅ Chat system initialized");
  
  // Start with YappifyGPT Local welcome message
  addMessage("system", "Hi! I'm Yappify 1.0, running locally in your browser. I can answer general questions about Brian's background and work. For detailed project information, try switching to the Qwen 2.5 model! I can also yap about other topics when using Qwen 2.5!", "info");
  
  setTimeout(() => showGuidingQuestions(), 1000);
}

// Model switching logic
function setupModelSwitching() {
  // Listen for the custom model change event
  document.addEventListener('modelChanged', async (event) => {
    const { model: newModel, name, description } = event.detail;
    
    if (newModel === chatState.currentModel) return; // Already selected
    
    chatState.currentModel = newModel;
    
    if (chatState.currentModel === "local") {
      addMessage("system", "Switched to YappifyGPT 1.0 (Local). Fast responses with general knowledge about Brian!", "success");
    } else if (chatState.currentModel === "qwen") {
      if (!isQwenReady()) {
        addMessage("system", "Switching to Qwen model... This will download the model (may take a moment).", "loading");
        await initializeQwen();
      } else {
        addMessage("system", "Switched to Qwen model. Full access to Brian's portfolio knowledge base!", "success");
      }
    }
  });

  // Also handle direct clicks on disabled options to show messages
  elements.modelOptions.forEach(option => {
    if (option.classList.contains('disabled')) {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        addMessage("system", "This model is coming soon! Currently you can use YappifyGPT Local or Qwen models.", "info");
      });
    }
  });
}

// Setup event listeners
function setupEventListeners() {
  // Open/close chat
  elements.openBtn.addEventListener("click", async () => {
    elements.overlay.classList.add("open");
    elements.input.focus();
    
    // Initialize with local model (no automatic download)
    if (elements.log.children.length === 0) {
      initializeChat();
    }
  });

  elements.closeBtn.addEventListener("click", () => {
    elements.overlay.classList.remove("open");
  });

  elements.overlay.addEventListener("click", (e) => {
    if (e.target === elements.overlay) {
      elements.overlay.classList.remove("open");
    }
  });

  // Form submission
  elements.form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = elements.input.value.trim();
    if (!text || chatState.isLoading) return;
    
    elements.input.value = "";
    elements.input.style.height = "auto";
    
    // Check for special commands first
    if (handleSpecialCommands(text)) {
      return;
    }
    
    await ask(text);
  });

  // Setup input handling
  setupInputResize();
  
  // Setup all dropdowns
  setupDropdowns();
  
  // Setup model switching
  setupModelSwitching();
}

// Initialize everything when DOM is ready
function initialize() {
  console.log("🚀 Enhanced chat system ready with YappifyGPT Local and user-triggered Qwen");
  setupEventListeners();
}

// Start the application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}