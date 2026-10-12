#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RUNTIME_DIR="$ROOT/.runtime"
LOG_DIR="$RUNTIME_DIR/logs"
PIDS=()

cleanup() {
  local pid
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  for pid in "${PIDS[@]}"; do
    wait "$pid" 2>/dev/null || true
  done
  printf '\nSmartService app processes stopped. Database data is preserved.\n'
}

show_logs() {
  local file="$1"
  if [[ -f "$file" ]]; then
    tail -n 40 "$file"
  fi
}

fail() {
  printf '\nERROR: %s\n' "$1" >&2
  exit 1
}

[[ -f "$ROOT/backend/.env" ]] || fail "backend/.env is missing. Run setup-mac.sh first."
command -v docker >/dev/null 2>&1 || fail "Docker was not found. Install Docker Desktop."
command -v node >/dev/null 2>&1 || fail "Node.js was not found. Install Node.js 20.19 or newer."

mkdir -p "$LOG_DIR"
cd "$ROOT"

printf 'Starting MySQL and RabbitMQ...\n'
docker compose -f "$ROOT/docker-compose.yml" up -d --wait mysql rabbitmq \
  || fail "MySQL or RabbitMQ failed to start. Check Docker Desktop and ports 3307 and 5672."

trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

(
  cd "$ROOT/backend"
  exec node server.js
) >"$LOG_DIR/backend.log" 2>&1 &
PIDS+=("$!")

(
  cd "$ROOT/backend"
  exec node services/outboxPublisher.js
) >"$LOG_DIR/outbox-publisher.log" 2>&1 &
PIDS+=("$!")

(
  cd "$ROOT/backend"
  exec node services/bookingEventWorker.js
) >"$LOG_DIR/event-worker.log" 2>&1 &
PIDS+=("$!")

(
  cd "$ROOT/frontend"
  exec ./node_modules/.bin/vite --host 0.0.0.0
) >"$LOG_DIR/frontend.log" 2>&1 &
PIDS+=("$!")

printf 'Waiting for the API health check...\n'
api_ready=false
for _ in {1..60}; do
  if curl --silent --fail http://localhost:5000/api/health >/dev/null; then
    api_ready=true
    break
  fi
  sleep 1
done

if [[ "$api_ready" != true ]]; then
  show_logs "$LOG_DIR/backend.log"
  fail "The API did not become ready. Check backend/.env and the backend log above."
fi

printf '\nWeb app:    http://localhost:3000\n'
printf 'API health: http://localhost:5000/api/health\n'
printf 'Mobile:     Expo Go QR code will appear below\n'
printf 'Logs:       %s\n' "$LOG_DIR"
printf '\nPress Control-C to stop the app processes. MySQL and RabbitMQ will keep running.\n\n'

open http://localhost:3000 >/dev/null 2>&1 || true
cd "$ROOT/mobile"
./node_modules/.bin/expo start --lan
