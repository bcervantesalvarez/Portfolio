// assets/llm/chat-main.js
/**
 * Main Chat Application Logic
 * Coordinates all modules and handles user interactions
 */

import { chatState, modelConfigs } from './chat-config.js';
import {
  elements,
  addMessage,
  addTypingIndicator,
  removeTypingIndicator,
  streamText,
  setupInputResize,
  setupDropdowns
} from './chat-ui.js';
import { simulateThinking } from './chat-local.js';
import {
  initializeModel,
  isModelReady,
  generateResponse
} from './chat-models.js';
import { ingestCurrentPage } from './chat-rag.js';
import { showTemporaryMessage } from './chat-ui.js';


document.addEventListener('DOMContentLoaded', () => ingestCurrentPage());

// Main chat handler
async function ask(text) {
  disableInput();
  addMessage('you', text);
  const typingIndicator = addTypingIndicator();

  try {
    const model = chatState.currentModel;

    // ensure model is loaded
    if (!isModelReady(model)) {
      addMessage(
        'system',
        `Switching to ${modelConfigs[model].description}…`,
        'loading'
      );
      const ok = await initializeModel(model);
      if (!ok) {
        enableInput();
        return;
      }
    }

    // get the reply
    const reply = await generateResponse(model, text);

    // only simulate delay for local
    if (model === 'local') {
      await simulateThinking();
    }

    // render
    removeTypingIndicator(typingIndicator);
    const { content } = addMessage('bot', '');
    await streamText(content, reply, 30);

  } catch (err) {
    removeTypingIndicator(typingIndicator);
    console.error(err);
    addMessage('system', '⚠️ Error. Please try again.', 'warning');
  } finally {
    enableInput();
  }
}

function disableInput() {
  elements.input.disabled = true;
  elements.sendButton.disabled = true;
}

function enableInput() {
  elements.input.disabled = false;
  elements.sendButton.disabled = false;
}

// Initial welcome
function initializeChat() {
  addMessage(
    'system',
    "Hi! I'm YappifyGPT Local. For deeper answers, switch models via the dropdown.",
    'info'
  );
}

// Model switching logic
function setupModelSwitching() {
  document.addEventListener('modelChanged', async ({ detail }) => {
    const newModel = detail.model;
    if (newModel === chatState.currentModel) return;
    chatState.currentModel = newModel;

    const cfg = modelConfigs[newModel];
    if (!cfg) return;

    // show a temporary loader
    showTemporaryMessage(`Loading ${cfg.description}…`, 'loading', 3000);
    const ok = await initializeModel(newModel);
    if (!ok) return;

    // now show a temporary “ready!” banner
    showTemporaryMessage(`✅ ${cfg.description} ready!`, 'success', 3000);
  });

  // disabled-option helper
  elements.modelOptions.forEach(opt => {
    if (opt.classList.contains('disabled')) {
      opt.addEventListener('click', e => {
        e.stopPropagation();
        addMessage(
          'system',
          'That model isn’t available yet.',
          'info'
        );
      });
    }
  });
}

// Wire up all listeners
function setupEventListeners() {
  // open/close
  elements.openBtn.addEventListener('click', () => {
    elements.overlay.classList.add('open');
    elements.input.focus();
    if (!elements.log.children.length) initializeChat();
  });
  elements.closeBtn.addEventListener('click', () =>
    elements.overlay.classList.remove('open')
  );
  elements.overlay.addEventListener('click', e => {
    if (e.target === elements.overlay)
      elements.overlay.classList.remove('open');
  });

  // submit
  elements.form.addEventListener('submit', async e => {
    e.preventDefault();
    const txt = elements.input.value.trim();
    if (!txt || chatState.isLoading) return;
    elements.input.value = '';
    elements.input.style.height = 'auto';
    await ask(txt);
  });

  setupInputResize();
  setupDropdowns();
  setupModelSwitching();
}

// bootstrap
function initialize() {
  console.log('🚀 Chat system ready');
  setupEventListeners();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
