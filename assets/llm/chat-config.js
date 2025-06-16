// assets/llm/chat-config.js
/**
 * Chat Configuration and Global State
 * Contains all configuration variables and shared state
 */

// Load Web-LLM library
import * as webllm from "https://esm.run/@mlc-ai/web-llm";

// Export webllm for other modules
export { webllm };

// Global state variables
export const chatState = {
  engine: null,
  isLoading: false,
  currentModel: "local", // Start with local model
  vectors: [],
  usedQuestions: new Set()
};

// Configuration constants
export const config = {
  modelName: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
  vectorsPath: "/assets/llm/vectors.json",
  streamSpeed: 25,
  thinkingTimeMin: 500,
  thinkingTimeMax: 1500
};

// Guiding questions
export const guidingQuestions = [
  "What is Brian's educational background?",
  "What programming languages does Brian specialize in?", 
  "Can you tell me about Brian's Shiny applications?",
  "What kind of data visualization projects has Brian worked on?",
  "What is Brian's experience with machine learning?",
  "Tell me about Brian's Master's degree in Statistics",
  "What interactive learning tools has Brian created?",
  "What are some of Brian's notable data science projects?",
  "How does Brian approach statistical analysis?",
  "What makes Brian's work in R programming unique?"
];

// Initialize vectors loading
export function initializeVectors() {
  try {
    fetch(config.vectorsPath)
      .then(r => r.json())
      .then(data => {
        chatState.vectors = data.map(v => ({
          id: v.id,
          text: v.text,
          embeddings: v.vector || v.embeddings,
          metadata: v.metadata || {}
        }));
        console.log("✅ Vectors loaded:", chatState.vectors.length);
      })
      .catch(e => console.log("ℹ️ No vectors found, continuing without RAG"));
  } catch (e) {
    console.log("ℹ️ No vectors found, continuing without RAG");
  }
}

// Initialize on import
initializeVectors();