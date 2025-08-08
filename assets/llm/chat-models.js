// assets/llm/chat-models.js
import { webllm, chatState, modelConfigs } from "./chat-config.js";
import { addMessage, addHTMLMessage } from "./chat-ui.js";

/**
 * initializeModel(name)
 *  - name: one of the keys in modelConfigs (e.g. "local", "qwen2.5-1.5B", "qwen3-0.6B")
 *  - returns true when ready to generate
 */
export async function initializeModel(name) {
  const cfg = modelConfigs[name];
  if (!cfg) {
    console.warn(`No modelConfig for “${name}”`);
    return false;
  }

  // local is instant
  if (cfg.type === "local") {
    return true;
  }

  // mark busy and show loading banner
  chatState.isLoading = true;

  // ensure engine instance
  if (!chatState.engines[name]) {
    chatState.engines[name] = new webllm.MLCEngine();
  }

  try {
    // reload without a progress bar
    await chatState.engines[name].reload(cfg.model_id, {
      model: cfg.model,
      modelUrl: cfg.model_lib
    });

    // success
    chatState.isLoading = false;
    return true;

  } catch (err) {
    // failure
    chatState.isLoading = false;
    console.error(`${name} init failed`, err);
    addMessage(
      "system",
      `⚠️ Failed to load ${cfg.description}.`,
      "warning"
    );
    return false;
  }
}

/**
 * isModelReady(name)
 *   returns true if we can immediately call generateResponse(name,...)
 */
export function isModelReady(name) {
  const cfg = modelConfigs[name];
  if (!cfg) return false;
  if (cfg.type === "local") return true;
  const eng = chatState.engines[name];
  return !!eng && !chatState.isLoading;
}

/**
 * generateResponse(name, userMsg)
 *   name: key in modelConfigs
 *   userMsg: string
 *   returns the assistant reply text
 */
export async function generateResponse(name, userMsg) {
  const cfg = modelConfigs[name];
  if (!cfg) throw new Error(`No modelConfig for ${name}`);

  if (cfg.type === "local") {
    // dynamic import so we don’t bloat the bundle
    const { generateLocalResponse } = await import("./chat-local.js");
    return generateLocalResponse(userMsg);
  }

  // remote LLM
  const engine = chatState.engines[name];
  if (!engine) throw new Error(`${name} engine not initialized`);

  // you can pull in your RAG helpers here, build a system+history...
  const messages = [
    { role: "system", content: cfg.systemPrompt || "" },
    ... (chatState.history || []).slice(-6),
    { role: "user", content: userMsg },
  ];

  const resp = await engine.chatCompletion({
    messages,
    temperature: cfg.temperature ?? 0.4,
    top_p: cfg.top_p ?? 0.9,
    max_tokens: cfg.max_tokens ?? 512,
  });

  return resp.choices[0].message.content.trim();
}
