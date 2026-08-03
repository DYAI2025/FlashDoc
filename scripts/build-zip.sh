#!/bin/bash
# Build a Chrome Web Store ZIP — fail-closed (FLAS-4).
#
# The include list is DERIVED from manifest/HTML/importScripts references by
# scripts/validate-extension.cjs (single source of truth). Any missing
# referenced file fails validation and therefore the build (exit != 0).
# After packing, the ZIP is extracted and re-validated so the artifact itself
# is proven complete. Build metadata (SHA-256, version, commit) is printed.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

echo "==> Validating extension source tree"
node scripts/validate-extension.cjs "$ROOT"

VERSION=$(node -e "process.stdout.write(require('$ROOT/manifest.json').version)")
OUT="$ROOT/FlashDoc-v${VERSION}.zip"
rm -f "$OUT"

echo "==> Deriving runtime file list"
FILE_LIST=$(node scripts/validate-extension.cjs "$ROOT" --list-files)
COUNT=$(printf '%s\n' "$FILE_LIST" | wc -l | tr -d ' ')
echo "    ${COUNT} files"

echo "==> Packing"
# shellcheck disable=SC2086
printf '%s\n' "$FILE_LIST" | zip -q "$OUT" -@

echo "==> Verifying packed artifact (extract + re-validate)"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
unzip -q "$OUT" -d "$TMP"
node scripts/validate-extension.cjs "$TMP"

SHA256=$(shasum -a 256 "$OUT" | awk '{print $1}')
COMMIT=$(git -C "$ROOT" rev-parse HEAD 2>/dev/null || echo "unknown")

echo ""
echo "Build metadata"
echo "  artifact : $OUT"
echo "  version  : $VERSION"
echo "  commit   : $COMMIT"
echo "  sha256   : $SHA256"
echo "  files    : $COUNT"
echo ""
echo "Artifact validated — safe to upload to the Chrome Web Store."
