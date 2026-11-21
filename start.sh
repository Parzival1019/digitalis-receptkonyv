#!/usr/bin/env bash
# Digitális receptkönyv – indító Linuxra / macOS terminálból: ./start.sh
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "A Node.js nincs telepítve. Telepítsd a 22.13+ (LTS) verziót: https://nodejs.org/"
  exit 1
fi
exec node scripts/launch.mjs
