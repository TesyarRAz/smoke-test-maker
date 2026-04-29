# Pre-Output Execution Order Fix

## TL;DR

> **Quick Summary**: Fix smoke-test-maker so `pre-output` DB queries execute BEFORE the HTTP request for each entry, not after.
> 
> **Deliverables**: 
> - Restructured main loop in `src/index.ts` for entry-by-entry processing
> - New `filterCommentsByAction()` helper in `src/processor/comment-processor.ts`
> - Updated variable passing logic for correct timing
> - TDD test suite verifying execution order
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 → Task 3 → Task 5 → Final Verification

---

## Context

### Original Request
User: "nah sekarang benarin dong, si pre-output itu harusnya di eksekusi sebelum hurl di jalanin jir"

Meaning: pre-output DB queries should execute BEFORE the HTTP request, not after.

### Interview Summary
**Key Discussions**:
- Current flow: `executeHurlFile()` runs ALL HTTP requests first (line 182), then `processCustomComments()` handles ALL DB queries (pre-output, post-output, etc.) afterward
- Required flow: For each entry: (1) pre-output DB queries, (2) HTTP request, (3) post-output/screenshot/output DB queries
- Technical approach (user approved): Restructure loop in `index.ts` to process entry-by-entry. Add `filterCommentsByAction()` helper in `comment-processor.ts`. Reuse existing `--from-entry`/`--to-entry` in `hurl-executor.ts`.

**Research Findings**:
- `executeHurlFile()` already supports single-entry execution via `--from-entry`/`--to-entry` flags (hurl-executor.ts line 33)
- `processCustomComments()` processes ALL comments without filtering by action type
- `getScreenshotActions()` etc. already filter by action in RESULTS, but we need to filter COMMENTS before execution
- Two functions named `processCustomComments()` exist: one in `comment-processor.ts`, one in `hurl-parser.ts` (different functions, confusing)

### Metis Review
**Identified Gaps** (addressed in plan):
- **Variable Timing**: Pre-output queries must use `accumulatedVars` (previous entries only), NOT current entry's captured vars
- **Two-Pass DB Processing**: Need to call DB processing twice per entry: once for pre-output (before HTTP), once for post-output (after HTTP)
- **Stop-on-Failure Behavior**: Should stop if pre-output fails? (Decision: Yes, fail fast - matches current behavior)
- **Edge Case - Skip Logic**: Pre-output queries should respect `entry.skip`? (Decision: No - skip only affects output, not execution)
- **Screenshot Action Ambiguity**: `getScreenshotActions()` includes pre-output/post-output in results - this is intentional for screenshot naming

---

## Work Objectives

### Core Objective
Restructure smoke-test-maker entry processing so `pre-output` DB queries execute BEFORE the HTTP request, while `post-output` queries continue to execute AFTER.

### Concrete Deliverables
- `src/processor/comment-processor.ts` - Add `filterCommentsByAction(action: string): CustomComment[]` helper
- `src/index.ts` - Restructure main loop for entry-by-entry processing with correct DB query timing
- `test/pre-output-order.test.ts` (or similar) - TDD test suite verifying execution order

### Definition of Done
- [ ] `bun test` passes with new tests for execution order
- [ ] Manual verification: pre-output queries appear in logs BEFORE HTTP request for each entry
- [ ] Manual verification: post-output queries appear in logs AFTER HTTP request for each entry
- [ ] Existing functionality (variable accumulation, skip logic, screenshot generation) still works

### Must Have
- `pre-output` DB queries execute BEFORE HTTP request for each entry
- `post-output` DB queries execute AFTER HTTP request for each entry
- Variable accumulation works correctly across entries
- `accumulatedVars` passed to pre-output queries (previous entries' captures only)
- Current entry's captured vars available to post-output queries

### Must NOT Have (Guardrails)
- NO modification to `hurl-executor.ts` logic (reuse as-is)
- NO change to `processCustomComments()` function signature (used by `hurl-parser.ts` too)
- NO refactoring of `getScreenshotActions()`, `getPreOutputResults()`, `getPostOutputResults()`
- NO adding new action types or comment syntax
- NO premature optimization (parallelization, retry logic, etc.)

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed. No exceptions.
> Acceptance criteria requiring "user manually tests/confirms" are FORBIDDEN.

### Test Decision
- **Infrastructure exists**: NO - Vitest will be installed in Task 2
- **Automated tests**: TDD (RED → GREEN → REFACTOR)
- **Framework**: Vitest (to be installed in Task 2)
- **If TDD**: Each task follows RED (failing test) → GREEN (minimal impl) → REFACTOR

### QA Policy
Every task MUST include agent-executed QA scenarios (see TODO template below).
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright (playwright skill) - Navigate, interact, assert DOM, screenshot
- **TUI/CLI**: Use interactive_bash (tmux) - Run command, send keystrokes, validate output
- **API/Backend**: Use Bash (curl) - Send requests, assert status + response fields
- **Library/Module**: Use Bash (bun/node REPL) - Import, call functions, compare output

---

## Execution Strategy

### Parallel Execution Waves

> Maximize throughput by grouping independent tasks into parallel waves.
> Each wave completes before the next begins.
> Target: 5-8 tasks per wave. Fewer than 3 per wave (except final) = under-splitting.

```
Wave 1 (Start Immediately - foundation + tests):
├── Task 1: Add filterCommentsByAction() helper [quick]
└── Task 2: Write TDD tests for execution order [unspecified-low]

Wave 2 (After Wave 1 - core implementation):
├── Task 3: Restructure main loop in index.ts [deep]
└── Task 4: Update variable passing logic [deep]

Wave 3 (After Wave 2 - integration + output):
├── Task 5: Update screenshot/output generation [unspecified-high]
└── Task 6: Run full test suite + verify [unspecified-high]

Wave FINAL (After ALL tasks — 4 parallel reviews, then user okay):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay

Critical Path: Task 1 → Task 3 → Task 5 → F1-F4 → user okay
Parallel Speedup: ~50% faster than sequential
Max Concurrent: 2 (Waves 1 & 2)
```

### Dependency Matrix

- **1** (filter helper): - - 3, 2
- **2** (TDD tests): - - 6, 2
- **3** (restructure loop): 1 - 5, 2
- **4** (variable logic): 3 - 5, 2
- **5** (screenshot/output): 3, 4 - 6, 3
- **6** (test suite): 2, 5 - F1-F4, 3

### Agent Dispatch Summary

- **1**: **1** - T1 → `quick`
- **2**: **1** - T2 → `unspecified-low`
- **3**: **1** - T3 → `deep`
- **4**: **1** - T4 → `deep`
- **5**: **1** - T5 → `unspecified-high`
- **6**: **1** - T6 → `unspecified-high`
- **FINAL**: **4** - F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

> Implementation + Test = ONE Task. Never separate.
> EVERY task MUST have: Recommended Agent Profile + Parallelization info + QA Scenarios.
> **A task WITHOUT QA Scenarios is INCOMPLETE. No exceptions.**

- [x] 1. Add `filterCommentsByAction()` helper to comment-processor.ts

  **What to do**:
  - Add new exported function `filterCommentsByAction(comments: CustomComment[], action: string): CustomComment[]`
  - Function filters an array of CustomComment by matching `comment.action === action`
  - Place function after existing helpers (after line 100 in comment-processor.ts)
  - NO changes to existing `processCustomComments()` function signature
  - Write TDD test: `test/filterCommentsByAction.test.ts` (RED first: test expects filter to return only matching actions)

  **Must NOT do**:
  - Do NOT modify `processCustomComments()` function signature (used by hurl-parser.ts too)
  - Do NOT refactor `getScreenshotActions()`, `getPreOutputResults()`, `getPostOutputResults()`
  - Do NOT add new action types

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `quick`
    - Reason: Single function addition, clear logic, minimal file change
  - **Skills**: `[]`
    - No special skills needed for simple function addition
  - **Skills Evaluated but Omitted**:
    - `git-master`: Not needed for new function addition

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Task 3, Task 4 (will use this helper)
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL - Be Exhaustive):

  - `src/processor/comment-processor.ts:86-100` - Existing filter helpers pattern (getPreOutputResults, getPostOutputResults) to follow
  - `src/types/hurl.ts:CustomComment` - Type definition showing `action` field exists

  **Why Each Reference Matters**:
  - `comment-processor.ts:86-100` - Shows the pattern of filtering DatabaseResult[] by action. New function filters CustomComment[] by action (different input type, same concept)
  - `src/types/hurl.ts:CustomComment` - Confirms the `action` field exists on CustomComment type

  **Acceptance Criteria**:

  **If TDD (tests enabled):**
  - [ ] Test file created: `test/filterCommentsByAction.test.ts`
  - [ ] `bun test test/filterCommentsByAction.test.ts` → FAIL (RED phase - test written first)
  - [ ] Implement `filterCommentsByAction()` in comment-processor.ts
  - [ ] `bun test test/filterCommentsByAction.test.ts` → PASS (GREEN phase - 2-3 tests, 0 failures)

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: filterCommentsByAction returns only matching actions
    Tool: Bash (bun test)
    Preconditions: Test file exists with mock CustomComment objects
    Steps:
      1. Create mock comments: [{action: 'pre-output', ...}, {action: 'post-output', ...}, {action: 'pre-output', ...}]
      2. Call filterCommentsByAction(mockComments, 'pre-output')
      3. Assert result length === 2
      4. Assert all results have action === 'pre-output'
    Expected Result: Function returns array with exactly 2 items, both with action 'pre-output'
    Failure Indicators: Returns wrong count, includes non-matching actions
    Evidence: .sisyphus/evidence/task-1-filter-test.txt (bun test output)

  Scenario: filterCommentsByAction returns empty array for no matches
    Tool: Bash (bun test)
    Preconditions: Test file exists with mock data
    Steps:
      1. Create mock comments: [{action: 'post-output'}, {action: 'screenshot'}]
      2. Call filterCommentsByAction(mockComments, 'pre-output')
      3. Assert result.length === 0
    Expected Result: Empty array returned
    Failure Indicators: Returns non-empty array
    Evidence: .sisyphus/evidence/task-1-filter-empty.txt
  ```

  **Evidence to Capture:**
  - [ ] Each evidence file named: task-1-{scenario-slug}.{ext}
  - [ ] Test output for passing tests

  **Commit**: YES
  - Message: `feat(processor): add filterCommentsByAction helper`
  - Files: `src/processor/comment-processor.ts`, `test/filterCommentsByAction.test.ts`
  - Pre-commit: `bun test test/filterCommentsByAction.test.ts`

- [x] 2. Set up Vitest test infrastructure

  **What to do**:
  - Install Vitest: `npm install -D vitest` (or `bun add -D vitest` if using bun)
  - Create `vitest.config.ts` with TypeScript support
  - Add test scripts to package.json: `"test": "vitest run"`, `"test:watch": "vitest"`
  - Create `test/setup.ts` if needed for global test setup
  - Verify: `bun test` or `npx vitest run` executes without errors

  **Must NOT do**:
  - Do NOT modify existing source files (only add test infrastructure)
  - Do NOT add tests for existing code yet (that's Task 3)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Package installation and config file creation
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Task 3 (needs test infra to run tests)
  - **Blocked By**: None

  **References**:
  - `package.json` - Add test scripts here
  - Vitest official docs: https://vitest.dev/guide/

  **Acceptance Criteria**:
  - [ ] `vitest` installed in devDependencies
  - [ ] `vitest.config.ts` created with TypeScript config
  - [ ] `package.json` has `"test": "vitest run"` script
  - [ ] `bun test` or `npx vitest run` executes successfully

  **QA Scenarios**:

  ```
  Scenario: Vitest runs without errors
    Tool: Bash
    Preconditions: vitest installed, config created
    Steps:
      1. Run `npx vitest run` (or `bun test`)
      2. Check exit code === 0
    Expected Result: Command succeeds, shows "PASS" or "no tests found" (not error)
    Failure Indicators: Command fails with module not found, config error
    Evidence: .sisyphus/evidence/task-2-vitest-run.txt
  ```

  **Commit**: YES
  - Message: `chore: add Vitest test infrastructure`
  - Files: `package.json`, `vitest.config.ts`, `test/setup.ts` (if created)
  - Pre-commit: `npx vitest run`

- [x] 3. Write TDD tests for pre-output execution order

  **What to do**:
  - Create `test/pre-output-order.test.ts`
  - RED phase: Write tests that will FAIL initially (current code has wrong order)
  - Tests should verify:
    1. `processCustomComments()` is called with pre-output comments BEFORE `executeHurlFile()`
    2. `processCustomComments()` is called with post-output comments AFTER `executeHurlFile()`
    3. Variable timing: pre-output uses `accumulatedVars` only (not current captures)
  - Use mocks/spies to verify call order (vi.fn(), vi.spyOn)
  - GREEN phase: Tests will pass after Task 4 restructures the loop

  **Must NOT do**:
  - Do NOT implement the actual fix (that's Task 4)
  - Do NOT modify source files yet

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Test writing requires understanding of module interactions
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (needs Task 2 complete)
  - **Parallel Group**: Sequential (after Wave 1)
  - **Blocks**: Task 4 (tests should pass after implementation)
  - **Blocked By**: Task 2 (test infrastructure)

  **References**:
  - `src/index.ts:182-256` - Current (incorrect) loop structure to test against
  - `src/executor/hurl-executor.ts` - Will need to mock `executeHurlFile()`
  - `src/processor/comment-processor.ts` - Will need to spy on `processCustomComments()`

  **Acceptance Criteria**:
  - [ ] Test file `test/pre-output-order.test.ts` created
  - [ ] Tests initially FAIL (RED phase - verifying current wrong behavior)
  - [ ] Tests check call order using mocks/spies
  - [ ] At least 3 test cases for execution order

  **QA Scenarios**:

  ```
  Scenario: Tests fail initially (RED phase verification)
    Tool: Bash
    Preconditions: Test file created with assertions for correct order
    Steps:
      1. Run `npx vitest run test/pre-output-order.test.ts`
      2. Check exit code !== 0 (tests fail because current code has wrong order)
    Expected Result: Tests fail (this is correct for RED phase)
    Failure Indicators: Tests pass (means test is wrong or code already correct)
    Evidence: .sisyphus/evidence/task-3-red-phase.txt
  ```

  **Commit**: YES
  - Message: `test: add TDD tests for pre-output execution order (RED)`
  - Files: `test/pre-output-order.test.ts`
  - Pre-commit: N/A (tests should fail in RED phase)

- [x] 4. Restructure main loop in index.ts for entry-by-entry processing

  **What to do**:
  - Rewrite the loop in `src/index.ts` (lines 182-256) to process entries ONE-BY-ONE:
    1. For each entry: get pre-output comments using `filterCommentsByAction(entry.customComments, 'pre-output')`
    2. Execute pre-output DB queries (if any) using `processCustomComments()` with pre-output only
    3. Execute HTTP request for THIS entry using `executeHurlFile()` with `--from-entry` and `--to-entry` set to this entry's index
    4. Get post-output/screenshot/output comments
    5. Execute post-output DB queries using `processCustomComments()` with remaining actions
    6. Generate outputs for this entry
    7. Accumulate variables and continue
  - Maintain `accumulatedVars` logic:
    - Pre-output queries receive: `accumulatedVars` (previous entries only)
    - HTTP request receives: `accumulatedVars` (passed via `--variable` flags)
    - Post-output queries receive: `{ ...accumulatedVars, ...currentCapturedVars }`
    - After entry: `accumulatedVars = { ...accumulatedVars, ...currentCapturedVars }`
  - TDD: Tests from Task 3 should now PASS (GREEN phase)

  **Must NOT do**:
  - Do NOT modify `executeHurlFile()` in `hurl-executor.ts` (reuse as-is)
  - Do NOT break `shouldSkipOutput()` logic (skip only affects output, not execution)
  - Do NOT change how `getScreenshotActions()` works

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex refactoring of main loop, requires understanding variable flow and async execution order
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (sequential after Task 1, 3)
  - **Blocks**: Task 5, Task 6
  - **Blocked By**: Task 1 (needs filter helper), Task 3 (tests must pass)

  **References**:
  - `src/index.ts:182-256` - Current loop structure to refactor
  - `src/executor/hurl-executor.ts:30-40` - Shows `--from-entry`/`--to-entry` usage
  - `src/processor/comment-processor.ts` - `processCustomComments()` to call twice per entry
  - `src/handler/skip-handler.ts` - `shouldSkipOutput()` logic to preserve

  **Acceptance Criteria**:

  **If TDD (tests enabled):**
  - [ ] Tests from Task 3 now PASS (GREEN phase): `bun test test/pre-output-order.test.ts`
  - [ ] `bun test` passes with all tests
  - [ ] Build succeeds: `npm run build`

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Pre-output executes before HTTP request (happy path)
    Tool: Bash (node with --very-verbose)
    Preconditions: Test file with pre-output comment exists
    Steps:
      1. Create test.hurl:
         ```
         GET https://httpbin.org/get
         # pre-output:postgres:{{DB}}|SELECT 1
         ```
      2. Run: `node dist/index.js test.hurl --very-verbose 2>&1`
      3. Check logs: pre-output DB query executes BEFORE HTTP request
      4. Grep for pattern: "pre-output.*BEFORE\|DB.*query.*before.*HTTP"
    Expected Result: Logs show pre-output executing before HTTP request for the entry
    Failure Indicators: Pre-output appears after HTTP response in logs
    Evidence: .sisyphus/evidence/task-4-pre-before-http.txt (filtered logs)

  Scenario: Post-output executes after HTTP request (happy path)
    Tool: Bash (node with --very-verbose)
    Preconditions: Test file with post-output comment exists
    Steps:
      1. Create test.hurl:
         ```
         GET https://httpbin.org/get
         # post-output:postgres:{{DB}}|SELECT 2
         ```
      2. Run: `node dist/index.js test.hurl --very-verbose 2>&1`
      3. Check logs: post-output DB query executes AFTER HTTP request
    Expected Result: Logs show post-output executing after HTTP response
    Failure Indicators: Post-output appears before HTTP request in logs
    Evidence: .sisyphus/evidence/task-4-post-after-http.txt

  Scenario: Variable timing - pre-output uses previous entries' captures
    Tool: Bash (node)
    Preconditions: Multi-entry test file
    Steps:
      1. Create test.hurl with 2 entries:
         - Entry 1: GET ... (captures `token` via [Captures])
         - Entry 2: GET ... with `# pre-output:...|SELECT * WHERE token = {{token}}`
      2. Run: `node dist/index.js test.hurl`
      3. Verify pre-output in entry 2 can access `token` from entry 1
    Expected Result: Pre-output query executes successfully with captured variable
    Failure Indicators: Variable not found / query fails
    Evidence: .sisyphus/evidence/task-4-var-timing.txt
  ```

  **Evidence to Capture:**
  - [ ] Each evidence file named: task-4-{scenario-slug}.txt
  - [ ] Filtered logs showing execution order

  **Commit**: YES
  - Message: `refactor(index): restructure loop for entry-by-entry processing`
  - Files: `src/index.ts`
  - Pre-commit: `bun test`

- [x] 5. Update screenshot and output generation for new flow

  **What to do**:
  - Update screenshot generation logic (lines 231-240) to work with new entry-by-entry flow
  - Screenshot actions should be determined AFTER post-output queries (since screenshots might need DB data)
  - `getScreenshotActions()` should be called with the combined results of post-output + screenshot actions
  - Ensure `entryData` passed to `generateHtml()` includes both pre-output and post-output results
  - Update output generation (lines 242-255) to work within the entry-by-entry loop
  - TDD: Add tests verifying screenshot/output generation works correctly

  **Must NOT do**:
  - Do NOT change `generateHtml()`, `htmlToPng()` function signatures
  - Do NOT modify output format (JSON structure stays same)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Requires understanding of output generation pipeline and screenshot flow
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (after Task 4)
  - **Blocks**: Task 6
  - **Blocked By**: Task 4 (needs restructured loop)

  **References**:
  - `src/index.ts:231-255` - Current screenshot and output generation logic
  - `src/generator/html-generator.ts` - HTML generation (read for context)
  - `src/generator/output-generator.ts` - Output JSON generation (read for context)

  **Acceptance Criteria**:
  - [ ] Screenshots generate correctly with new flow
  - [ ] Output JSON includes both pre-output and post-output results in correct order
  - [ ] `bun test` passes all tests

  **QA Scenarios**:

  ```
  Scenario: Screenshot generates with DB data from post-output
    Tool: Bash
    Preconditions: Test file with post-output and screenshot
    Steps:
      1. Create test.hurl with post-output query and `# screenshot` comment
      2. Run: `node dist/index.js test.hurl`
      3. Verify screenshot PNG generated in output dir
      4. Verify output JSON includes post-output results
    Expected Result: Screenshot generated, output JSON has correct DB results
    Failure Indicators: No screenshot, missing DB results in output
    Evidence: .sisyphus/evidence/task-5-screenshot-output.txt

  Scenario: Output JSON preserves order (pre-output before post-output)
    Tool: Bash
    Preconditions: Test file with both pre and post-output
    Steps:
      1. Create test.hurl with both pre-output and post-output comments
      2. Run: `node dist/index.js test.hurl`
      3. Read generated caseN.json
      4. Verify databases array: pre-output results have order 1-2, post-output have order 3+
    Expected Result: JSON shows pre-output results before post-output results
    Failure Indicators: Wrong order in databases array
    Evidence: .sisyphus/evidence/task-5-output-order.json (cat caseN.json)
  ```

  **Commit**: YES
  - Message: `fix(index): update screenshot and output generation for new flow`
  - Files: `src/index.ts`
  - Pre-commit: `bun test`

- [x] 6. Run full test suite and verify execution order

  **What to do**:
  - Run `bun test` to ensure ALL tests pass (including new TDD tests)
  - Run manual verification with `test/scenario.hurl`:
    - Check pre-output queries execute before HTTP request
    - Check post-output queries execute after HTTP request
    - Verify variable accumulation works across entries
  - Test edge cases:
    - Entry with ONLY pre-output (no post-output)
    - Entry with ONLY post-output (no pre-output)
    - Entry with skip marker (should still execute DB queries, but skip output)
  - Commit all changes with proper commit messages

  **Must NOT do**:
  - Do NOT add new features
  - Do NOT refactor unrelated code

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Integration testing and verification across multiple components
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (with Task 5)
  - **Blocks**: Final Verification Wave
  - **Blocked By**: Task 5

  **References**:
  - `test/scenario.hurl` - Test file with multiple entries and DB comments
  - `test/scenario.hurl` - Has `# skip`, `# title:`, `# pre-output`, `# post-output` examples

  **Acceptance Criteria**:
  - [ ] `bun test` passes: All tests pass (0 failures)
  - [ ] `npm run build` succeeds
  - [ ] Manual test with `test/scenario.hurl` shows correct execution order
  - [ ] Edge cases tested and working

  **QA Scenarios**:

  ```
  Scenario: Full integration test with scenario.hurl
    Tool: Bash
    Preconditions: scenario.hurl exists with pre/post-output comments
    Steps:
      1. Run: `node dist/index.js test/scenario.hurl --very-verbose 2>&1 | tee /tmp/smoke-test.log`
      2. Grep log for "pre-output" and "HTTP" - verify order
      3. Grep log for "post-output" and "HTTP" - verify order
      4. Check output files generated (case1.json, case3.json)
    Expected Result: Correct order in logs, output files present
    Failure Indicators: Wrong order, missing output files
    Evidence: .sisyphus/evidence/task-6-integration.txt (/tmp/smoke-test.log)

  Scenario: Edge case - skip entry still executes DB queries
    Tool: Bash
    Preconditions: scenario.hurl has `# skip` entry with pre-output
    Steps:
      1. Entry with `# skip` and `# pre-output:...` comment
      2. Run: `node dist/index.js test/scenario.hurl`
      3. Verify pre-output query executed (check logs/databases in output)
      4. Verify NO output file generated for skipped entry (shouldSkipOutput)
    Expected Result: DB query executed, but no output JSON for skipped entry
    Failure Indicators: DB query not executed, or output file wrongly generated
    Evidence: .sisyphus/evidence/task-6-skip-edge.txt
  ```

  **Commit**: YES
  - Message: `test: run full suite and verify execution order`
  - Files: All modified files from Tasks 1-5
  - Pre-commit: `bun test`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
>
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit` + linter + `bun test`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp).
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill if UI)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (features working together, not isolation). Test edge cases: empty state, invalid input, rapid actions. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **1**: `feat(processor): add filterCommentsByAction helper` - comment-processor.ts, bun test
- **2**: `test: add TDD tests for pre-output order` - test files, bun test
- **3**: `refactor(index): restructure loop for entry-by-entry processing` - index.ts, bun test
- **4**: `fix(index): update variable passing for pre/post-output timing` - index.ts, bun test
- **5**: `fix(index): update screenshot and output generation` - index.ts, bun test
- **6**: `test: run full suite and verify execution order` - test files, bun test

---

## Success Criteria

### Verification Commands
```bash
bun test  # Expected: All tests pass including new execution order tests
node dist/index.js test/scenario.hurl --very-verbose 2>&1 | grep -q "pre-output.*BEFORE"
# Expected: Logs show pre-output executing before HTTP request
node dist/index.js test/scenario.hurl --very-verbose 2>&1 | grep -q "post-output.*AFTER"
# Expected: Logs show post-output executing after HTTP request
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass
- [ ] Pre-output executes before HTTP request
- [ ] Post-output executes after HTTP request
- [ ] Variable accumulation works correctly
