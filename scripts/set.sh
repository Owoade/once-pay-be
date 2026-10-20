#!/usr/bin/env bash
set -euo pipefail

# Once-Pay backend setup: ensure pm2 exists, install deps, start the built
# server under pm2.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# The backend directory is named once-pay-be. Prefer it as a sibling script
# folder (workspace layout), fall back to the script's own parent
# (in-repo layout at once-pay-be/scripts/set.sh).
if [ -d "$SCRIPT_DIR/../once-pay-be" ]; then
    BACKEND_DIR="$(cd "$SCRIPT_DIR/../once-pay-be" && pwd)"
else
    BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
fi

# pm2 is the process manager — install it globally if it's missing.
if ! command -v pm2 >/dev/null 2>&1; then
    echo "pm2 not found — installing globally..."
    npm install -g pm2
fi

echo "Installing dependencies in $BACKEND_DIR ..."
cd "$BACKEND_DIR"
npm install

# dist/index.js is the pm2 entrypoint — a fresh checkout has no dist yet.
if [ ! -f dist/index.js ]; then
    echo "dist/index.js missing — building..."
    npm run build
fi

pm2 start dist/index.js --name once-pay-be

echo "Done — check with: pm2 ls | tail logs with: pm2 logs once-pay-be"