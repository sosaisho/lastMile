#!/bin/bash
# LastMile — one-command local start
# Usage: ./start.sh
# The app opens in your browser automatically. No .env required on first run.

set -e
cd "$(dirname "$0")"

# Install server dependencies on first run
if [ ! -d "server/node_modules" ]; then
  echo "Installing dependencies (first run only)..."
  npm install --prefix server --silent
fi

# Start the server in the background
node server/index.js &
SERVER_PID=$!

# Give the server a moment to start, then open the browser
sleep 1.5

URL="http://localhost:8787/passage-v2.html"

if command -v open &>/dev/null; then
  open "$URL"
elif command -v xdg-open &>/dev/null; then
  xdg-open "$URL"
elif command -v start &>/dev/null; then
  start "$URL"
else
  echo "  Open $URL in your browser."
fi

# Keep the script alive so Ctrl+C stops the server
trap "kill $SERVER_PID 2>/dev/null; exit 0" INT TERM
wait $SERVER_PID
