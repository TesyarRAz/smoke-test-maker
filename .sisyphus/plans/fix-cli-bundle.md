# Fix CLI Bundle Setup

## TL;DR
Fix package.json scripts and bundle setup so `smoke-test-maker` works as CLI.

## Context
- dist/index.js works: `node dist/index.js test/file.hurl`
- dist/cli.js doesn't work (no run() call)
- bin/smoke-test-maker doesn't work

## TODOs
- [x] 1. Update package.json scripts
  - "start": "node dist/index.js"
  - "bundle": esbuild with external deps
  
- [x] 2. Bundle and test
  - npx esbuild src/index.ts --bundle --platform=node --outfile=bin/smoke-test-maker --format=cjs --external:pg --external:mysql2 --external:mongodb --external:puppeteer --external:html-to-image --external:jsdom
  - Test: node bin/smoke-test-maker test/jsonplaceholder_db.hurl

## Done
- [x] Build passes
- [x] CLI runs