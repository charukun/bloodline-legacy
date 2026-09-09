#!/usr/bin/env bash
set -euo pipefail

mode="${1:-}"
case "$mode" in glsl|browser) ;; *) echo 'Usage: prepare-linux-deps.sh glsl|browser' >&2; exit 2 ;; esac

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
if [ "$mode" = glsl ] && python3 -c "import ctypes; ctypes.CDLL('libEGL.so.1'); ctypes.CDLL('libEGL_mesa.so.0')"; then
  exit 0
fi

verify_browser() {
  (
    cd "$root"
    node --input-type=module -e "import {chromium} from './deploy/node_modules/playwright/index.mjs'; const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}); await browser.close();"
  )
}

if [ "$mode" = browser ]; then
  # Preserve develop's fast path: download as the runner user and try the
  # actual browser before refreshing operating-system dependencies.
  "$root/deploy/node_modules/.bin/playwright" install chromium
  if verify_browser; then
    exit 0
  fi
fi

# Hosted Ubuntu has unrelated third-party APT repositories (for example Chrome).
# Use the runner's signed Ubuntu sources for these Ubuntu dependencies only.
# Keep all APT signature/hash verification enabled and leave global sources intact.
sources=/etc/apt/sources.list.d/ubuntu.sources
test -r "$sources" || { echo "Required Ubuntu source configuration missing: $sources" >&2; exit 1; }
config="$(mktemp)"
trap 'rm -f "$config"' EXIT
cat > "$config" <<EOF
Dir::Etc::sourcelist "$sources";
Dir::Etc::sourceparts "-";
EOF

if [ "$mode" = glsl ]; then
  # Reuse the runner's signed package indexes first, as current develop does.
  # A refresh, if needed, stays restricted to the official Ubuntu sources.
  if ! sudo env APT_CONFIG="$config" apt-get install -y --no-install-recommends libegl1 libegl-mesa0; then
    sudo env APT_CONFIG="$config" apt-get update -qq -o Acquire::Retries=3
    sudo env APT_CONFIG="$config" apt-get install -y --no-install-recommends libegl1 libegl-mesa0
  fi
  python3 -c "import ctypes; ctypes.CDLL('libEGL.so.1'); ctypes.CDLL('libEGL_mesa.so.0')"
else
  # Run install-deps as root so its apt subprocess inherits the scoped config.
  sudo env APT_CONFIG="$config" "$(command -v node)" "$root/deploy/node_modules/playwright/cli.js" install-deps chromium
  verify_browser
fi
