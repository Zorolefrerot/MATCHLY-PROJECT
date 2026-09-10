#!/usr/bin/env bash
set -euo pipefail
# Official editor + Android templates, pinned to one release and SHA-256 digests.
# Large downloads only live in build caches, never in Git or the Render service.
ROOT="${GODOT_TOOLS_DIR:-${RUNNER_TEMP:-/tmp}/idrem-godot}"
mkdir -p "$ROOT"
BASE=https://github.com/godotengine/godot-builds/releases/download/4.5.1-stable
EDITOR=Godot_v4.5.1-stable_linux.x86_64.zip
TEMPLATES=Godot_v4.5.1-stable_export_templates.tpz
curl --fail --location --retry 3 --silent --show-error "$BASE/$EDITOR" -o "$ROOT/$EDITOR"
echo "02ec53d1cc7dbb9cc6355393c61b9ab43d1244751a124f10248a4802830788cd  $ROOT/$EDITOR" | sha256sum -c -
unzip -oq "$ROOT/$EDITOR" -d "$ROOT"
chmod +x "$ROOT/Godot_v4.5.1-stable_linux.x86_64"
if [[ "${1:-}" == "--android" ]]; then
  curl --fail --location --retry 3 --silent --show-error "$BASE/$TEMPLATES" -o "$ROOT/$TEMPLATES"
  echo "1998af37f1387684e2c211cdb483daf492fc64dc6b12096bddcdca25b6910c86  $ROOT/$TEMPLATES" | sha256sum -c -
  DEST="${XDG_DATA_HOME:-$HOME/.local/share}/godot/export_templates/4.5.1.stable"
  mkdir -p "$DEST"
  unzip -ojq "$ROOT/$TEMPLATES" templates/android_debug.apk templates/android_release.apk -d "$DEST"
  rm "$ROOT/$TEMPLATES"
fi
printf '\nGodot installed: %s\n' "$ROOT/Godot_v4.5.1-stable_linux.x86_64"
