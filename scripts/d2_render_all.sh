#!/usr/bin/env bash
# Recursively render all D2 diagrams under ./wiki/assets into SVGs.
# Works on both macOS (Bash 3.x) and Linux. Overwrites existing SVGs. Runs in parallel.

set -euo pipefail

# --- Configuration ---
INPUT_DIR="./wiki/assets"
OUTPUT_EXT="svg"
LAYOUT="elk"
MAX_JOBS=$(command -v nproc >/dev/null 2>&1 && nproc || sysctl -n hw.ncpu 2>/dev/null || echo 4)

# --- Check dependencies ---
if ! command -v d2 >/dev/null 2>&1; then
    echo "❌ Error: d2 CLI not found in PATH."
    echo "Install it from: https://github.com/terrastruct/d2/releases"
    exit 1
fi

if [ ! -d "$INPUT_DIR" ]; then
    echo "❌ Error: Directory '$INPUT_DIR' does not exist."
    exit 1
fi

echo "🔍 Searching for .d2 files in '$INPUT_DIR'..."
D2_FILES=$(find "$INPUT_DIR" -type f -name "*.d2" | sort)

if [ -z "$D2_FILES" ]; then
    echo "⚠️  No .d2 files found."
    exit 0
fi

echo "⚙️  Rendering diagrams in parallel (max $MAX_JOBS jobs)..."

# --- Rendering function ---
render_file() {
    local file="$1"
    local output="${file%.*}.${OUTPUT_EXT}"
    echo "→ Rendering: $(basename "$file")"
    if ! d2 --layout "$LAYOUT" "$file" "$output" >/dev/null 2>&1; then
        echo "❌ Failed: $file" >&2
    fi
}
export -f render_file
export LAYOUT OUTPUT_EXT

# --- Parallel execution (xargs compatible everywhere) ---
echo "$D2_FILES" | xargs -P "$MAX_JOBS" -I{} bash -c 'render_file "$@"' _ {}

echo "✅ Done. Rendered all diagrams to SVG."
