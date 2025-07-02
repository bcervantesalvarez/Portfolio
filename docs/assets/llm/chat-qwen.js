// assets/llm/chat-qwen.js
/**
 * Qwen 2.5 (1.5 B) integration – revamped
 * ▸ Web-LLM engine lazy-loads on demand (desktop WebGPU only)
 * ▸ Injects page-level + global RAG context into every prompt
 * ▸ Maintains a rolling chat history (last 6 turns)
 * ▸ Falls back to deterministic guidingAnswers for preset buttons
 */

import { webllm, chatState, config, guidingAnswers } from "./chat-config.js";
import { addMessage } from "./chat-ui.js";
import { search, getContextSummary } from "./chat-rag.js";

const HISTORY_WINDOW = 6; // keep last N turns per session

/* ───────────────────────── 1.  Model initialisation ────────────────────── */
export async function initializeQwen() {
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  if (!navigator.gpu || isMobile) {
    addMessage(
      "system",
      "⚠️  Qwen model requires WebGPU and is not supported on mobile. Try a desktop browser like Chrome or Edge.",
      "warning"
    );
    return false;
  }

  try {
    if (!chatState.engine) chatState.engine = new webllm.MLCEngine();
    chatState.isLoading = true;
    addMessage("system", "Initializing Qwen model… This may take a moment.", "loading");

    await chatState.engine.reload(config.modelName || "qwen2.5-1.5b-chat-q4f16_1", {
      initProgressCallback: p =>
        console.log(`Loading Qwen: ${Math.round(p.progress * 100)} % – ${p.text}`)
    });

    chatState.isLoading = false;
    chatState.history = [];
    addMessage("system", "✅ Qwen model loaded! Full portfolio knowledge is now available.", "success");
    return true;
  } catch (err) {
    chatState.isLoading = false;
    console.error("Qwen init failed", err);
    addMessage("system", "⚠️  Failed to initialise Qwen. Yappify Local remains available.", "warning");
    chatState.engine = null;
    return false;
  }
}

export function isQwenReady() {
  return !!chatState.engine && !chatState.isLoading;
}

/* ───────────────────────── 2.  Response generator ──────────────────────── */
export async function generateQwenResponse(userMsg) {
  if (!chatState.engine) throw new Error("Qwen engine not initialised");

  // Instant deterministic reply for preset buttons
  const canned = guidingAnswers[userMsg.trim()];
  if (canned) return canned;

  /* 2.1  RAG context – page first, global fallback */
  let docs = await search(userMsg, 4, { scope: "page", alpha: 0.9 });
  if (!docs.length) docs = await search(userMsg, 4);
  const context = getContextSummary(docs, 600) || "None";

  /* 2.2  Build prompt with rolling history */
  const systemPrompt = `You are Yappify, Brian Cervantes Alvarez’s AI assistant. Answer using ONLY the information in CONTEXT. If the context is insufficient, respond with ‘I don’t know’.

  FORMAT RULES (strict):
  • Break text into paragraphs of **exactly four sentences**.
  • Separate paragraphs with a blank line.
  • Bold key proper nouns and project names using **double asterisks**.
  • Use *italics* for dataset names and degrees.
  • Lists must be markdown bullet points (dash‑space).
  • No leading or trailing whitespace.

  CONTEXT:
  ${context}

  END CONTEXT`; 

  const history = (chatState.history || []).slice(-HISTORY_WINDOW);
  const messages = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: userMsg }
  ];

  /* 2.3  Call Web-LLM (non-stream for simplicity; stream API available) */
  const resp = await chatState.engine.chatCompletion({
    messages,
    temperature: 0.4,
    top_p: 0.9,
    max_tokens: 512
  });
  const reply = resp.choices?.[0]?.message?.content?.trim() || "I don’t know.";

  /* 2.4  Update chat memory */
  chatState.history.push({ role: "user", content: userMsg });
  chatState.history.push({ role: "assistant", content: reply });

  return reply;
}
