// assets/llm/chat-local.js
/**
 * YappifyGPT Local Response Generator
 * Fast, pattern-based responses without model downloads
 */

import { chatState } from './chat-config.js';
import { calculateSimilarity } from './chat-rag.js';

// Response patterns for YappifyGPT Local
const responses = {
  greeting: [
    "Hello! I'm YappifyGPT, Brian's local AI assistant. I can help you learn about Brian's work in data science and analytics.",
    "Hi there! Welcome to Brian's portfolio. I'm here to help you explore his projects and background.",
    "Hey! I'm YappifyGPT, running locally in your browser. Ask me anything about Brian's data science work!"
  ],
  
  education: [
    "Brian holds a Master's degree in Statistics and has strong foundations in mathematical modeling and statistical analysis.",
    "Brian's educational background includes advanced studies in Statistics with focus on applied analytics and machine learning.",
    "Brian completed his Master's in Statistics, which provided him with deep expertise in statistical modeling and data analysis methodologies."
  ],
  
  programming: [
    "Brian specializes in R programming, particularly for data analysis and visualization. He's also experienced with Python, SQL, and web technologies.",
    "Brian's main programming languages include R (his specialty), Python for machine learning, SQL for databases, and JavaScript for interactive web applications.",
    "Brian is highly skilled in R programming and has extensive experience with data manipulation, statistical modeling, and creating interactive visualizations."
  ],
  
  projects: [
    "Brian has worked on various data science projects including interactive Shiny applications, machine learning models, and data visualization dashboards.",
    "Brian's portfolio includes statistical analysis projects, predictive modeling work, and interactive web applications built with R Shiny.",
    "Brian creates engaging data science projects ranging from exploratory data analysis to machine learning applications and interactive learning tools."
  ],
  
  shiny: [
    "Brian has developed several interactive Shiny applications for data exploration and statistical learning. These apps make complex concepts accessible through interactive interfaces.",
    "Brian specializes in creating R Shiny applications that transform complex data analysis into user-friendly, interactive experiences.",
    "Brian's Shiny applications demonstrate his ability to create engaging, interactive tools for data analysis and statistical education."
  ],
  
  skills: [
    "Brian's core skills include statistical analysis, data visualization, machine learning, R programming, and creating interactive web applications.",
    "Brian excels in data science, statistical modeling, R programming, Python, SQL, and building interactive dashboards and applications.",
    "Brian combines statistical expertise with programming skills to create comprehensive data solutions, specializing in R, analytics, and visualization."
  ],
  
  visualization: [
    "Brian creates compelling data visualizations using R's ggplot2, plotly, and other visualization libraries to tell stories with data.",
    "Brian's visualization work focuses on making complex data insights accessible through interactive charts, dashboards, and web applications.",
    "Brian excels at transforming raw data into meaningful visual narratives that help stakeholders understand key insights and trends."
  ],
  
  statistics: [
    "Brian applies advanced statistical methods including regression analysis, hypothesis testing, and experimental design to solve real-world problems.",
    "Brian's statistical expertise covers descriptive and inferential statistics, probability theory, and applied statistical modeling techniques.",
    "Brian uses statistical analysis to extract meaningful insights from data, helping organizations make data-driven decisions."
  ],
  
  fallback: [
    "That's an interesting question about Brian's work. For the most detailed and accurate information, I'd recommend switching to the Qwen model which has access to Brian's complete portfolio data.",
    "I'm a lightweight local assistant. For comprehensive answers about Brian's specific projects and detailed background, try using the Qwen model which has full access to his portfolio content.",
    "While I can provide general information about Brian, the Qwen model has deeper knowledge of his specific projects and work. You might want to switch models for more detailed answers."
  ]
};

// Helper function to get random response
function getRandomResponse(responseArray) {
  return responseArray[Math.floor(Math.random() * responseArray.length)];
}

// Synchronous search for local responses
function searchSync(query, k = 2) {
  if (chatState.vectors.length === 0) return [];
  
  const queryLower = query.toLowerCase();
  const scoredVectors = chatState.vectors.map(v => {
    const score = calculateSimilarity(queryLower, v.text.toLowerCase());
    return { ...v, score };
  });
  
  return scoredVectors
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .filter(v => v.score > 0.2);
}

// Main local response generator
export function generateLocalResponse(userMessage) {
  const message = userMessage.toLowerCase();
  
  // Pattern matching with more comprehensive coverage
  if (message.includes('hello') || message.includes('hi') || message.includes('hey') || message.includes('greet')) {
    return getRandomResponse(responses.greeting);
  }
  
  if (message.includes('education') || message.includes('degree') || message.includes('study') || message.includes('master') || message.includes('school') || message.includes('university')) {
    return getRandomResponse(responses.education);
  }
  
  if (message.includes('programming') || message.includes('language') || message.includes('code') || message.includes('python') || message.includes('sql') || message.includes('javascript')) {
    return getRandomResponse(responses.programming);
  }
  
  if (message.includes('shiny') || message.includes('app') || message.includes('application') || message.includes('interactive')) {
    return getRandomResponse(responses.shiny);
  }
  
  if (message.includes('project') || message.includes('work') || message.includes('portfolio') || message.includes('experience')) {
    return getRandomResponse(responses.projects);
  }
  
  if (message.includes('skill') || message.includes('expertise') || message.includes('specializ') || message.includes('talent')) {
    return getRandomResponse(responses.skills);
  }
  
  if (message.includes('visualization') || message.includes('chart') || message.includes('graph') || message.includes('plot') || message.includes('dashboard')) {
    return getRandomResponse(responses.visualization);
  }
  
  if (message.includes('statistic') || message.includes('analysis') || message.includes('analytic') || message.includes('modeling') || message.includes('model')) {
    return getRandomResponse(responses.statistics);
  }
  
  // Enhanced RAG-like responses if we have context
  if (chatState.vectors.length > 0) {
    const docs = searchSync(message, 2);
    if (docs.length > 0) {
      const context = docs[0].text.substring(0, 250);
      return `Based on Brian's work: ${context}... For more detailed information, try the Qwen model!`;
    }
  }
  
  return getRandomResponse(responses.fallback);
}

// Simulate thinking time for better UX
export async function simulateThinking() {
  const thinkingTime = 500 + Math.random() * 1000;
  await new Promise(resolve => setTimeout(resolve, thinkingTime));
}