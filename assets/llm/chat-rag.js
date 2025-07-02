// assets/llm/chat-rag.js
/**
 * Retrieval‑Augmented Generation helpers
 * ‑ Upgrades to true semantic search using cosine similarity on sentence‑level embeddings
 * ‑ Falls back to lightweight lexical scoring when embeddings are missing or the model is still loading
 * ‑ Remains 100 % client‑side and runs in any modern browser with WebGPU (or CPU fallback)
 */

import { chatState } from './chat-config.js';

/********************************************************************
 * Utility ‑ basic linear‑algebra helpers
 *******************************************************************/
function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function norm(v) {
  return Math.sqrt(dot(v, v) + 1e-8);
}

function cosineSimilarity(a, b) {
  return dot(a, b) / (norm(a) * norm(b));
}

/********************************************************************
 * Embedding generation
 *
 * By default the function calls a global async generator `window.embed`
 * that must return a Float32Array (or Array) containing the sentence
 * embedding for the supplied text.  If you already load a model via
 * @mlc-ai/web-llm, create it once and expose
 *   window.embed = text => myModel.embed(text)
 * so this helper stays model‑agnostic.
 *******************************************************************/
async function getEmbedding(text) {
  if (typeof window.embed === 'function') {
    return await window.embed(text);
  }
  // Fallback – produce a trivial bag‑of‑words vector so search still works
  const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  const counts = new Map();
  words.forEach(w => counts.set(w, (counts.get(w) || 0) + 1));
  // Fixed small vocabulary size for deterministic vector length
  const vocab = [...counts.keys()].slice(0, 128);
  const vec = new Float32Array(128);
  vocab.forEach((w, i) => { vec[i] = counts.get(w); });
  return vec;
}

/********************************************************************
 * Lexical backup score (quick but shallow)
 *******************************************************************/
function lexicalScore(query, text) {
  const qWords = query.split(/\s+/).filter(w => w.length > 2);
  const tWords = text.split(/\s+/);
  let match = 0;
  qWords.forEach(q => {
    if (tWords.includes(q)) match += 1;
  });
  return match / qWords.length;
}

/********************************************************************
 * Core search
 *******************************************************************/
export async function search(query, k = 3, {minScore = 0.15, alpha = 0.85, scope = "global"} = {}) {
  if (!query || chatState.vectors.length === 0) return [];

  //  restrict to current page when requested
  const pool = (scope === "page")
    ? chatState.vectors.filter(v =>
        v.metadata?.page === location.pathname)
    : chatState.vectors;

  const qEmbed = await getEmbedding(query.toLowerCase());

  const scored = await Promise.all(pool.map(async v => {
    if (!v.embedding) v.embedding = await getEmbedding(v.text);
    const sem = cosineSimilarity(qEmbed, v.embedding);
    const lex = lexicalScore(query, v.text.toLowerCase());
    return { ...v, score: alpha * sem + (1 - alpha) * lex };
  }));

  return scored
    .filter(v => v.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

/********************************************************************
 * Convenience – summarise top docs for prompt context
 *******************************************************************/
export function getContextSummary(docs, maxLength = 700) {
  let out = "";
  for (const d of docs) {
    if (out.length + d.text.length > maxLength) {
      out += d.text.slice(0, maxLength - out.length) + "…";
      break;
    }
    out += d.text + "\n\n";
  }
  return out.trim();
}

export function calculateSimilarity(q, t) {      // <-- keep chat-local.js happy
  return lexicalScore(q, t);                      // reuse the new helper
}

/********************************************************************
 * Ingest current page content into chatState.vectors 
 * - Grabs text from a given selector (default: <main>)
 * - Splits it into sentences, chunks by word count 
 * - Embeds each chunk and stores in chatState.vectors
 * * This allows the chat model to reference the current page content
* *******************************************************************/

// Grab <main> (or any selector) text, chunk it, embed it, and push to chatState.vectors
export async function ingestCurrentPage(selector = "main, article, #content, body", chunkTokens = 120) {
  const root = document.querySelector(selector);
  if (!root) return;

  // 1. plain text without extra whitespace
  const text = root.innerText.replace(/\s+/g, " ").trim();
  if (!text) return;

  // 2. split into sentences and chunk ~chunkTokens words
  const sentences = text.split(/(?<=[.?!])\s+/);
  let buf = [];

  async function flush() {
    if (!buf.length) return;
    const chunk = buf.join(" ").trim();
    const embedding = await getEmbedding(chunk);
    chatState.vectors.push({
      text: chunk,
      embedding,
      metadata: { page: location.pathname }
    });
    buf = [];
  }

  for (const s of sentences) {
    const tmp = [...buf, s];
    if (tmp.join(" ").split(/\s+/).length > chunkTokens) await flush();
    buf.push(s);
  }
  await flush();                // last chunk
}
