#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
GODOT="${GODOT_BIN:-godot}"
LOG_DIR="${RUNNER_TEMP:-/tmp}/idrem-check"
mkdir -p "$LOG_DIR"
"$GODOT" --headless --path game --editor --import 2>&1 | tee "$LOG_DIR/import.log"
if grep -E 'SCRIPT ERROR:|Parse Error:|ERROR:' "$LOG_DIR/import.log"; then
  echo '::error::Godot import or GDScript parsing failed. See import.log.'
  exit 1
fi
"$GODOT" --headless --path game --script res://tests/smoke.gd 2>&1 | tee "$LOG_DIR/smoke.log"
if grep -E 'SCRIPT ERROR:|TEST FAILED:|ERROR:' "$LOG_DIR/smoke.log" || ! grep -q 'IDREM_SMOKE_FAILURES=0' "$LOG_DIR/smoke.log"; then
  echo '::error::Godot gameplay tests failed. See smoke.log.'
  exit 1
fi
