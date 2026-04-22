# Fix Output Location to Match Hurl File Directory

## TL;DR

> **Quick Summary**: Output files harus berada di folder yang sama dengan file .hurl (dalam subfolder `output/`), bukan di root `./output`
> 
> **Deliverables**: 
> - CLI default outputDir berubah ke lokasi folder hurl
> - Fallback ke current working directory jika input invalid
> 
> **Estimated Effort**: Short
> **Parallel Execution**: NO - sequential (2 files, related)
> **Critical Path**: cli.ts → index.ts

---

## Context

### Original Request
User ingin output berada di lokasi yang sama dengan file hurl, bukan di root. Misal: jika hurl di `test/jsonplaceholder_get.hurl`, output harus ke `test/output/`

### Technical Understanding
- `src/cli.ts:70` - default outputDir = `./output`
- `src/index.ts:76` - juga menggunakan `./output` sebagai fallback
- Perlu ubah logic agar derive dari `dirname(inputFile)`

---

## Work Objectives

### Core Objective
Default output location harus sama dengan folder file hurl, bukan root

### Definition of Done
- [ ] Jalankan `smoke-test-maker test/scenario.hurl` → output ada di `test/output/`
- [ ] Jalankan dengan `--output-dir custom/path` → tetap gunakan custom path (tidak overridden)

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (bun test)
- **Automated tests**: None - simple change
- **Agent-Executed QA**: Manual verification via CLI

### QA Scenarios

**Scenario: Default output to hurl directory**
  Tool: Bash
  Preconditions: Clean state, no output folders
  Steps:
    1. Run: `bun run src/cli.ts test/scenario.hurl`
    2. Check: `ls test/output/` exists
  Expected Result: Output files created in test/output/
  Evidence: ls test/output/

**Scenario: Custom output-dir flag still works**
  Tool: Bash
  Steps:
    1. Run: `bun run src/cli.ts test/scenario.hurl -o /tmp/custom-output`
    2. Check: `ls /tmp/custom-output/`
  Expected Result: Output files in /tmp/custom-output/
  Evidence: ls /tmp/custom-output/

---

## TODOs

- [x] 1. Modify cli.ts to derive default outputDir from inputFile

  **What to do**:
  - Import `dirname` dan `join` dari `path`
  - Ubah default outputDir dari `./output` menjadi `${dirname(inputFile)}/output`
  - Pastikan path di-resolve dengan benar

  **References**:
  - `src/cli.ts:70` - Lokasi yang perlu diubah

  **Acceptance Criteria**:
  - [x] Code updated di cli.ts

- [x] 2. Update index.ts for consistency

  **What to do**:
  - Check if index.ts needs adjustment
  - Root cause: `--output-dir` option had hardcoded default `'./output'`

  **References**:
  - `src/index.ts:32` - Fixed hardcoded default
  - `src/index.ts:73,77` - Derives default from `dirname(inputFile)`

  **Acceptance Criteria**:
  - [x] Verify index.ts uses cli outputDir correctly

  **Fixed**: Removed hardcoded default `'./output'` from `--output-dir` option.
  QA verified: outputs go to `test/output/` for `test/scenario.hurl`, and `-o custom/path` still works.

---

## Commit Strategy

- **1**: `fix(output): default output to hurl file directory`
  - Files: src/cli.ts
  - Pre-commit: none

---

## Success Criteria

### Verification Commands
```bash
# Test 1: Default output location
rm -rf test/output && bun run src/cli.ts test/scenario.hurl
ls test/output/  # Should contain output files

# Test 2: Custom --output-dir still works
rm -rf /tmp/custom-out && bun run src/cli.ts test/scenario.hurl -o /tmp/custom-out
ls /tmp/custom-out/  # Should contain output files
```
