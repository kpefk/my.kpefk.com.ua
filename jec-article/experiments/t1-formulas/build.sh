#!/usr/bin/env bash
# T1 build step: transpile the two pure source files under test to CommonJS.
#
# The files (src/curriculum/teacher-load/teacher-load.formulas.ts and
# teacher-load.constants.ts) are dependency-free except for *type-only*
# imports from @prisma/client, which are erased at transpile time, so the
# emitted JavaScript is byte-for-byte the production computation logic.
#
# Usage:
#   REPO=/absolute/path/to/backend ./build.sh
# Output: $OUT/teacher-load.formulas.js, $OUT/teacher-load.constants.js
set -euo pipefail

REPO="${REPO:?Set REPO=/absolute/path/to/backend repository}"
OUT="${OUT:-/tmp/t1build}"

mkdir -p "$OUT"
cd "$REPO"
# Passing files on the CLI makes tsc ignore tsconfig.json (intentional:
# we want a plain CJS emit of exactly these two files, nothing else).
npx tsc \
  src/curriculum/teacher-load/teacher-load.formulas.ts \
  src/curriculum/teacher-load/teacher-load.constants.ts \
  --outDir "$OUT" \
  --module commonjs \
  --target es2022 \
  --moduleResolution node \
  --skipLibCheck \
  --esModuleInterop

ls -la "$OUT"
echo "T1 build OK -> $OUT"
