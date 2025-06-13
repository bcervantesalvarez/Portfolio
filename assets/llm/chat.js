/* assets/llm/chat.js  – sidebar behaviour + chat loop */
import { ask, loadVectors, search } from "./webllm-wrapper.js";

/* ── sidebar toggle ──────────────────────────────── */
const bar = document.getElementById("chatSidebar");
document.getElementById("openChat").onclick  = () => bar.classList.add("open");
document.getElementById("closeChat").onclick = () => bar.classList.remove("open");

/* ── load vector index once ─────────────────────────
   Use a URL relative to this script so pages in /blog/… work too. */
await loadVectors(new URL("./vectors.json", import.meta.url).href);

/* ── chat loop ───────────────────────────────────── */
const log  = document.getElementById("chatLog");
const form = document.getElementById("chatForm");

form.onsubmit = async (e) => {
  e.preventDefault();
  const prompt = chatInput.value.trim();
  if (!prompt) return;

  append("you", prompt);
  chatInput.value = "";

  append("bot", "…");                           // placeholder while thinking
  const ctx     = (await search(prompt, 4)).join("\n\n");
  const answer  = await ask(`${ctx}\n\nUser: ${prompt}\nAssistant:`);

  log.lastChild.textContent = answer;           // replace placeholder
};

/* ── helper to write a message ───────────────────── */
function append(role, text) {
  const div = document.createElement("div");
  div.className = role;
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}
