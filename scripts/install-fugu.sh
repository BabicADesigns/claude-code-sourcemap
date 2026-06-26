#!/usr/bin/env bash
#
# Safer installer wrapper for Sakana AI's "Fugu" CLI.
#
# Upstream publishes a classic curl|bash one-liner:
#
#   curl -fsSL https://sakana.ai/fugu/install | bash
#
# Piping straight into bash means executing arbitrary remote code without
# ever seeing it. This script instead downloads the upstream installer to a
# temp file, shows you where it came from, and asks for confirmation before
# running it. Pass -y/--yes to skip the confirmation prompt (e.g. in CI).
set -euo pipefail

FUGU_INSTALL_URL="${FUGU_INSTALL_URL:-https://sakana.ai/fugu/install}"
ASSUME_YES=0

for arg in "$@"; do
  case "$arg" in
    -y|--yes)
      ASSUME_YES=1
      ;;
    -h|--help)
      echo "Usage: $0 [-y|--yes]"
      echo "Downloads the Fugu installer from ${FUGU_INSTALL_URL} for review,"
      echo "then runs it after confirmation (or immediately with -y)."
      exit 0
      ;;
  esac
done

command -v curl >/dev/null 2>&1 || { echo "error: curl is required" >&2; exit 1; }

tmp_script="$(mktemp)"
trap 'rm -f "$tmp_script"' EXIT

echo "Fetching installer from ${FUGU_INSTALL_URL} ..."
curl -fsSL "$FUGU_INSTALL_URL" -o "$tmp_script"

echo
echo "----- begin ${FUGU_INSTALL_URL} -----"
cat "$tmp_script"
echo "----- end ${FUGU_INSTALL_URL} -----"
echo

if [ "$ASSUME_YES" -ne 1 ]; then
  read -r -p "Run the script above with bash? [y/N] " reply
  case "$reply" in
    y|Y|yes|YES) ;;
    *) echo "Aborted, nothing was executed."; exit 1 ;;
  esac
fi

bash "$tmp_script"
