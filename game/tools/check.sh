#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
GODOT="${GODOT_BIN:-godot}"
LOG_DIR="${RUNNER_TEMP:-/tmp}/idrem-check"
mkdir -p "$LOG_DIR"
report_check_failure() {
  trap - ERR
  python3 - "$LOG_DIR" <<'PYCODE'
import pathlib, re, sys
folder = pathlib.Path(sys.argv[1])
for name in ['import.log', 'smoke.log', 'network.log', 'spectacle.log']:
    path = folder / name
    if not path.exists(): continue
    text = re.sub(r'\x1b\[[0-9;]*m', '', path.read_text(errors='replace'))
    lines = text.splitlines()
    selected = [line for line in lines if any(key in line for key in ['ERROR:', 'Parse Error:', 'TEST FAILED:', 'IDREM_SMOKE', 'IDREM_VILLAGE', 'IDREM_NATIVE', 'Leaked instance', 'Resource still in use', 'Orphan StringName'])]
    message = '\n'.join(selected or lines[-15:])[-12000:]
    message = message.replace('%', '%25').replace('\r', '%0D').replace('\n', '%0A')
    print(f'::error title={name}::' + message)
PYCODE
  exit 1
}
trap report_check_failure ERR
timeout 120 "$GODOT" --headless --audio-driver Dummy --path game --editor --import 2>&1 | tee "$LOG_DIR/import.log"
if grep -E 'SCRIPT ERROR:|Parse Error:|ERROR:' "$LOG_DIR/import.log"; then
  echo '::error::Godot import or GDScript parsing failed. See import.log.'
  report_check_failure
fi
timeout 120 "$GODOT" --headless --verbose --audio-driver Dummy --path game --script res://tests/smoke.gd 2>&1 | tee "$LOG_DIR/smoke.log"
if grep -E 'SCRIPT ERROR:|TEST FAILED:|ERROR:' "$LOG_DIR/smoke.log" || ! grep -q 'IDREM_SMOKE_FAILURES=0' "$LOG_DIR/smoke.log"; then
  echo '::error::Godot gameplay tests failed. See smoke.log.'
  report_check_failure
fi

printf "::notice title=Godot simulation::%s assertions passed\n" "$(grep -c '^PASS:' "$LOG_DIR/smoke.log")"

# The same-port network integration uses disposable SQLite + a local CA only.
# No production DATABASE_URL, user credentials, or external multiplayer service.
node -e 'require("node:sqlite")' # Node >=22.13, as required by the site.
npm ci --no-audit --no-fund
node game/tests/run-network.mjs 2>&1 | tee "$LOG_DIR/network.log"
grep -q IDREM_NATIVE_WSS_SUCCESS "$LOG_DIR/network.log"

# Gate the installer on an actual GL image difference, not just live nodes.
# The standard Ubuntu runner supplies Xvfb/Mesa; local headless-only users may
# run the behavioral checks without a display, but CI must exercise this gate.
if [[ "${GITHUB_ACTIONS:-false}" == "true" || "${IDREM_RENDER_CHECK:-0}" == "1" ]]; then
  LIBGL_ALWAYS_SOFTWARE=1 timeout 90 xvfb-run -a -s '-screen 0 1280x720x24' "$GODOT" --path game --rendering-method gl_compatibility --audio-driver Dummy --script res://tests/spectacle_render.gd 2>&1 | tee "$LOG_DIR/spectacle.log"
  ! grep -E 'SCRIPT ERROR:|ERROR:' "$LOG_DIR/spectacle.log"
  grep -q IDREM_SPECTACLE_RENDER_SUCCESS "$LOG_DIR/spectacle.log"
fi
