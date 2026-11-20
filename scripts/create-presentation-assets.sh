#!/bin/sh
set -eu

project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
source_root="$project_root/evidence/screenshots"
output_root="$project_root/presentation-assets"

mkdir -p "$output_root"

sips -c 1250 1280 --cropOffset 80 0 \
  "$source_root/desktop/setup.png" \
  -o "$output_root/setup-overview.png" >/dev/null

sips -c 1500 1280 --cropOffset 2000 0 \
  "$source_root/desktop/broken-review.png" \
  -o "$output_root/broken-findings.png" >/dev/null

sips -c 1000 1280 --cropOffset 2000 0 \
  "$source_root/desktop/fixed-review.png" \
  -o "$output_root/fixed-result.png" >/dev/null

sips -c 1400 360 --cropOffset 3000 0 \
  "$source_root/mobile/fixed-review-360x800.png" \
  -o "$output_root/mobile-result.png" >/dev/null

sips -c 3000 360 --cropOffset 4200 0 \
  "$source_root/mobile/fixed-review-360x800.png" \
  -o "$output_root/mobile-depth.png" >/dev/null

sips -c 800 1280 --cropOffset 0 0 \
  "$source_root/desktop/keyboard-focus.png" \
  -o "$output_root/keyboard-approval-focus.png" >/dev/null

sips -c 1650 1280 --cropOffset 520 0 \
  "$source_root/desktop/keyboard-rerun-focus.png" \
  -o "$output_root/keyboard-rerun-focus.png" >/dev/null

sips -c 800 1280 --cropOffset 0 0 \
  "$source_root/failure-states/inconclusive.png" \
  -o "$output_root/inconclusive-recovery.png" >/dev/null

sips -c 160 1280 --cropOffset 760 0 \
  "$source_root/desktop/setup.png" \
  -o "$output_root/social-synthetic-disclosure.png" >/dev/null

sips -c 480 1280 --cropOffset 2000 0 \
  "$source_root/desktop/fixed-review.png" \
  -o "$output_root/social-fixed-result.png" >/dev/null

swift_cache="/private/tmp/statechorus-swift-module-cache"
mkdir -p "$swift_cache"
CLANG_MODULE_CACHE_PATH="$swift_cache" SWIFT_MODULE_CACHE_PATH="$swift_cache" \
swift "$project_root/scripts/create-social-preview.swift" \
  "$output_root/social-synthetic-disclosure.png" \
  "$output_root/social-fixed-result.png" \
  "$output_root/social-preview.png"

printf 'Created StateChorus presentation assets in %s\n' "$output_root"
