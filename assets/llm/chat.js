import * as llm from "./webllm-wrapper.js";   // ⇐ 1‑liner for WebLLM

/* slide‑out -------------------------------------------------------*/
const bar = document.getElementById("chatSidebar");
document.getElementById("openChat").onclick  = () => bar.classList.add("open");
document.getElementById("closeChat").onclick = () => bar.classList.remove("open");

/* chat loop -------------------------------------------------------*/
const log = document.getElementById("chatLog");
document.getElementById("chatForm").onsubmit = async (e) => {
  e.preventDefault();
  const q = chatInput.value.trim(); if (!q) return;
  append("you", q); chatInput.value = "";

  // 1. find top‑k chunks in the local vector store (runs inside browser)
  const ctx = await window.siteSearch(q, 4);      // tiny helper in wrapper
  // 2. ask the LLM
  const ans = await llm.ask(`${ctx}\n\nUser: ${q}\nAssistant:`);

  append("bot", ans);
};

function append(role, text){
  const div = document.createElement("div");
  div.className = role; div.textContent = text;
  log.appendChild(div); log.scrollTop = log.scrollHeight;
}
