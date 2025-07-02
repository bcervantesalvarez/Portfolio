// assets/llm/chat-local.js
/**
 * YappifyGPT – lightweight, deterministic fallback that runs entirely client‑side.
 * Pattern‑match simple queries, otherwise pull the best paragraph from the local
 * RAG index.  Every export is now async‑safe so nothing breaks when we await.
 */

import { chatState } from './chat-config.js';
import { search as ragSearch } from './chat-rag.js';

/********************************************************************
 * Hand‑crafted reply templates
 *******************************************************************/
const responses = {
  greeting: [
    "Hello! I'm YappifyGPT, Brian's on‑device assistant. Ask me anything about his data‑science work!",
    "Hi there – welcome to Brian's portfolio. I'm here to guide you through his projects and skills.",
    "Hey! I'm YappifyGPT running locally in your browser. How can I help?"
  ],

  education: [
    "Brian holds a B.S. in Mathematics (Linfield), an M.S. in Data Science (Willamette) and an M.S. in Statistics (Oregon State).",
    "Academic track: Mathematics → Data Science → Statistics. That triple foundation powers his modelling work.",
    "Linfield Mathematics, Willamette Data Science, OSU Statistics – three degrees, one data‑driven career."
  ],

  programming: [
    "Primary stack: R (tidyverse, Shiny) and Python (pandas, scikit‑learn).  He also ships TypeScript for the web and writes SQL every day.",
    "Brian codes fluidly in R and Python, builds dashboards with Shiny/Altair, and sprinkles JS/TS when front‑end polish is needed.",
    "Favourite tools: R for stats, Python for ML, SQL for data plumbing, plus JavaScript for interactive UIs."
  ],

  projects: [
    "From interactive Shiny apps to XNN‑based deep‑learning explainers, Brian's projects span visualization, ML and statistical research.",
    "Highlights: a browser‑only AI assistant (this site), explainable CNNs, and cost‑of‑living dashboards built in R Shiny.",
    "He’s shipped machine‑learning models, interactive dashboards and an R package (xnnR) that visualises concept heat‑maps."
  ],

  shiny: [
    "Brian builds Shiny apps that turn complex analyses into point‑and‑click stories – see the UK accident dashboard and stream‑temperature explorer.",
    "Shiny is his go‑to for rapid prototypes; he pairs tidyverse wrangling with modular UI components for clean, reactive apps.",
    "Every Shiny project Brian ships is mobile‑responsive and accessible – he’s big on UX as well as stats."
  ],

  skills: [
    "Core skills: statistical modelling, machine learning, data wrangling, R/Python programming, interactive visualization, and teaching.",
    "He blends classical statistics (GLMs, Bayesian methods) with modern ML (XGBoost, neural nets) and communicates results with clear visuals.",
    "Strengths: making messy data usable, picking the right model, and explaining the findings to non‑technical stakeholders."
  ],

  visualization: [
    "Brian tells data stories with ggplot2, plotly and Altair – always clean aesthetics, colour‑blind‑safe palettes and clear annotations.",
    "He teaches data‑viz: students learn idea generation, visual discovery and everyday dataviz through his courses.",
    "Interactive dashboards, static infographics, animated explainers – visualization is Brian’s favourite communication tool."
  ],

  statistics: [
    "Regression, hypothesis testing, design of experiments, Bayesian inference – Brian uses the whole statistical toolbox.",
    "Need a p‑value or a posterior distribution?  He’s comfortable in both frequentist and Bayesian camps.",
    "He models everything from student success to retail returns, always validating assumptions and quantifying uncertainty."  
  ],

  fallback: [
    "I'm a lightweight helper.  For a deep dive, switch to the Qwen model which has the full text of Brian's portfolio indexed.",
    "Not sure yet – try the larger Qwen engine for a more detailed answer pulled directly from Brian's articles and code."
  ]
};

function randomPick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

/********************************************************************
 * Tiny RAG helper – lexical only for speed
 *******************************************************************/
async function searchDocs(query, k=2){
  return await ragSearch(query, k, { minScore:0.20, alpha:0.0 });
}

/********************************************************************
 * Main generator – now async because we may await RAG
 *******************************************************************/
export async function generateLocalResponse(userMessage){
  const msg = userMessage.toLowerCase();

  if (/\b(hello|hi|hey|greet)\b/.test(msg))               return randomPick(responses.greeting);
  if (/\b(education|degree|study|master|school|university)/.test(msg))
                                                           return randomPick(responses.education);
  if (/\b(programming|language|code|python|sql|javascript)/.test(msg))
                                                           return randomPick(responses.programming);
  if (/\b(shiny|interactive|app(?:lication)?)\b/.test(msg))return randomPick(responses.shiny);
  if (/\b(project|portfolio|work|experience)\b/.test(msg)) return randomPick(responses.projects);
  if (/\b(skill|expertise|speciali[sz]e?|talent)\b/.test(msg))
                                                           return randomPick(responses.skills);
  if (/\b(visuali[sz]ation|chart|graph|plot|dashboard)\b/.test(msg))
                                                           return randomPick(responses.visualization);
  if (/\b(statistic|analysis|analytic|model(?:ing)?)\b/.test(msg))
                                                           return randomPick(responses.statistics);

  /* RAG fallback – best matching paragraph from local vectors */
  if (chatState.vectors.length){
    const docs = await searchDocs(msg, 2);
    if (docs.length){
      const snippet = docs[0].text.slice(0, 220).trim();
      return `According to Brian's portfolio: “${snippet} …”  (Switch to the Qwen model for full context.)`;
    }
  }

  return randomPick(responses.fallback);
}

/********************************************************************
 * Simulated typing delay so UI feels natural
 *******************************************************************/
export async function simulateThinking(){
  await new Promise(r => setTimeout(r, 400 + Math.random()*700));
}
