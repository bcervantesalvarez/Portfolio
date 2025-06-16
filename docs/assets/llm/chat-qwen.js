// assets/llm/chat-qwen.js
/**
 * Qwen Model Integration
 * Handles Web-LLM model loading and inference
 */

import { webllm, chatState, config } from './chat-config.js';
import { addMessage } from './chat-ui.js';
import { search } from './chat-rag.js';

// Initialize Qwen model only when requested
export async function initializeQwen() {
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  
  if (!navigator.gpu || isMobile) {
    addMessage("system", "⚠️ Qwen model requires WebGPU and isn't supported on mobile devices. Please try on a desktop browser like Chrome or Edge.", "warning");
    return false;
  }

  try {
    if (!chatState.engine) {
      chatState.engine = new webllm.MLCEngine();
    }

    chatState.isLoading = true;
    addMessage("system", "Initializing Qwen model... This may take a moment to download.", "loading");

    await chatState.engine.reload(config.modelName, {
      initProgressCallback: (progress) => {
        console.log(`Loading model: ${Math.round(progress.progress * 100)}% - ${progress.text}`);
      }
    });

    chatState.isLoading = false;
    console.log("✅ Qwen engine initialized successfully");
    addMessage("system", "✅ Qwen model loaded! Now you have access to Brian's full portfolio knowledge base.", "success");
    return true;

  } catch (error) {
    chatState.isLoading = false;
    console.error("❌ Failed to initialize Qwen:", error);
    addMessage("system", "⚠️ Failed to initialize Qwen model. You can still use YappifyGPT Local.", "warning");
    return false;
  }
}

// Generate response using Qwen model
export async function generateQwenResponse(userMessage) {
  if (!chatState.engine) {
    throw new Error("Qwen engine not initialized");
  }

  // Build system message with RAG context
  let systemContent = `You are Yappify, Brian's knowledgeable data-science assistant powered by Qwen2.5-1.5B-Instruct running locally in the browser via WebGPU. Brian Cervantes Alvarez is a data scientist and analyst who works on various machine learning and analytics projects.

Be helpful, concise, and professional. When users ask about Brian or his work, draw on the provided context. Always remember you are Yappify, Brian's AI assistant.`;

  // Add RAG context
  try {
    const docs = await search(userMessage, 3);
    if (docs.length > 0) {
      const context = docs.map(d => d.text).join('\n\n');
      systemContent += `\n\nContext from Brian's work:\n\n${context}\n\nUse this context to provide accurate information.`;
      console.log("✅ RAG context added from", docs.length, "documents");
    }
  } catch (e) {
    console.log("Could not add RAG context:", e);
  }

  const messages = [
    { role: "system", content: systemContent },
    { role: "user", content: userMessage }
  ];

  const response = await chatState.engine.chatCompletion({
    messages: messages,
    temperature: 0.7,
    max_tokens: 1000
  });

  return response.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
}

// Check if Qwen is ready
export function isQwenReady() {
  return chatState.engine !== null && !chatState.isLoading;
}