#!/bin/sh
set -eu
cd "$(dirname "$0")"
if ! command -v clang >/dev/null 2>&1 && ! command -v cc >/dev/null 2>&1; then
  echo "Install Xcode Command Line Tools first: xcode-select --install" >&2
  exit 1
fi
make clean
make
exec ./campusiq
