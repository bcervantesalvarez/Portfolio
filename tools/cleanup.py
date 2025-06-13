#!/usr/bin/env python3
"""
cleanup.py ─────────────────────────────────────────────────────────────────────
Post-render cleanup script for Quarto builds.

This script runs after Quarto renders the site and handles:
- Cleaning up temporary files
- Optimizing the chat integration
- Copying assets to the right locations
"""
import os
import sys
import pathlib
import shutil

def main():
    """Post-render cleanup tasks"""
    print("🧹 Running post-render cleanup...", file=sys.stderr)
    
    # Ensure assets directory structure exists
    assets_dir = pathlib.Path("docs/assets/llm")
    assets_dir.mkdir(parents=True, exist_ok=True)
    
    # Copy vectors.json to the docs directory if it exists
    source_vectors = pathlib.Path("assets/llm/vectors.json")
    target_vectors = pathlib.Path("docs/assets/llm/vectors.json")
    
    if source_vectors.exists():
        shutil.copy2(source_vectors, target_vectors)
        print(f"📋 Copied vectors.json to docs directory", file=sys.stderr)
    
    # Copy chat assets
    chat_files = [
        ("assets/html/chat.html", "docs/assets/html/chat.html"),
        ("assets/llm/chat.css", "docs/assets/llm/chat.css"),
    ]
    
    for source, target in chat_files:
        source_path = pathlib.Path(source)
        target_path = pathlib.Path(target)
        
        if source_path.exists():
            target_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source_path, target_path)
            print(f"📋 Copied {source} to docs", file=sys.stderr)
    
    # Clean up temporary files
    temp_patterns = [
        "**/*.tmp",
        "**/.DS_Store",
        "**/Thumbs.db",
        ".vector_cache"
    ]
    
    cleaned_count = 0
    for pattern in temp_patterns:
        for temp_file in pathlib.Path(".").glob(pattern):
            try:
                temp_file.unlink()
                cleaned_count += 1
            except OSError:
                pass
    
    if cleaned_count > 0:
        print(f"🗑️ Cleaned up {cleaned_count} temporary files", file=sys.stderr)
    
    print("✅ Post-render cleanup completed", file=sys.stderr)

if __name__ == "__main__":
    main()