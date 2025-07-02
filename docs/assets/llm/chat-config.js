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

// Canned replies for the 10 preset buttons
export const guidingAnswers = {
  "What is Brian's educational background?":
    "Brian earned a B.S. in Mathematics (Linfield University), an M.S. in Data Science (Willamette University), and an M.S. in Statistics (Oregon State University).",

  "What programming languages does Brian specialize in?":
    "Primarily R and Python for analysis and machine learning, plus SQL for data engineering and TypeScript/JavaScript for interactive web front-ends.",

  "Can you tell me about Brian's Shiny applications?":
    "He builds Shiny dashboards that turn complex analyses into point-and-click tools—examples include a UK road-accident explorer and a stream-temperature uncertainty visualizer.",

  "What kind of data visualization projects has Brian worked on?":
    "Projects range from interactive cost-of-living dashboards and Yelp review maps to explainable neural-network heat-maps, always pairing tidy data wrangling with clear visuals.",

  "What is Brian's experience with machine learning?":
    "Beyond classical models (logistic regression, random forests, XGBoost) he authored the xnnR package to add concept-based explainability to CNNs and trains models on GPU.",

  "Tell me about Brian's Master's degree in Statistics":
    "At Oregon State University he focused on Bayesian methods, experimental design, and class-imbalance problems while TA-ing and developing data-visualization curricula.",

  "What interactive learning tools has Brian created?":
    "He built browser-only AI helpers, R Shiny teaching apps, and webR/Quarto demos that let students tweak parameters live to see statistical concepts unfold.",

  "What are some of Brian's notable data science projects?":
    "Highlights include Yappify (a WebGPU LLM assistant), an explainable CNN for bird-species classification, Metacritic score prediction, and a retail-returns simulation study.",

  "How does Brian approach statistical analysis?":
    "Data cleaning first, assumption checks next, then model selection suited to the question; results are communicated with intuitive visuals and plain language.",

  "What makes Brian's work in R programming unique?":
    "He combines tidyverse fluency with pedagogy, writing reproducible Quarto notebooks, package-quality functions, and polished Shiny apps that hide code complexity behind sleek UI."
};


// Initialize vectors loading
export function initializeVectors() {
  try {
    fetch(config.vectorsPath)
      .then(r => r.json())
      .then(data => {
        chatState.vectors = data.map(v => ({
          id: v.id,
          text: v.text,
          embedding : v.embedding || v.vector || v.embeddings,
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