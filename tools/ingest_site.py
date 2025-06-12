#!/usr/bin/env python3
"""
ingest_site.py  ────────────────────────────────────────────────────────────────
Create a lightweight JSON embedding index for a (Quarto‑rendered) static site.

USAGE
─────
python tools/ingest_site.py \
       --site-dir docs \
       --out-file assets/llm/vectors.json \
       --chunk-size 1024

DEPENDENCIES
────────────
pip install sentence-transformers beautifulsoup4 tqdm
"""
from __future__ import annotations
import argparse, json, re, textwrap, pathlib, sys
from bs4 import BeautifulSoup
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

# ── CLI ────────────────────────────────────────────────────────────────────────
def parseArgs():
    p = argparse.ArgumentParser()
    p.add_argument("--site-dir",  default="docs",
                   help="Root directory containing rendered HTML pages")
    p.add_argument("--out-file",  default="assets/llm/vectors.json",
                   help="Output JSON file with embeddings")
    p.add_argument("--chunk-size",type=int, default=1024,
                   help="Approx. characters per chunk (kept under browser token limits)")
    p.add_argument("--model",     default="all-MiniLM-L6-v2",
                   help="Hugging‑Face model for text embeddings")
    return p.parse_args()

# ── Helpers ────────────────────────────────────────────────────────────────────
def findHtmlFiles(root: pathlib.Path):
    return sorted(root.rglob("*.html"))

# very light clean‑up: strips scripts/styles and collapses whitespace
def htmlToText(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    raw = soup.get_text(" ", strip=True)
    return re.sub(r"\s+", " ", raw)

def chunkText(text: str, size: int):
    # textwrap.wrap keeps words intact; fall back to hard cut if one token ≥ size
    return textwrap.wrap(text, width=size, break_long_words=False,
                         replace_whitespace=False, drop_whitespace=True)

# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    args   = parseArgs()
    root   = pathlib.Path(args.site_dir).expanduser()
    out    = pathlib.Path(args.out_file)
    out.parent.mkdir(parents=True, exist_ok=True)

    model  = SentenceTransformer(args.model)
    files  = findHtmlFiles(root)
    vectors = []

    print(f"🔍 Scanning {len(files)} HTML pages in “{root}” …", file=sys.stderr)
    for path in tqdm(files, unit="page"):
        text = htmlToText(path.read_text(encoding="utf-8", errors="ignore"))
        for i, chunk in enumerate(chunkText(text, args.chunk_size)):
            emb = model.encode(chunk, show_progress_bar=False).tolist()
            vectors.append({
                "id"    : f"{path.relative_to(root)}#chunk{i}",
                "vector": emb,
                "text"  : chunk
            })

    print(f"💾 Writing {len(vectors):,} chunks → {out}", file=sys.stderr)
    with out.open("w", encoding="utf-8") as f:
        json.dump(vectors, f)

if __name__ == "__main__":
    main()
