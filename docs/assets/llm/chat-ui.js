// assets/llm/chat-ui.js
/**
 * Advanced UI Helper Functions and DOM Management
 * Enhanced with chat history, transitions, and modern features
 */

import { chatState, guidingQuestions } from './chat-config.js';

// Export the setupModelDropdown function that will be called from chat-main.js
export function setupDropdowns() {
  setupModelDropdown();
  setupToolsDropdown();
  setupInfoButton();
}

// UI Elements
export const elements = {
  openBtn: document.getElementById("openChat"),
  closeBtn: document.getElementById("closeChat"),
  overlay: document.getElementById("chatOverlay"),
  form: document.getElementById("chatForm"),
  input: document.getElementById("chatInput"),
  sendButton: document.getElementById("sendButton"),
  log: document.getElementById("chatLog"),
  modelSelectorBtn: document.getElementById("modelSelectorBtn"),
  modelDropdown: document.getElementById("modelDropdown"),
  currentModelName: document.getElementById("currentModelName"),
  modelOptions: document.querySelectorAll(".model-option"),
  toolsSelectorBtn: document.getElementById("toolsSelectorBtn"),
  toolsDropdown: document.getElementById("toolsDropdown"),
  toolOptions: document.querySelectorAll(".tool-option"),
  infoBtn: document.getElementById("infoBtn"),
  warningText: null // Will be created dynamically
};

// Chat History Management with Sessions
const chatHistory = {
  maxMessages: 100,
  currentSession: null,
  
  initSession: function() {
    this.currentSession = {
      id: Date.now().toString(),
      startTime: new Date().toISOString(),
      messages: []
    };
  },
  
  save: function(who, message, messageType = 'default') {
    try {
      if (!this.currentSession) {
        this.initSession();
      }
      
      const messageData = {
        who,
        message,
        messageType,
        timestamp: new Date().toISOString(),
        model: chatState.currentModel
      };
      
      this.currentSession.messages.push(messageData);
      
      // Save current session
      localStorage.setItem('currentChatSession', JSON.stringify(this.currentSession));
      
      // Also update full history
      let allSessions = JSON.parse(localStorage.getItem('chatSessions') || '[]');
      const sessionIndex = allSessions.findIndex(s => s.id === this.currentSession.id);
      
      if (sessionIndex >= 0) {
        allSessions[sessionIndex] = this.currentSession;
      } else {
        allSessions.push(this.currentSession);
      }
      
      // Keep only last 10 sessions
      if (allSessions.length > 10) {
        allSessions = allSessions.slice(-10);
      }
      
      localStorage.setItem('chatSessions', JSON.stringify(allSessions));
    } catch (e) {
      console.warn('Could not save to chat history:', e);
    }
  },
  
  load: function() {
    try {
      const currentSession = localStorage.getItem('currentChatSession');
      if (currentSession) {
        this.currentSession = JSON.parse(currentSession);
        return this.currentSession.messages || [];
      }
      return [];
    } catch (e) {
      console.warn('Could not load chat history:', e);
      return [];
    }
  },
  
  clear: function() {
    try {
      this.initSession();
      localStorage.setItem('currentChatSession', JSON.stringify(this.currentSession));
    } catch (e) {
      console.warn('Could not clear chat history:', e);
    }
  },
  
  export: function() {
    if (!this.currentSession || this.currentSession.messages.length === 0) {
      return null;
    }
    
    // Filter out system messages - only include user and bot messages
    const conversationMessages = this.currentSession.messages.filter(msg => 
      msg.who === 'you' || msg.who === 'bot'
    );
    
    if (conversationMessages.length === 0) {
      return null;
    }
    
    const exportData = {
      session: {
        id: this.currentSession.id,
        startTime: this.currentSession.startTime,
        exportTime: new Date().toISOString(),
        model: chatState.currentModel,
        messageCount: conversationMessages.length
      },
      messages: conversationMessages
    };
    
    return exportData;
  }
};

// Chat Persistence (Auto-Save)
const chatPersistence = {
  STORAGE_KEY: 'yappify_chat_state',
  AUTO_SAVE_INTERVAL: 3000, // 3 seconds
  autoSaveTimer: null,
  
  saveState() {
    try {
      const messages = [];
      const messageEls = elements.log.querySelectorAll('.message');
      
      messageEls.forEach(el => {
        const content = el.querySelector('.message-content');
        if (content && content.textContent.trim()) {
          messages.push({
            who: el.classList.contains('you') ? 'you' : 
                 el.classList.contains('bot') ? 'bot' : 'system',
            message: content.textContent.trim(),
            messageType: content.classList.contains('success') ? 'success' :
                        content.classList.contains('warning') ? 'warning' :
                        content.classList.contains('info') ? 'info' : 'default'
          });
        }
      });
      
      const state = {
        messages: messages,
        model: chatState.currentModel,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.warn('Failed to save chat state:', e);
      return false;
    }
  },
  
  loadState() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (!saved) return null;
      
      const state = JSON.parse(saved);
      // Check if state is recent (within 24 hours)
      const stateAge = Date.now() - new Date(state.timestamp).getTime();
      if (stateAge > 24 * 60 * 60 * 1000) {
        this.clearState();
        return null;
      }
      
      return state;
    } catch (e) {
      return null;
    }
  },
  
  clearState() {
    localStorage.removeItem(this.STORAGE_KEY);
  },
  
  startAutoSave() {
    this.stopAutoSave();
    this.autoSaveTimer = setInterval(() => {
      this.saveState();
    }, this.AUTO_SAVE_INTERVAL);
  },
  
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }
};

// Message creation functions with enhanced animations
export function addMessage(who, txt, messageType = 'default') {
  const messageEl = document.createElement("div");
  messageEl.className = `message ${who}`;
  
  const content = document.createElement("div");
  content.className = "message-content";
  
  // Add specific styling classes for system messages
  if (who === 'system' && messageType !== 'default') {
    content.classList.add(messageType);
  }
  
  content.textContent = txt;
  
  messageEl.appendChild(content);
  elements.log.appendChild(messageEl);
  
  // Smooth scroll with easing
  requestAnimationFrame(() => {
    elements.log.scrollTo({
      top: elements.log.scrollHeight,
      behavior: 'smooth'
    });
  });
  
  // Save to history (except typing indicators)
  if (txt) {
    chatHistory.save(who, txt, messageType);
    
    // Trigger auto-save
    if (chatPersistence.autoSaveTimer) {
      chatPersistence.saveState();
    }
  }
  
  return { element: messageEl, content: content };
}

export function addTypingIndicator() {
  const messageEl = document.createElement("div");
  messageEl.className = "message bot";
  
  const content = document.createElement("div");
  content.className = "typing-indicator";
  content.innerHTML = `
    <span>Thinking</span>
    <div class="typing-dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;
  
  messageEl.appendChild(content);
  elements.log.appendChild(messageEl);
  
  requestAnimationFrame(() => {
    elements.log.scrollTo({
      top: elements.log.scrollHeight,
      behavior: 'smooth'
    });
  });
  
  return messageEl;
}

export function removeTypingIndicator(indicator) {
  if (indicator && indicator.parentNode) {
    indicator.style.opacity = '0';
    indicator.style.transform = 'scale(0.9)';
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    }, 150);
  }
}

// Enhanced streaming text animation (50% faster)
export function streamText(element, text, baseSpeed = 20) {
  const speed = baseSpeed * 0.5; // 50% faster
  
  return new Promise((resolve) => {
    let i = 0;
    element.textContent = "";
    
    function typeChar() {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        
        // Smooth scroll during typing
        if (i % 10 === 0) {
          requestAnimationFrame(() => {
            elements.log.scrollTo({
              top: elements.log.scrollHeight,
              behavior: 'smooth'
            });
          });
        }
        
        const char = text.charAt(i - 1);
        const delay = char === ' ' ? speed * 0.3 : 
                     char === ',' || char === '.' ? speed * 1.5 :
                     speed;
        
        setTimeout(typeChar, delay);
      } else {
        // Final scroll and save complete message to history
        requestAnimationFrame(() => {
          elements.log.scrollTo({
            top: elements.log.scrollHeight,
            behavior: 'smooth'
          });
        });
        
        // Save the complete bot response to history
        chatHistory.save('bot', text, 'default');
        
        resolve();
      }
    }
    
    typeChar();
  });
}

// Question handling
export function selectQuestion(q, el){
  elements.input.value = q;
  chatState.usedQuestions.add(q);
  el.classList.add('used');
  elements.form.dispatchEvent(new Event('submit')); // fire immediately
}

export function showGuidingQuestions() {
  const questionsEl = document.createElement("div");
  questionsEl.className = "message system";
  questionsEl.style.marginTop = "0.75rem";
  
  const questionsContent = document.createElement("div");
  questionsContent.className = "message-content guiding-questions";
  questionsContent.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 0.5rem;">💡 Try asking me:</div>
    <div id="questions-container"></div>
  `;
  
  questionsEl.appendChild(questionsContent);
  elements.log.appendChild(questionsEl);
  
  // Add questions with click handlers
  const container = questionsContent.querySelector('#questions-container');
  guidingQuestions.forEach(question => {
    const questionDiv = document.createElement('div');
    questionDiv.className = `question-item ${chatState.usedQuestions.has(question) ? 'used' : ''}`;
    questionDiv.textContent = question;
    questionDiv.addEventListener('click', () => selectQuestion(question, questionDiv));
    container.appendChild(questionDiv);
  });
  
  requestAnimationFrame(() => {
    elements.log.scrollTo({
      top: elements.log.scrollHeight,
      behavior: 'smooth'
    });
  });
}

// Special commands handler
export function handleSpecialCommands(text) {
  const lowerText = text.toLowerCase().trim();
  
  if (lowerText === "show questions" || lowerText === "help" || lowerText === "questions") {
    showGuidingQuestions();
    
    setTimeout(() => {
      addMessage("system", "💡 Tip: Type 'show questions' anytime to see these guiding questions again! Questions with ✓ are ones you've already tried.", "info");
    }, 500);
    
    return true;
  }
  
  return false;
}

// Input auto-resize functionality
export function setupInputResize() {
  elements.input.addEventListener("input", () => {
    elements.input.style.height = "auto";
    elements.input.style.height = Math.min(elements.input.scrollHeight, 100) + "px";
  });

  elements.input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        return; // Allow new line
      } else {
        e.preventDefault();
        elements.form.dispatchEvent(new Event('submit'));
      }
    }
  });
}

// Add warning text
export function addWarningText() {
  const warningEl = document.createElement("div");
  warningEl.className = "chat-warning";
  warningEl.textContent = "Yappify can make mistakes. Double check responses.";
  elements.form.appendChild(warningEl);
  elements.warningText = warningEl;
}

// Model dropdown functionality
export function setupModelDropdown() {
  if (!elements.modelSelectorBtn || !elements.modelDropdown || !elements.modelOptions || elements.modelOptions.length === 0) {
    console.error("Model dropdown elements not found");
    return;
  }

  // Remove any existing listeners
  elements.modelSelectorBtn.removeEventListener('click', handleModelDropdownClick);
  elements.modelSelectorBtn.addEventListener('click', handleModelDropdownClick);

  // Close dropdown when clicking outside
  document.removeEventListener('click', handleOutsideClick);
  document.addEventListener('click', handleOutsideClick);

  // Handle model option clicks
  elements.modelOptions.forEach((option) => {
    option.removeEventListener('click', handleModelOptionClick);
    option.addEventListener('click', handleModelOptionClick);
  });
}

// Tools dropdown functionality
export function setupToolsDropdown() {
  if (!elements.toolsSelectorBtn || !elements.toolsDropdown || !elements.toolOptions || elements.toolOptions.length === 0) {
    console.error("Tools dropdown elements not found");
    return;
  }

  // Remove any existing listeners
  elements.toolsSelectorBtn.removeEventListener('click', handleToolsDropdownClick);
  elements.toolsSelectorBtn.addEventListener('click', handleToolsDropdownClick);

  // Handle tool option clicks (but not export-chat)
  elements.toolOptions.forEach((option) => {
    if (option.dataset.action !== 'export-chat') {
      option.removeEventListener('click', handleToolOptionClick);
      option.addEventListener('click', handleToolOptionClick);
    }
  });

  // Setup export format listeners
  setupExportListeners();
}

function setupExportListeners() {
  const toolsDropdown = elements.toolsDropdown;
  if (!toolsDropdown) return;

  // 1) When you click the "Export Chat" parent, toggle the submenu
  const exportParent = toolsDropdown.querySelector('[data-action="export-chat"]');
  if (exportParent) {
    exportParent.addEventListener('click', e => {
      e.stopPropagation();
      const submenu = exportParent.querySelector('.export-submenu');
      if (submenu) submenu.classList.toggle('open');
    });
  }

  // 2) Wire each format button to actually export
  const exportBtns = toolsDropdown.querySelectorAll('.export-format');
  exportBtns.forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const format = btn.dataset.format;
      exportChatFormat(format);
      // close everything
      closeToolsDropdown();
      // also hide submenu
      btn.closest('.export-submenu')?.classList.remove('open');
    });
  });
}

// Info button functionality
export function setupInfoButton() {
  if (!elements.infoBtn) {
    console.error("Info button element not found");
    return;
  }

  elements.infoBtn.addEventListener('click', () => {
    // Open info page in new tab/window
    window.open('/assets/html/llm/model-info.html', '_blank');
  });
}

function handleModelDropdownClick(e) {
  e.preventDefault();
  e.stopPropagation();
  closeToolsDropdown(); // Close tools dropdown if open
  toggleModelDropdown();
}

function handleToolsDropdownClick(e) {
  e.preventDefault();
  e.stopPropagation();
  closeModelDropdown(); // Close model dropdown if open
  toggleToolsDropdown();
}

function handleOutsideClick(e) {
  if (!elements.modelSelectorBtn.contains(e.target) && !elements.modelDropdown.contains(e.target) &&
      !elements.toolsSelectorBtn.contains(e.target) && !elements.toolsDropdown.contains(e.target)) {
    closeModelDropdown();
    closeToolsDropdown();
  }
}

function handleModelOptionClick(e) {
  e.preventDefault();
  e.stopPropagation();
  
  const option = e.target.closest('.model-option');
  if (!option) return;
  
  // Handle model selection
  if (!option.classList.contains('disabled')) {
    const selectedModel = selectModel(option);
    // Trigger custom event for model change
    const event = new CustomEvent('modelChanged', { detail: selectedModel });
    document.dispatchEvent(event);
  }
}

function handleToolOptionClick(e) {
  e.preventDefault();
  e.stopPropagation();
  
  const option = e.target.closest('.tool-option');
  if (!option) return;
  
  // Handle action items
  if (option.dataset.action && !option.classList.contains('disabled')) {
    handleAction(option.dataset.action);
    closeToolsDropdown();
  }
}

function handleAction(action) {
  switch(action) {
    case 'new-chat':
      newChat();
      break;
    case 'export-chat':
      // This is now handled by the submenu - do nothing
      break;
    case 'search-website':
      addMessage("system", "Website search feature is coming soon!", "info");
      break;
  }
}

function newChat() {
  // Clear the chat log immediately - no confirmation popup
  elements.log.innerHTML = '';
  
  // Clear current session
  chatHistory.clear();
  
  // Clear persistence
  chatPersistence.clearState();
  
  // Show welcome message
  addMessage("system", "New chat started. How can I help you today?", "success");
  
  // Show guiding questions
  setTimeout(() => showGuidingQuestions(), 500);
}

// Handle specific format exports
function exportChatFormat(format) {
  console.log('exportChatFormat called with format:', format);
  
  const exportData = chatHistory.export();
  
  if (!exportData) {
    console.log('No export data available');
    addMessage("system", "No conversation messages to export. Start chatting first!", "warning");
    return;
  }
  
  console.log('Export data found:', exportData.messages.length, 'conversation messages');
  
  try {
    switch (format) {
      case 'json':
        console.log('Exporting as JSON');
        exportAsJSON(exportData);
        break;
      case 'xlsx':
        console.log('Exporting as XLSX');
        exportAsXLSX(exportData);
        break;
      case 'csv':
        console.log('Exporting as CSV');
        exportAsCSV(exportData);
        break;
      default:
        console.log('Unknown format, defaulting to JSON');
        exportAsJSON(exportData);
    }
  } catch (error) {
    console.error('Export error:', error);
    addMessage("system", "Export failed. Please try again.", "warning");
  }
}

// Export as JSON
function exportAsJSON(exportData) {
  try {
    const enhancedData = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalMessages: exportData.messages.length,
        exportFormat: 'JSON',
        source: 'Yappify Chat Assistant',
        sessionId: exportData.session.id,
        startTime: exportData.session.startTime
      },
      conversation: exportData.messages.map(msg => ({
        id: msg.timestamp,
        timestamp: msg.timestamp,
        role: msg.who === 'you' ? 'user' : 'assistant',
        content: msg.message,
        model: msg.model || 'unknown'
      }))
    };

    const jsonString = JSON.stringify(enhancedData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    
    downloadFile(blob, `yappify-chat-${getTimestamp()}.json`);
    showExportSuccess(`Exported ${enhancedData.conversation.length} messages as JSON`);
  } catch (error) {
    console.error('JSON export error:', error);
    throw error;
  }
}

// Export as XLSX (Excel-compatible)
function exportAsXLSX(exportData) {
  try {
    // Create Excel-compatible CSV with UTF-8 BOM for proper encoding
    const BOM = '\uFEFF';
    const headers = ['Timestamp', 'Role', 'Model', 'Content'];
    
    const csvRows = [
      // Session metadata header
      ['=== YAPPIFY CHAT EXPORT ===', '', '', ''],
      ['Session ID', exportData.session.id, '', ''],
      ['Export Date', new Date().toLocaleString(), '', ''],
      ['Messages', exportData.messages.length.toString(), '', ''],
      ['', '', '', ''], // Empty row
      
      // Column headers
      headers,
      
      // Message data
      ...exportData.messages.map(msg => [
        new Date(msg.timestamp).toLocaleString(),
        msg.who === 'you' ? 'User' : 'Assistant',
        msg.model || 'Unknown',
        `"${(msg.message || '').replace(/"/g, '""').replace(/\n/g, ' ')}"` // Clean line breaks
      ])
    ];
    
    const csvContent = BOM + csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8' 
    });
    
    downloadFile(blob, `yappify-chat-${getTimestamp()}.xlsx`);
    showExportSuccess(`Exported ${exportData.messages.length} messages as Excel`);
  } catch (error) {
    console.error('XLSX export error:', error);
    throw error;
  }
}

// Export as CSV
function exportAsCSV(exportData) {
  try {
    const headers = ['Timestamp', 'Role', 'Model', 'Content'];
    
    const csvRows = [
      headers.join(','),
      ...exportData.messages.map(msg => [
        `"${new Date(msg.timestamp).toISOString()}"`,
        `"${msg.who === 'you' ? 'User' : 'Assistant'}"`,
        `"${msg.model || 'Unknown'}"`,
        `"${(msg.message || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
      ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    
    downloadFile(blob, `yappify-chat-${getTimestamp()}.csv`);
    showExportSuccess(`Exported ${exportData.messages.length} messages as CSV`);
  } catch (error) {
    console.error('CSV export error:', error);
    throw error;
  }
}

// Utility functions for export
function downloadFile(blob, filename) {
  try {
    console.log('Creating download for:', filename, 'Size:', blob.size, 'bytes');
    
    // Create object URL
    const url = URL.createObjectURL(blob);
    console.log('Created object URL:', url);
    
    // Create temporary download link
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    
    // Add to DOM, click, and remove
    document.body.appendChild(a);
    console.log('Triggering download...');
    a.click();
    document.body.removeChild(a);
    
    // Clean up object URL after a short delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
      console.log('Cleaned up object URL');
    }, 100);
    
  } catch (error) {
    console.error('Download failed:', error);
    throw new Error('Failed to download file: ' + error.message);
  }
}

function getTimestamp() {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  return `${date}_${time}`;
}

function showExportSuccess(message) {
  // Create a clean success message in the chat
  addMessage("system", `✅ ${message}`, "success");
}

// Dropdown utility functions
function toggleModelDropdown() {
  const isOpen = elements.modelDropdown.classList.contains('open');
  if (isOpen) {
    closeModelDropdown();
  } else {
    openModelDropdown();
  }
}

function toggleToolsDropdown() {
  const isOpen = elements.toolsDropdown.classList.contains('open');
  if (isOpen) {
    closeToolsDropdown();
  } else {
    openToolsDropdown();
  }
}

function openModelDropdown() {
  elements.modelDropdown.classList.add('open');
  elements.modelSelectorBtn.classList.add('open');
}

function closeModelDropdown() {
  elements.modelDropdown.classList.remove('open');
  elements.modelSelectorBtn.classList.remove('open');
}

function openToolsDropdown() {
  elements.toolsDropdown.classList.add('open');
  elements.toolsSelectorBtn.classList.add('open');
}

function closeToolsDropdown() {
  elements.toolsDropdown.classList.remove('open');
  elements.toolsSelectorBtn.classList.remove('open');
}

function selectModel(option) {
  // Remove active class from all options
  elements.modelOptions.forEach(opt => opt.classList.remove('active'));
  
  // Add active class to selected option
  option.classList.add('active');
  
  // Update button text (more compact format)
  const modelName = option.querySelector('.model-name').textContent;
  const modelDesc = option.querySelector('.model-desc').textContent;
  elements.currentModelName.textContent = `${modelName} (${modelDesc})`;
  
  // Close dropdown
  closeModelDropdown();
  
  // Return the selected model data
  return {
    model: option.dataset.model,
    name: modelName,
    description: modelDesc
  };
}

// Load chat history on startup - ENHANCED VERSION
export function loadChatHistory() {
  // First try to restore from persistence
  const savedState = chatPersistence.loadState();
  
  if (savedState && savedState.messages && savedState.messages.length > 0) {
    const restore = confirm('Would you like to continue your previous conversation?');
    
    if (restore) {
      // Restore messages
      savedState.messages.forEach(msg => {
        if (msg.who === 'system' && msg.message.includes('Try asking me:')) {
          return; // Skip guiding questions
        }
        const { element, content } = addMessage(msg.who, "", msg.messageType);
        content.textContent = msg.message;
      });
      
      // Restore model if different
      if (savedState.model && savedState.model !== chatState.currentModel) {
        const modelOption = document.querySelector(`.model-option[data-model="${savedState.model}"]`);
        if (modelOption && !modelOption.classList.contains('disabled')) {
          modelOption.click();
        }
      }
      
      addMessage("system", "—— Previous session restored ——", "info");
    } else {
      chatPersistence.clearState();
      chatHistory.initSession();
      showGuidingQuestions();
    }
  } else {
    // Fall back to old history loading
    const history = chatHistory.load();
    
    if (history.length > 0) {
      addMessage("system", "—— Previous conversation restored ——", "info");
      const recentHistory = history.slice(-20);
      recentHistory.forEach(item => {
        const { element, content } = addMessage(item.who, "", item.messageType);
        content.textContent = item.message;
      });
      addMessage("system", "—— Continuing conversation ——", "info");
    } else {
      chatHistory.initSession();
      showGuidingQuestions();
    }
  }
  
  // Start auto-save
  chatPersistence.startAutoSave();
  
  // Save on important events
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      chatPersistence.saveState();
    }
  });
  
  window.addEventListener('beforeunload', () => {
    chatPersistence.saveState();
  });
}

// Manual test helper
if (typeof window !== 'undefined') {
  window.testExport = function(format) {
    console.log('Manual test export:', format);
    exportChatFormat(format || 'json');
  };
}