/* assets/llm/webllm-wrapper.js
   Boots WebLLM and provides RAG helpers. */

   import initWebLLM from "https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@latest/dist/index.js";

   let engine, vectors = [], dim = 0;
   
   /* ── initialise LLM (paths now relative to THIS file) ───────────── */
   async function boot() {
     engine = await initWebLLM({
       modelUrl: new URL("./models/Qwen-1_5B-q4f16/", import.meta.url).href,
       wasmUrl : new URL("./models/wasm/",            import.meta.url).href,
     });
   }
   const ready = boot();
   
   /* ── load vectors once ──────────────────────────────────────────── */
   export async function loadVectors(url) {
     const raw = await (await fetch(url)).json();
     vectors = raw.map(r => ({ id: r.id, txt: r.text, vec: r.vector }));
     dim = vectors[0].vec.length;
   }
   
   /* ── cosine-similarity search over embeddings ───────────────────── */
   export async function search(query, k = 4) {
     await ready;
     const qvec   = await engine.embedding(query);        // MiniLM dims ≈ 384
     const scores = vectors.map(({ vec }) =>
       dot(vec, qvec) / (norm(vec) * norm(qvec))
     );
   
     return scores
       .map((s, i) => [s, i])          // pair score with index
       .sort((a, b) => b[0] - a[0])    // highest first
       .slice(0, k)
       .map(([, i]) => vectors[i].txt);
   }
   
   /* ── send prompt + context to model ─────────────────────────────── */
   export async function ask(prompt) {
     await ready;
     return engine.chat.generate(prompt, {
       temperature: 0.2,
       maxTokens: 256,
     });
   }
   
   /* ── tiny linear-algebra helpers ───────────────────────────────── */
   function dot(a, b)  { let s = 0; for (let i = 0; i < dim; i++) s += a[i] * b[i]; return s; }
   function norm(a)    { return Math.sqrt(dot(a, a)); }
   