// assets/llm/chat-rag.js
/**
 * RAG (Retrieval-Augmented Generation) Functions
 * Handles vector search and similarity calculations
 */

import { chatState } from './chat-config.js';

// Calculate similarity between query and text
export function calculateSimilarity(query, text) {
  const queryWords = query.split(/\s+/).filter(w => w.length > 2);
  const textWords = text.split(/\s+/);
  
  let exactMatches = 0;
  let partialMatches = 0;
  
  queryWords.forEach(qWord => {
    if (textWords.includes(qWord)) {
      exactMatches++;
    } else if (textWords.some(tWord => tWord.includes(qWord) || qWord.includes(tWord))) {
      partialMatches += 0.5;
    }
  });
  
  return (exactMatches * 2.0 + partialMatches) / queryWords.length;
}

// Async search function for RAG
export async function search(query, k = 3) {
  if (chatState.vectors.length === 0) return [];
  
  try {
    const queryLower = query.toLowerCase();
    const scoredVectors = chatState.vectors.map(v => {
      const score = calculateSimilarity(queryLower, v.text.toLowerCase());
      return { ...v, score };
    });
    
    return scoredVectors
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .filter(v => v.score > 0.1);
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

// Enhanced search with semantic filtering
export async function enhancedSearch(query, k = 3, minScore = 0.2) {
  if (chatState.vectors.length === 0) return [];
  
  try {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
    
    const scoredVectors = chatState.vectors.map(v => {
      let score = calculateSimilarity(queryLower, v.text.toLowerCase());
      
      // Boost score for metadata relevance
      if (v.metadata) {
        if (v.metadata.section && queryLower.includes(v.metadata.section.toLowerCase())) {
          score += 0.3;
        }
        if (v.metadata.content_type && queryLower.includes(v.metadata.content_type.toLowerCase())) {
          score += 0.2;
        }
      }
      
      // Boost score for important keywords
      const importantKeywords = ['brian', 'project', 'shiny', 'statistics', 'data', 'analysis'];
      importantKeywords.forEach(keyword => {
        if (queryLower.includes(keyword) && v.text.toLowerCase().includes(keyword)) {
          score += 0.1;
        }
      });
      
      return { ...v, score };
    });
    
    return scoredVectors
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .filter(v => v.score > minScore);
  } catch (error) {
    console.error("Enhanced search error:", error);
    return [];
  }
}

// Get context summary from search results
export function getContextSummary(docs, maxLength = 500) {
  if (!docs || docs.length === 0) return "";
  
  let summary = "";
  for (const doc of docs) {
    if (summary.length + doc.text.length > maxLength) {
      summary += doc.text.substring(0, maxLength - summary.length) + "...";
      break;
    }
    summary += doc.text + "\n\n";
  }
  
  return summary.trim();
}