#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

fail() {
  printf '\nERROR: %s\n' "$1" >&2
  exit 1
}

command -v node >/dev/null 2>&1 || fail "Node.js 20.19 or newer is required. Install it from https://nodejs.org/ or run: brew install node"
command -v npm >/dev/null 2>&1 || fail "npm was not found. Reinstall Node.js from https://nodejs.org/."
command -v docker >/dev/null 2>&1 || fail "Docker Desktop is required. Install it from https://www.docker.com/products/docker-desktop/."

node -e "const v=process.versions.node.split('.').map(Number);process.exit(v[0]<20||(v[0]===20&&v[1]<19)?1:0)" \
  || fail "Node.js 20.19 or newer is required. Install the current Node.js LTS release."

if ! docker info >/dev/null 2>&1; then
  if [[ -d /Applications/Docker.app ]]; then
    printf 'Starting Docker Desktop...\n'
    open -a Docker || fail "Could not start Docker Desktop. Open it manually, wait for it to finish starting, then rerun this script."
  else
    fail "Docker Desktop is not running. Start Docker Desktop, wait until it is ready, then rerun this script."
  fi

  for _ in {1..60}; do
    if docker info >/dev/null 2>&1; then
      break
    fi
    sleep 2
  done
  docker info >/dev/null 2>&1 || fail "Docker Desktop did not become ready. Open it, resolve any startup prompts, and rerun this script."
fi

printf '\nSmartService first-time setup for macOS\n'
printf 'Project folder: %s\n\n' "$ROOT"

cd "$ROOT"
printf '[1/4] Creating local backend settings...\n'
node scripts/setup-env.js

printf '\n[2/4] Installing backend dependencies...\n'
(cd backend && npm ci)

printf '\n[3/4] Installing web and mobile dependencies...\n'
(cd frontend && npm ci)
(cd mobile && npm ci)

printf '\n[4/4] Starting SmartService...\n'
exec bash "$ROOT/scripts/start-mac.sh"
