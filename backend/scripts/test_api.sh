#!/usr/bin/env bash

set -euo pipefail

BASE_URL=${BASE_URL:-"http://127.0.0.1:3001"}
START_SERVER=${START_SERVER:-"auto"} # auto|yes|no

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

function log() { echo "[test] $*"; }

function wait_for_health() {
	local url="$1/health"
	local n=0
	until curl -sf "$url" >/dev/null 2>&1; do
		((n++))
		if [[ $n -ge 30 ]]; then
			return 1
		fi
		sleep 1
	done
	return 0
}

server_pid=""
function maybe_start_server() {
	if curl -sf "$BASE_URL/health" >/dev/null 2>&1; then
		log "Server is already running at $BASE_URL"
		return 0
	fi

	if [[ "$START_SERVER" == "no" ]]; then
		log "Server not running and START_SERVER=no; aborting."
		exit 1
	fi

	log "Starting server..."
	(
		cd "$ROOT_DIR"
		node server.js &
		echo $! > .server.pid
	)
	server_pid="$(cat "$ROOT_DIR/.server.pid")"
	trap 'if [[ -n "$server_pid" ]] && kill -0 "$server_pid" 2>/dev/null; then kill "$server_pid"; fi; rm -f "$ROOT_DIR/.server.pid"' EXIT

	log "Waiting for /health..."
	if ! wait_for_health "$BASE_URL"; then
		log "Server healthcheck failed"
		exit 1
	fi
	log "Server is healthy."
}

function create_message() {
	log "POST /api/chat"
	read -r -d '' BODY <<'JSON'
{
  "userInfo": {
    "name": "Test User",
    "birthdate": "1990-01-01",
    "sex": "other",
    "topic": "overall"
  },
  "message": "ปีนี้ควรโฟกัสเรื่องไหนมากที่สุด?"
}
JSON

	RESP=$(curl -s -S -X POST "$BASE_URL/api/chat" -H 'Content-Type: application/json' -d "$BODY") || true
	echo "$RESP"
	ID=$(printf '%s' "$RESP" | sed -n 's/.*"_id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n1)
	if [[ -z "$ID" ]]; then
		log "Could not parse created _id (Typhoon may have failed). Proceeding anyway."
	else
		printf '%s' "$ID" > "$ROOT_DIR/.last_id"
		log "Created message id=$ID"
	fi
}

function get_history() {
	log "GET /api/chat/history"
	curl -s -S "$BASE_URL/api/chat/history?name=Test%20User&birthdate=1990-01-01" | head -c 500; echo
}

function edit_message() {
	if [[ ! -f "$ROOT_DIR/.last_id" ]]; then
		log "No saved id to edit; skipping edit test."
		return 0
	fi
	ID="$(cat "$ROOT_DIR/.last_id")"
	log "PUT /api/chat/$ID"
	read -r -d '' BODY <<'JSON'
{
  "newMessage": "ถ้าเน้นงาน จะกระทบสุขภาพไหม?"
}
JSON
	curl -s -S -X PUT "$BASE_URL/api/chat/$ID" -H 'Content-Type: application/json' -d "$BODY" | head -c 500; echo
}

maybe_start_server
create_message
get_history
edit_message

log "Done."

