#!/usr/bin/env bash
set -euo pipefail
# Browser binaries come from Playwright. The runner's unrelated Chrome APT
# index has intermittently failed with Hash Sum mismatch before Mesa installs.
# Keep APT signature/checksum verification and native shader checks enabled.
sudo python3 - <<'PYTHON'
from pathlib import Path
for source in Path('/etc/apt/sources.list.d').iterdir():
    if source.suffix not in ('.list', '.sources'):
        continue
    if '://dl.google.com/linux/chrome' in source.read_text():
        source.rename(source.with_suffix(source.suffix + '.disabled'))
        print('Disabled unused Chrome APT source:', source.name)
PYTHON
if ! python3 -c "import ctypes; ctypes.CDLL('libEGL.so.1'); ctypes.CDLL('libEGL_mesa.so.0')"; then
  sudo apt-get update -qq
  sudo apt-get install -y --no-install-recommends libegl1 libegl-mesa0
fi
python3 -c "import ctypes; ctypes.CDLL('libEGL.so.1'); ctypes.CDLL('libEGL_mesa.so.0')"
