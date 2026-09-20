#!/usr/bin/env bash
# Cutover do legado v5 → v6 (parte de ficheiros). Ver docs/CUTOVER.md p/ passos de infra (GitHub Pages).
set -euo pipefail
echo "[cutover] a arquivar legado v5 para legacy/ ..."
mkdir -p legacy
for f in index.html sw.js manifest.webmanifest migrate.json; do
  [ -e "$f" ] && git mv "$f" legacy/ && echo "  movido: $f"
done
cat > index.html <<'HTML'
<!doctype html><html lang="pt"><head><meta charset="utf-8">
<meta http-equiv="refresh" content="0;url=https://phc-trainer-pro-web.vercel.app">
<title>PHC Trainer Pro</title></head>
<body>A app mudou para <a href="https://phc-trainer-pro-web.vercel.app">https://phc-trainer-pro-web.vercel.app</a>.</body></html>
HTML
git add index.html
echo "[cutover] feito. Agora: ajustar GitHub Pages (Settings→Pages) e fazer release/tag. Ver docs/CUTOVER.md."
