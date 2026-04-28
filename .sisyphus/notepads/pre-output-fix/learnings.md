# Pre-Output Fix - Learnings

## Task 4: Restructure main loop for entry-by-entry processing (GREEN phase)

### What was done
- Restructured `processResults()` in `src/index.ts` to process entries ONE-BY-ONE
- Pre-output DB queries now execute BEFORE HTTP request for each entry
- Post-output DB queries execute AFTER HTTP request for each entry
- Variable timing maintained correctly:
  - Pre-output uses `accumulatedVars` (previous entries only)
  - HTTP request receives `accumulatedVars` via `--variable` flags
  - Post-output uses `{ ...accumulatedVars, ...result.capturedVars }`
  - After each entry: `accumulatedVars = { ...accumulatedVars, ...result.capturedVars }`

### Key implementation details
1. Used `filterCommentsByAction()` to separate pre-output from post-output comments
2. Called `processCustomComments()` TWICE per entry:
   - First call: pre-output comments ONLY (before HTTP request)
   - Second call: post-output/screenshot/output comments (after HTTP request)
3. Used `executeHurlFile()` for SINGLE entry by passing `--from-entry` and `--to-entry` flags
4. Updated `processResults()` signature to not take `results` parameter (now handles execution internally)
5. Updated `run()` function to work with new `processResults(hurlFile, options)` signature

### Files modified
- `src/index.ts`: Restructured `processResults()` function
- `src/cli.ts`: Added `veryVerbose` to `CliOptions` interface and commander options
- `tsconfig.json`: Added `include` and `exclude` to fix build errors with test files
- `test/pre-output-order.test.ts`: Updated tests to use new `processResults()` signature

### Build fixes
- Had to add `include: ["src/**/*"]` and `exclude: ["test/**/*", "vitest.config.ts"]` to tsconfig.json
- Had to add `veryVerbose?: boolean` to `CliOptions` interface in `cli.ts`
- Added `-d, --very-verbose` option to commander in `cli.ts`

### Test results
- `bun test test/pre-output-order.test.ts`: 3/3 tests pass
- `bun test`: 10/10 tests pass
- `npm run build`: Build succeeds

## Task 4: Update screenshot and output generation for new entry-by-entry flow

### What was done
- Verified screenshot generation works with new flow:
  - `getScreenshotActions()` called with combined `databases` array (pre + post-output)
  - `entryData` passed to `generateHtml()` includes both pre-output and post-output results
- Verified output generation works within entry-by-entry loop:
  - `generateOutput()` receives correct `databases` array
  - Output JSON preserves order: pre-output results before post-output results
- Added TDD tests in `test/screenshot-output-generation.test.ts`:
  - Test screenshot generates with DB data from both pre-output and post-output
  - Test `generateHtml` receives entryData with both pre-output and post-output results
  - Test output JSON preserves order (pre-output before post-output)

### Key verification points
1. Screenshot generation: `getScreenshotActions(databases)` called with combined array
2. HTML generation: `generateHtml([entryData])` receives entryData with databases in correct order
3. Output generation: `generateOutput()` receives databases array preserving pre-output → post-output order

### Files modified
- `test/screenshot-output-generation.test.ts`: New test file with 3 tests for screenshot/output generation

### Test results
- `bun test test/screenshot-output-generation.test.ts`: 3/3 tests pass
- `bun test`: 13/13 tests pass
- `npm run build`: Build succeeds
