#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

if [[ ! -d "$BACKEND_DIR/.venv" ]]; then
  echo "Backend venv not found at $BACKEND_DIR/.venv"
  echo "Create it and install requirements first."
  exit 1
fi

if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  echo "Installing frontend dependencies..."
  (cd "$FRONTEND_DIR" && npm install)
fi

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID"
  fi
  if [[ -n "${FRONTEND_PID:-}" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID"
  fi
}

trap cleanup EXIT INT TERM

# Start backend
(
  cd "$BACKEND_DIR"
  source .venv/bin/activate
  python3 app.py
) &
BACKEND_PID=$!

# Start frontend
(
  cd "$FRONTEND_DIR"
  npm run dev
) &
FRONTEND_PID=$!

wait
