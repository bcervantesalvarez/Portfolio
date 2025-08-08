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
  // will hold MLCEngine instances by model name
  engines: {},
  isLoading: false,
  currentModel: "local",
  history: [],
  vectors: [],
  usedQuestions: new Set(),
};

// Base URLs / versions
export const modelVersion = "v0_2_48";
export const modelLibURLPrefix =
  "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/";

// Where your RAG vectors live
export const config = {
  vectorsPath: "/assets/llm/vectors.json"
};

export const modelConfigs = {
  local: {
    type: "local",
    description: "YappifyGPT 1.0 (Local)",
  },

  // Qwen 2.5 – 1.5B
  "qwen2.5-1.5B": {
    type: "remote",
    model:    "https://huggingface.co/mlc-ai/Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    model_id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    model_lib:`${modelLibURLPrefix}${modelVersion}/Qwen2-1.5B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm`,
    overrides:{ context_window_size: 4096 },
    description:"Qwen 2.5 (1.5 B)",
  },

  // Qwen 3 – 0.6B
  "qwen3-0.6B": {
    type: "remote",
    model:    "https://huggingface.co/mlc-ai/Qwen3-0.6B-q4f16_1-MLC",
    model_id: "Qwen3-0.6B-q4f16_1-MLC",
    model_lib:`${modelLibURLPrefix}${modelVersion}/Qwen3-0.6B-q4f16_1-ctx4k_cs1k-webgpu.wasm`,
    overrides:{ context_window_size: 4096 },
    description:"Qwen 3 (0.6 B)",
  },

  // Llama 3.2 – 1 B
  "llama-3.2-1B": {
    type: "remote",
    model:    "https://huggingface.co/mlc-ai/Llama-3.2-1B-Instruct-q4f32_1-MLC",
    model_id: "Llama-3.2-1B-Instruct-q4f32_1-MLC",
    model_lib:`${modelLibURLPrefix}${modelVersion}/Llama-3.2-1B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm`,
    overrides:{ context_window_size: 4096 },
    description:"Llama 3.2 1 B",
  },

  // Phi 3.5 – Mini
  "phi-3.5-mini": {
    type: "remote",
    model:    "https://huggingface.co/mlc-ai/Phi-3.5-mini-instruct-q4f16_1-MLC",
    model_id: "Phi-3.5-mini-instruct-q4f16_1-MLC",
    model_lib:`${modelLibURLPrefix}${modelVersion}/Phi-3.5-mini-instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm`,
    overrides:{ context_window_size: 4096 },
    description:"Phi 3.5 Mini",
  },

  // SmolLM2 – 360 M
  "smollm2-360M": {
    type: "remote",
    model:    "https://huggingface.co/mlc-ai/SmolLM2-360M-Instruct-q0f16-MLC",
    model_id: "SmolLM2-360M-Instruct-q0f16-MLC",
    model_lib:`${modelLibURLPrefix}${modelVersion}/SmolLM2-360M-Instruct-q0f16-ctx4k_cs1k-webgpu.wasm`,
    overrides:{ context_window_size: 4096 },
    description:"SmolLM2 360 M",
  },
};

// UI-friendly aliases
modelConfigs.qwen   = modelConfigs["qwen2.5-1.5B"];
modelConfigs.qwen3  = modelConfigs["qwen3-0.6B"];
modelConfigs.llama  = modelConfigs["llama-3.2-1B"];
modelConfigs.phi    = modelConfigs["phi-3.5-mini"];
modelConfigs.smol   = modelConfigs["smollm2-360M"];


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
  fetch(config.vectorsPath)
    .then((r) => r.json())
    .then((data) => {
      chatState.vectors = data.map((v) => ({
        id: v.id,
        text: v.text,
        embedding: v.embedding || v.vector || v.embeddings,
        metadata: v.metadata || {},
      }));
      console.log("✅ Vectors loaded:", chatState.vectors.length);
    })
    .catch(() => console.log("ℹ️ No vectors found, continuing without RAG"));
}

// Kick off RAG loading on import
initializeVectors();
