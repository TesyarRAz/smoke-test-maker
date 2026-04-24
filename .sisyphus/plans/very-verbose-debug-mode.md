# Add --very-verbose Debug Mode

## TL;DR
> Quick add `--very-verbose` CLI flag untuk print DB connection details saat connecting.

**Deliverables**:
- `--very-verbose` flag tersedia di CLI
- Print full DSN (connection string) saat koneksi ke database

**Estimated Effort**: Quick (~15 menit)
**Parallel Execution**: NO

---

## Context

### Original Request
User minta: "tambahin debug mode dong, pake --very-verbose, itu dia print db connection nya"

Conversations revealed user wants password FULL VISIBLE (not masked).

### Technical Research
- CLI menggunakan `commander` library di `src/index.ts`
- Boolean flag pattern ada di line 34 (`.option('--strict'...)`)
- Connector.connect() dipanggil di `comment-processor.ts:35`
- Tidak ada verbose flag existing - ini feature baru

---

## Work Objectives

### Core Objective
Tambahkan `--very-verbose` flag yang print DB connection string saat connect.

### Must Have
- [x] CLI menerima `--very-verbose` flag tanpa error
- [x] Print: `[DB] Establishing connection to {full_dsn}...` sebelum connect()
- [x] Print: `[DB] Connected to {dbType}` setelah connect berhasil

### Must NOT Have
- [x] Tidak print kalau flag TIDAK digunakan (backward compatible)
- [x] Tidak ubah output format lain

---

## Execution Strategy

One wave only - small changes:
1. Add flag to CLI in `src/index.ts`
2. Add print statements in `comment-processor.ts`
3. Wire the flag through

**Dependency**: Task 1 → Task 2 (flag must exist before passing)

---

## TODOs

- [x] 1. Add --very-verbose CLI option

  **What to do**:
  - Add `veryVerbose?: boolean` ke `CliOptions` interface (around line 22)
  - Add `.option('-d, --very-verbose', 'Print detailed debug information including DB connections', false)` after existing options (around line 40) - NOTE: Changed from -V to -d because -V conflicts with Commander's built-in --version
  - Add `veryVerbose: (opts as any).veryVerbose ?? false` to options object (around line 94)
  
  **Verification**:
  - `npm run build` succeeds
  - `node dist/cli.js --help` shows `--very-verbose` option

- [x] 2. Wire veryVerbose to comment-processor

  **What to do**:
  - Add parameter `veryVerbose?: boolean` to function `processCustomComments` signature in `src/processor/comment-processor.ts:15`
  - Pass `options.veryVerbose` in call at `src/index.ts:134`
  
  **Verification**:
  - Function accepts the parameter

- [x] 3. Print DB connection info

  **What to do**:
  - In `comment-processor.ts`, after `await connector.connect(dsn)` (line 35):
    - Add `if (veryVerbose) { console.log(`[DB] Establishing connection to ${dsn}...`); console.log(`[DB] Connected to ${comment.dbType}`); }`
  
  **Verification**:
  - Run dengan `--very-verbose` → shows DB connection prints
  - Run tanpa `--very-verbose` → no DB prints

---

## Success Criteria

### Manual Test
```bash
# With --very-verbose flag
node dist/cli.js test.hurl --very-verbose

# Expected output includes:
# [DB] Establishing connection to postgres://user:pass@localhost:5432/db...
# [DB] Connected to postgresdb

# Without flag - no DB output
node dist/cli.js test.hurl

# Expected: no [DB] messages
```