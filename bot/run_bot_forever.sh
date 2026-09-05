#!/usr/bin/env bash
# NiniPro Bot — always-on launcher + crash-restart guard
# Usage: ./run_bot_forever.sh
# Requires: BOT_TOKEN + ADMIN_IDS present in .env (loaded automatically)
set -u
cd "$(dirname "$0")"

# Load env
set -a; source ./.env 2>/dev/null; set +a

if [ -z "${BOT_TOKEN:-}" ]; then
  echo "$(date '+%F %T') [FATAL] BOT_TOKEN missing in .env — bot cannot start." >&2
  exit 1
fi

echo "$(date '+%F %T') [INFO] Starting NiniPro bot guard (token len=${#BOT_TOKEN})"

while true; do
  echo "$(date '+%F %T') [INFO] Launching ninipro_bot.py..."
  python3 ninipro_bot.py
  code=$?
  echo "$(date '+%F %T') [WARN] Bot exited with code $code — restarting in 5s"
  sleep 5
done
