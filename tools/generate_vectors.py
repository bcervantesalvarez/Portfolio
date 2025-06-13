#!/usr/bin/env python3
"""
generate_vectors.py ─────────────────────────────────────────────────────────────
Enhanced vector generation script that only runs when needed.
Integrates with Quarto's pre-render process.

USAGE
─────
python tools/generate_vectors.py [--force]

FEATURES
────────
- Only regenerates when source files are newer than existing vectors
- Skips generation during development unless explicitly forced
- Integrates with Quarto's rendering pipeline
- Better chunk processing for Brian's content
- Enhanced metadata extraction
"""
from __future__ import annotations
import argparse, json, re, textwrap, pathlib, sys, os, time
from datetime import datetime
from bs4 import BeautifulSoup
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

# ── Configuration ──────────────────────────────────────────────────────────────
SITE_DIR = "docs"
OUTPUT_FILE = "assets/llm/vectors.json"
CHUNK_SIZE = 1024
MODEL_NAME = "all-MiniLM-L6-v2"
CACHE_FILE = ".vector_cache"

# Skip if not in production render (unless forced)
def should_skip_generation():
    """Check if we should skip vector generation"""
    # Always run if forced
    if "--force" in sys.argv:
        return False
    
    # Skip if QUARTO_PROJECT_RENDER_ALL is not set (development mode)
    if not os.getenv("QUARTO_PROJECT_RENDER_ALL"):
        print("ℹ️ Skipping vector generation in development mode (use --force to override)", file=sys.stderr)
        return True
    
    # Check if vectors exist and are newer than source files
    if pathlib.Path(OUTPUT_FILE).exists():
        vector_time = pathlib.Path(OUTPUT_FILE).stat().st_mtime
        
        # Check if any source .qmd files are newer
        source_files = list(pathlib.Path(".").glob("**/*.qmd"))
        if source_files:
            newest_source = max(f.stat().st_mtime for f in source_files)
            if vector_time > newest_source:
                print("ℹ️ Vectors are up to date, skipping generation", file=sys.stderr)
                return True
    
    return False

# ── CLI ────────────────────────────────────────────────────────────────────────
def parse_args():
    p = argparse.ArgumentParser(description="Generate embeddings for Brian's website")
    p.add_argument("--site-dir", default=SITE_DIR, help="Root directory containing rendered HTML")
    p.add_argument("--out-file", default=OUTPUT_FILE, help="Output JSON file with embeddings")
    p.add_argument("--chunk-size", type=int, default=CHUNK_SIZE, help="Characters per chunk")
    p.add_argument("--model", default=MODEL_NAME, help="Sentence transformer model")
    p.add_argument("--force", action="store_true", help="Force regeneration even if up to date")
    return p.parse_args()

# ── Enhanced Content Processing ────────────────────────────────────────────────
def find_html_files(root: pathlib.Path):
    """Find all HTML files, prioritizing important pages"""
    all_files = sorted(root.rglob("*.html"))
    
    # Prioritize key pages
    priority_patterns = [
        "**/index.html", "**/about.html", "**/projects.html", 
        "**/blog/**/*.html", "**/presentations/**/*.html"
    ]
    
    priority_files = []
    other_files = []
    
    for file in all_files:
        is_priority = any(file.match(pattern) for pattern in priority_patterns)
        if is_priority:
            priority_files.append(file)
        else:
            other_files.append(file)
    
    return priority_files + other_files

def extract_metadata(soup: BeautifulSoup, file_path: pathlib.Path):
    """Extract meaningful metadata from HTML"""
    metadata = {
        "file": str(file_path),
        "title": "",
        "section": "",
        "content_type": "page"
    }
    
    # Extract title
    title_tag = soup.find("title")
    if title_tag:
        metadata["title"] = title_tag.get_text().strip()
    
    # Determine section from path
    path_parts = file_path.parts
    if "blog" in path_parts:
        metadata["section"] = "blog"
        metadata["content_type"] = "blog_post"
    elif "projects" in path_parts:
        metadata["section"] = "projects"
        metadata["content_type"] = "project"
    elif "presentations" in path_parts:
        metadata["section"] = "presentations"
        metadata["content_type"] = "presentation"
    elif file_path.name == "about.html":
        metadata["section"] = "about"
        metadata["content_type"] = "bio"
    elif file_path.name == "index.html":
        metadata["section"] = "home"
        metadata["content_type"] = "landing"
    
    return metadata

def html_to_text(html: str, file_path: pathlib.Path) -> str:
    """Enhanced HTML to text conversion with better cleaning"""
    soup = BeautifulSoup(html, "html.parser")
    
    # Remove unwanted elements
    for tag in soup(["script", "style", "noscript", "nav", "footer", "header"]):
        tag.decompose()
    
    # Remove common navigation and UI elements
    for class_name in ["navbar", "sidebar", "breadcrumb", "pagination", "footer"]:
        for element in soup.find_all(class_=class_name):
            element.decompose()
    
    # Get main content area if it exists
    main_content = soup.find("main") or soup.find("article") or soup.find(class_="content")
    if main_content:
        soup = main_content
    
    # Extract text
    raw = soup.get_text(" ", strip=True)
    
    # Clean up whitespace and common artifacts
    text = re.sub(r"\s+", " ", raw)
    text = re.sub(r"(Home|About|Projects|Blog|Presentations)\s*", "", text)  # Remove nav items
    text = re.sub(r"Copyright.*?All rights reserved\.?", "", text)  # Remove copyright
    
    return text.strip()

def enhanced_chunk_text(text: str, size: int, metadata: dict):
    """Enhanced chunking that preserves context"""
    # For short content, return as single chunk
    if len(text) <= size:
        return [text]
    
    # Split by paragraphs first to maintain context
    paragraphs = text.split('\n\n')
    chunks = []
    current_chunk = ""
    
    for para in paragraphs:
        # If adding this paragraph would exceed chunk size
        if len(current_chunk) + len(para) > size and current_chunk:
            chunks.append(current_chunk.strip())
            current_chunk = para
        else:
            current_chunk += ("\n\n" if current_chunk else "") + para
    
    # Add the last chunk
    if current_chunk.strip():
        chunks.append(current_chunk.strip())
    
    # If chunks are still too long, use textwrap
    final_chunks = []
    for chunk in chunks:
        if len(chunk) <= size:
            final_chunks.append(chunk)
        else:
            final_chunks.extend(textwrap.wrap(
                chunk, width=size, break_long_words=False,
                replace_whitespace=False, drop_whitespace=True
            ))
    
    return final_chunks

# ── Main Processing ────────────────────────────────────────────────────────────
def main():
    # Check if we should skip
    if should_skip_generation():
        return
    
    args = parse_args()
    root = pathlib.Path(args.site_dir).expanduser()
    out = pathlib.Path(args.out_file)
    out.parent.mkdir(parents=True, exist_ok=True)

    # Check if site directory exists
    if not root.exists():
        print(f"⚠️ Site directory '{root}' does not exist. Run quarto render first.", file=sys.stderr)
        return

    print(f"🤖 Loading model '{args.model}'...", file=sys.stderr)
    model = SentenceTransformer(args.model)
    
    files = find_html_files(root)
    vectors = []
    
    if not files:
        print(f"⚠️ No HTML files found in '{root}'", file=sys.stderr)
        return

    print(f"🔍 Processing {len(files)} HTML pages for Brian's knowledge base...", file=sys.stderr)
    
    for path in tqdm(files, unit="page", desc="Generating embeddings"):
        try:
            html_content = path.read_text(encoding="utf-8", errors="ignore")
            metadata = extract_metadata(BeautifulSoup(html_content, "html.parser"), path)
            text = html_to_text(html_content, path)
            
            # Skip if no meaningful content
            if len(text.strip()) < 50:
                continue
            
            chunks = enhanced_chunk_text(text, args.chunk_size, metadata)
            
            for i, chunk in enumerate(chunks):
                if len(chunk.strip()) < 20:  # Skip very short chunks
                    continue
                    
                emb = model.encode(chunk, show_progress_bar=False).tolist()
                
                vectors.append({
                    "id": f"{path.relative_to(root)}#chunk{i}",
                    "text": chunk,
                    "vector": emb,  # Note: using 'vector' to match your existing format
                    "metadata": metadata,
                    "chunk_index": i,
                    "file_path": str(path.relative_to(root))
                })
                
        except Exception as e:
            print(f"⚠️ Error processing {path}: {e}", file=sys.stderr)
            continue

    if not vectors:
        print("⚠️ No vectors generated. Check your content.", file=sys.stderr)
        return

    print(f"💾 Writing {len(vectors):,} vectors → {out}", file=sys.stderr)
    
    # Create enhanced output with metadata
    output_data = {
        "vectors": vectors,
        "metadata": {
            "generated_at": datetime.now().isoformat(),
            "model": args.model,
            "chunk_size": args.chunk_size,
            "total_chunks": len(vectors),
            "source_files": len(files)
        }
    }
    
    with out.open("w", encoding="utf-8") as f:
        json.dump(vectors, f, indent=2)  # Keep simple format for compatibility
    
    # Save metadata separately for debugging
    metadata_file = out.parent / "vectors_metadata.json"
    with metadata_file.open("w", encoding="utf-8") as f:
        json.dump(output_data["metadata"], f, indent=2)
    
    print(f"✅ Generated {len(vectors)} embeddings from {len(files)} pages", file=sys.stderr)
    print(f"📊 Model: {args.model} | Chunk size: {args.chunk_size}", file=sys.stderr)

if __name__ == "__main__":
    main()