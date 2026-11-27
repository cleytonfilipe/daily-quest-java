#!/usr/bin/env bash
# Copia o SDK web do Firebase (builds ESM "de CDN") do pacote npm para app/vendor/firebase,
# trocando o import absoluto do gstatic por um import relativo.
# Uso: bash tools/vendor-firebase.sh 11.10.0
set -euo pipefail
VERSION="${1:-11.10.0}"
WORK="$(mktemp -d)"
( cd "$WORK" && npm pack --silent "firebase@${VERSION}" >/dev/null 2>&1 && tar xzf firebase-*.tgz )
DEST="$(dirname "$0")/../app/vendor/firebase"
mkdir -p "$DEST"
for f in firebase-app.js firebase-auth.js firebase-firestore.js; do
  sed "s#https://www.gstatic.com/firebasejs/${VERSION}/firebase-app.js#./firebase-app.js#g" \
    "$WORK/package/$f" > "$DEST/$f"
done
grep -m1 "\"license\"" "$WORK/package/package.json"
echo "Firebase ${VERSION} copiado para app/vendor/firebase"
