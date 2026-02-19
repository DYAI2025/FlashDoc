#!/bin/bash
# Build a clean ZIP for Chrome Web Store upload.
# Only includes files that belong to the extension.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VERSION=$(grep '"version"' "$ROOT/manifest.json" | sed 's/.*: *"\(.*\)".*/\1/')
OUT="$ROOT/FlashDoc-v${VERSION}.zip"

cd "$ROOT"

# Remove old zip if exists
rm -f "$OUT"

# Create zip with only extension files (no junk, no dev files)
zip -r "$OUT" \
  manifest.json \
  service-worker.js \
  content.js \
  detection-utils.js \
  options.html \
  options.js \
  options.css \
  popup.html \
  popup.js \
  popup.css \
  icon16.png \
  icon48.png \
  icon128.png \
  lib/ \
  privacy/ \
  -x "*.DS_Store" "*.zip"

echo ""
echo "Built: $OUT"
echo "Version: $VERSION"
echo "Contents:"
unzip -l "$OUT"
echo ""
echo "Ready for Chrome Web Store upload!"
