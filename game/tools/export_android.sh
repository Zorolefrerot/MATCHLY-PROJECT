#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
: "${JAVA_HOME:?Install JDK 17 and set JAVA_HOME}"
: "${ANDROID_HOME:?Install the Android SDK and set ANDROID_HOME}"
GODOT="${GODOT_BIN:-godot}"
WORK="${RUNNER_TEMP:-/tmp}/idrem-android"
# Never replace the developer's own Godot editor preferences.
export XDG_CONFIG_HOME="$WORK/editor-config"
CONFIG="$XDG_CONFIG_HOME/godot"
mkdir -p "$WORK" "$CONFIG" game/artifacts
# Surface bounded build diagnostics through the Checks API too: artifact/log
# download hosts are not reachable from every development environment.
report_export_failure() {
  local status=$?
  trap - ERR
  python3 - "$WORK/export.log" <<'PY'
import pathlib, re, sys
path = pathlib.Path(sys.argv[1])
text = path.read_text(errors='replace') if path.exists() else 'Export failed before Godot produced a log. Check the JDK and debug-key creation step.'
text = re.sub(r'\x1b\[[0-9;]*m', '', text)
message = '\n'.join(text.splitlines()[-45:])[-10000:]
message = message.replace('%', '%25').replace('\r', '%0D').replace('\n', '%0A')
print('::error title=Android export diagnostics::' + message)
PY
  exit "$status"
}
trap report_export_failure ERR
# This is a disposable DEBUG identity, not a Play Store signing key.
# A fresh CI run can require uninstalling the previous debug APK before installing.
if [[ ! -f "$WORK/debug.keystore" ]]; then
  "$JAVA_HOME/bin/keytool" -genkeypair -keystore "$WORK/debug.keystore" \
    -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass android -keypass android -dname 'CN=Android Debug,O=IDREM Test,C=CD' >/dev/null 2>&1
fi
export IDREM_DEBUG_KEYSTORE="$WORK/debug.keystore"
export IDREM_EDITOR_CONFIG="$CONFIG/editor_settings-4.5.tres"
python3 - <<'PY'
import json, os
from pathlib import Path
# JSON quoting is also valid for these .tres string values.
settings = {
  'export/android/android_sdk_path': os.environ['ANDROID_HOME'],
  'export/android/java_sdk_path': os.environ['JAVA_HOME'],
  'export/android/debug_keystore': os.environ['IDREM_DEBUG_KEYSTORE'],
  'export/android/debug_keystore_user': 'androiddebugkey',
  'export/android/debug_keystore_pass': 'android',
}
content = '[gd_resource type="EditorSettings" format=3]\n\n[resource]\n'
content += '\n'.join(f'{key} = {json.dumps(value)}' for key, value in settings.items())+'\n'
Path(os.environ['IDREM_EDITOR_CONFIG']).write_text(content)
PY
"$GODOT" --headless --path game --export-debug Android artifacts/idrem-zenkai-training-debug.apk 2>&1 | tee "$WORK/export.log"
APK=game/artifacts/idrem-zenkai-training-debug.apk
test -s "$APK"
if grep -E 'SCRIPT ERROR:|Export failed|ERROR:' "$WORK/export.log"; then
  echo '::error::Android export reported an error.'; exit 1
fi
"$ANDROID_HOME/build-tools/35.0.0/apksigner" verify --verbose "$APK"
"$ANDROID_HOME/build-tools/35.0.0/aapt" dump badging "$APK" > game/artifacts/apk-info.txt
"$ANDROID_HOME/build-tools/35.0.0/aapt" dump permissions "$APK" > game/artifacts/apk-permissions.txt
if grep -Eq 'android.permission.(INTERNET|READ_CONTACTS|ACCESS_FINE_LOCATION|CAMERA|RECORD_AUDIO|READ_EXTERNAL_STORAGE|WRITE_EXTERNAL_STORAGE)' game/artifacts/apk-permissions.txt; then
  echo '::error::Unexpected network or sensitive Android permission.'; exit 1
fi
(cd game/artifacts && sha256sum idrem-zenkai-training-debug.apk > SHA256SUMS.txt)
