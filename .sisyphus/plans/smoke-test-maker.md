# Smoke Test Maker - Work Plan

## TL;DR

> **Quick Summary**: CLI tool to generate smoke tests from .hurl files with DB query integration. Each entry in hurl file is executed, with optional custom comments for database queries. Skip-marked entries execute but don't generate JSON output.
> 
> **Deliverables**:
> - `smoke-test-maker` CLI executable
> - Parse .hurl files with custom `# output:` and `# screenshot:` comments
> - Execute HTTP requests via hurl CLI
> - Execute DB queries (PostgreSQL, MySQL, MongoDB) using resolved variables
> - Generate JSON output per case with HTTP + DB results
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Project setup → Parser → Hurl Executor → DB Integration → Output Generator

---

## Context

### Original Request
User wants to build a smoke test generator that:
1. Reads `.hurl` files (HTTP test scenarios) + `.env` files
2. Executes each entry in the hurl file
3. Marks entries with `# skip` - still executes but NO JSON output
4. Supports custom comments for DB queries: `output:postgresdb:{dsn}|select...` or `screenshot:postgresdb:{dsn}|select...`
5. Variables use hurl's `{{var}}` syntax, escaped with `\{`
6. Output: case1.json, case1_screenshot_postgres.json

### Interview Summary
**Key Discussions**:
- Tech Stack: Node.js/TypeScript CLI
- DB Support: PostgreSQL + MySQL + MongoDB
- Skip mechanism: `# skip` = execute but no output (HTTP + DB query still run)
- Comment location: Before entry (line above GET/POST)
- Separator: `|` pipe
- DSN source: From hurl variables (`{db_dsn}` resolved from captures or --variable)
- Skip + DB query: Execute both HTTP and DB, no output JSON
- Output schema: Include DB results merged in same JSON
- Error handling: Stop on first failure

### Metis Review
**Identified Gaps** (addressed):
- DSN security: Variables from hurl scope, not hardcoded credentials
- Skip behavior: Confirmed - execute all (HTTP + DB), no output
- Error handling: Stop on first failure

---

## Work Objectives

### Core Objective
Build a CLI tool that transforms .hurl files into smoke tests with integrated database verification. Each entry can have optional DB query annotations that execute and merge results into the output JSON.

### Concrete Deliverables
- CLI entry point: `smoke-test-maker <input.hurl> [--env .env] [--output-dir ./output]`
- Parser module for hurl files with custom comment extraction
- Hurl execution integration (via hurl CLI spawn)
- Database connectors: pg (PostgreSQL), mysql2, mongodb
- Output generator: JSON files per case

### Definition of Done
- [ ] CLI can parse a .hurl file and identify all entries
- [ ] CLI executes each entry via hurl CLI and captures response
- [ ] Custom comments (`# output:`, `# screenshot:`) are parsed correctly
- [ ] DB queries execute using resolved variables from hurl scope
- [ ] `# skip` marked entries execute but don't produce JSON output
- [ ] Variables are substituted correctly, `\{` escapes literal `{`
- [ ] Output JSON contains HTTP response + DB results
- [ ] Tool stops on first failure (configurable)

### Must Have
- Parse .hurl format (use hurlfmt or manual parsing)
- Support PostgreSQL, MySQL, MongoDB connections
- Variable interpolation from hurl captures/variables
- Escape sequence handling for literal variables
- Stop-on-failure error handling

### Must NOT Have (Guardrails)
- No parallel execution (sequential only)
- No test framework integration (standalone CLI)
- No HTML/XML reports (JSON only)
- No real credentials in output (sanitize DSN)

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed. No exceptions.
> Acceptance criteria requiring "user manually tests/confirms" are FORBIDDEN.

### Test Decision
- **Infrastructure exists**: NO (new project)
- **Automated tests**: None required for this project
- **Framework**: N/A
- **Agent-Executed QA**: The executing agent will run the CLI tool and verify outputs directly

### QA Policy
Every task includes agent-executed QA scenarios using Bash:
- Run CLI with sample .hurl file
- Verify JSON output files are created
- Verify skip entries produce no output
- Verify DB query outputs are correct

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation - setup + parser):
├── Task 1: Project setup (package.json, tsconfig, dependencies)
├── Task 2: Type definitions (hurl types, DB types, output types)
├── Task 3: CLI entry point + argument parsing
├── Task 4: Hurl file parser (extract entries, comments, variables)
└── Task 5: Variable resolver (hurl var interpolation, escape handling)

Wave 2 (Core execution + output):
├── Task 6: Hurl executor (spawn hurl CLI, capture output)
├── Task 7: DB connectors (PostgreSQL, MySQL, MongoDB)
├── Task 8: Custom comment processor (parse output:/screenshot: syntax)
├── Task 9: Skip logic handler (execute but no output)
├── Task 10: Output generator (JSON file creation)
└── Task 11: Integration test (end-to-end scenario)
```

---

## TODOs

- [x] 1. Project Setup - Initialize TypeScript project with dependencies

  **What to do**:
  - Create `package.json` with name "smoke-test-maker"
  - Set up TypeScript config (`tsconfig.json`)
  - Install dependencies:
    - `commander` - CLI argument parsing
    - `dotenv` - .env file loading
    - `pg` - PostgreSQL connector
    - `mysql2` - MySQL connector
    - `mongodb` - MongoDB connector
    - `hurl` - (note: hurl CLI assumed installed on system)
  - Create basic project structure (`src/`, `dist/`, `test/`)

  **Must NOT do**:
  - Don't add testing frameworks yet (not in scope)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple project scaffolding with known dependencies
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - N/A - straightforward setup

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2-5)
  - **Blocks**: Task 6-11
  - **Blocked By**: None

  **References**:
  - Official docs: `https://nodejs.org/api/` - Node.js built-in modules
  - `commander` docs: `https://www.npmjs.com/package/commander` - CLI parsing

  **Acceptance Criteria**:
  - [ ] npm install succeeds
  - [ ] npx tsc --noEmit passes
  - [ ] node -e "require('./dist')" imports without error

  **QA Scenarios**:
  ```
  Scenario: Project setup verification
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run npm install
      2. Run npx tsc --noEmit
      3. Run node -e "console.log('ok')"
    Expected Result: All commands succeed with no errors
    Evidence: .sisyphus/evidence/task-1-setup.{ext}
  ```

  **Commit**: YES
  - Message: `feat: initial project setup`
  - Files: `package.json`, `tsconfig.json`, `src/index.ts`

---

- [x] 2. Type Definitions - Define TypeScript types for hurl, DB, output

- [x] 3. CLI Entry Point - Create CLI with argument parsing

- [x] 4. Hurl Parser - Parse .hurl files, extract entries and custom comments

- [x] 5. Variable Resolver - Handle hurl variable interpolation and escape sequences

- [x] 6. Hurl Executor - Execute hurl entries and capture results

- [x] 7. Database Connectors - Implement PG, MySQL, MongoDB connection and query execution

- [x] 8. Custom Comment Processor - Process output:/screenshot: comments with DB queries

- [x] 9. Skip Logic Handler - Execute skipped entries but suppress output

- [x] 10. Output Generator - Create JSON output files per case

  **What to do**:
  - Create `src/generator/output-generator.ts`
  - Create output directory if not exists
  - For each non-skipped entry:
    - Generate filename: case{index}.json OR case{index}_{action}_{db}.json
    - Write JSON with structure:
      ```json
      {
        "name": "case1",
        "entryIndex": 1,
        "status": "pass|fail",
        "response": { /* HTTP response */ },
        "duration": 123,
        "databases": {
          "postgresdb": { /* query result */ },
          "mysql": { /* query result */ }
        }
      }
      ```
  - For screenshot actions, add "_screenshot" to filename

  **Must NOT do**:
  - Don't include sensitive data (strip credentials from DSN)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: File writing with JSON serialization
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - N/A

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (with Tasks 6-9, 11)
  - **Blocks**: Task 11
  - **Blocked By**: Task 8, 9

  **References**:
  - JSON schema: See Task 2 types

  **Acceptance Criteria**:
  - [ ] JSON file created for each non-skipped entry
  - [ ] Filename matches pattern: caseN.json or caseN_action_db.json
  - [ ] JSON contains HTTP response + DB results
  - [ ] Output directory created if not exists

  **QA Scenarios**:
  ```
  Scenario: Generate output JSON
    Tool: Bash
    Preconditions: Build complete
    Steps:
      1. Run CLI with test hurl
      2. Check output/case1.json exists
      3. Verify JSON structure
    Expected Result: Valid JSON with response + databases fields
    Evidence: .sisyphus/evidence/task-10-output.{ext}
  ```

  **Commit**: NO (grouped with Task 1)

---

- [x] 11. Integration Test - End-to-end test of the complete flow

  **What to do**:
  - Create `test/scenario.hurl` - sample hurl file with:
    - Entry 1: Simple GET request (normal)
    - Entry 2: GET with # skip marker
    - Entry 3: GET with custom DB query comment
  - Create `test/.env` - sample environment file
  - Run CLI end-to-end
  - Verify all expected outputs

  **Must NOT do**:
  - Don't modify core logic

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Integration verification
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - N/A

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (final task)
  - **Blocks**: F1-F2
  - **Blocked By**: Task 1-10

  **References**:
  - Sample files: test/scenario.hurl, test/.env

  **Acceptance Criteria**:
  - [ ] CLI runs without error
  - [ ] case1.json created (normal entry)
  - [ ] No case2.json (skipped entry)
  - [ ] case3.json or case3_output_postgresdb.json created (DB query)

  **QA Scenarios**:
  ```
  Scenario: Full integration test
    Tool: Bash
    Preconditions: Build complete
    Steps:
      1. Run: node dist/cli.js test/scenario.hurl --env test/.env --output-dir output/
      2. ls output/
      3. cat output/case1.json
    Expected Result: Files created, valid JSON
    Evidence: .sisyphus/evidence/task-11-integration.{ext}
  ```

  **Commit**: YES
  - Message: `test: add integration test`
  - Files: `test/scenario.hurl`, `test/.env`

---

## Final Verification Wave

> 2 review agents run in PARALLEL. ALL must APPROVE.

- [x] F1. **Integration Test** — Run CLI with sample .hurl, verify all outputs
  Read the plan end-to-end. Verify implementation exists by running the CLI with sample test files.
  Output: `Integration [PASS] | Files [2 created] | VERDICT`

- [x] F2. **Code Quality Review** — TypeScript compile, no lint errors
  Run tsc --noEmit and check for errors. Review code for proper error handling.
  Output: `Build [PASS] | Errors [0] | VERDICT`

---

## Commit Strategy

- **1**: `feat: initial project setup` - package.json, tsconfig
- **2**: `feat: add hurl parser and types`
- **3**: `feat: add CLI entry point`
- **4**: `feat: add variable resolver`
- **5**: `feat: add hurl executor`
- **6**: `feat: add DB connectors`
- **7**: `feat: add custom comment processor`
- **8**: `feat: add skip logic and output generator`
- **9**: `test: add integration test`
- **10**: `chore: final polish`

---

## Success Criteria

### Verification Commands
```bash
npm run build
node dist/cli.js test/scenario.hurl --env test/.env --output-dir output/
ls output/  # Should have case*.json files
cat output/case1.json  # Should have HTTP response + DB results
```
