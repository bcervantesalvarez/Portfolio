/* assets/llm/webllm-wrapper.js
   Thin veneer that (1) boots WebLLM, (2) performs cosine-similarity search */

import initWebLLM from "https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@latest/dist/index.js";

let engine, vectors = [], dim = 0;

/* ───────────────────────── initialize LLM ───────── */
async function boot() {
  engine = await initWebLLM({
    modelUrl: "/assets/llm/models/Qwen-1_5B-q4f16/",  // or CDN path
    wasmUrl : "/assets/llm/models/wasm/",             // fallback kernels
  });
}
const ready = boot();

/* ───────────────────────── load vectors ─────────── */
export async function loadVectors(url){
  const raw = await (await fetch(url)).json();
  vectors = raw.map(r => ({ id: r.id, txt: r.text, vec: r.vector }));
  dim = vectors[0].vec.length;
}

/* ───────────────────────── simple search ────────── */
export async function search(query, k=4){
  await ready;
  const qvec = await engine.embedding(query);         // MiniLM dims = 384
  const scores = vectors.map(({vec}) => dot(vec, qvec) / (norm(vec)*norm(qvec)));
  // pick top-k indices
  return scores
    .map((s,i)=>[s,i]).sort((a,b)=>b[0]-a[0]).slice(0,k)
    .map(([,i]) => vectors[i].txt);
}

/* ───────────────────────── ask LLM ─────────────── */
export async function ask(prompt){
  await ready;
  return engine.chat.generate(prompt, { temperature: 0.2, maxTokens: 256 });
}

/* ── tiny linear-algebra helpers ─────────────────── */
function dot(a,b){ let s=0; for(let i=0;i<dim;i++) s+=a[i]*b[i]; return s;}
function norm(a){ return Math.sqrt(dot(a,a)); }
