#!/bin/bash
# Digitális receptkönyv – indító macOS-re (dupla kattintással futtatható).
cd "$(dirname "$0")" || exit 1

# A Finderből indított Terminál nem mindig látja a Homebrew / nvm útvonalait.
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh" >/dev/null 2>&1

if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "  A Node.js nincs telepítve – ez szükséges a program futtatásához."
  if command -v brew >/dev/null 2>&1; then
    read -r -p "  Telepítsem most Homebrew-val? (i/n) " answer
    if [ "$answer" = "i" ] || [ "$answer" = "I" ]; then
      brew install node || exit 1
    fi
  fi
  if ! command -v node >/dev/null 2>&1; then
    echo "  Töltsd le és telepítsd az LTS verziót: https://nodejs.org/ – majd indítsd újra ezt a fájlt."
    open "https://nodejs.org/" 2>/dev/null
    read -r -p "  Nyomj Entert a kilépéshez..." _
    exit 1
  fi
fi

node scripts/launch.mjs
status=$?
if [ $status -ne 0 ]; then
  read -r -p "  Hiba történt. Nyomj Entert a kilépéshez..." _
fi
exit $status
