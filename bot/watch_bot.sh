#!/usr/bin/env bash
# NiniPro Bot Watcher — keeps the bot alive even if this AI session ends.
# Runs every 5 min via cron. Starts the guard if: token valid AND not running.
PROC="ninipro_bot.py"
LOG=/tmp/bot_watch.log
cd /tmp/ninisrc/bot || exit 0

# already running?
if pgrep -f "$PROC" > /dev/null 2>&1; then
  exit 0
fi

# load token
set -a; source ./.env 2>/dev/null; set +a
if [ -z "${BOT_TOKEN:-}" ]; then
  echo "$(date '+%F %T') [watch] BOT_TOKEN missing — skip" >> "$LOG"
  exit 0
fi

# token valid?
ok=$(curl -s --max-time 8 "https://api.telegram.org/bot${BOT_TOKEN}/getMe" | grep -o '"ok":true')
if [ "$ok" != '"ok":true' ]; then
  echo "$(date '+%F %T') [watch] token INVALID — skip (need fresh token in .env)" >> "$LOG"
  exit 0
fi

nohup bash run_bot_forever.sh >> /tmp/bot_run.log 2>&1 &
echo "$(date '+%F %T') [watch] bot started (pid $!)" >> "$LOG"
