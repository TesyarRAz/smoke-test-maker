# Filter Response Headers with show-header Comment

## TL;DR

> **Quick Summary**: Add `# show-header:HeaderName` comment untuk filter response headers yang ditampilkan di output (JSON dan HTML)
> 
> **Deliverables**: 
> - Parse `# show-header:Content-Type,Connection` dari hurl file
> - Tampilkan hanya header yang di-request di JSON output
> - Tampilkan hanya header yang di-request di HTML output

> **Estimated Effort**: Short
> **Parallel Execution**: NO - sequential (parser → types → output)
> **Critical Path**: parser → output-generator → html-generator

---

## Context

### User Request
Response headers penuh semua, tapi mau dipilih yang mana yang ditampilkan pake comment. Contoh:
```
# show-header:Content-Type,Connection
```

### Technical Understanding
- Current: Semua response headers ditampilkan penuh
- Need: Parse comment `# show-header:HeaderName` dan filter headers di output

---

## Work Objectives

### Core Objective
User bisa tentukan header mana yang ditampilkan dengan comment `# show-header`

### Definition of Done
- [x] `# show-header:Content-Type` → hanya Content-Type yang muncul
- [x] `# show-header:Content-Type,Connection` → keduanya muncul
- [x] Multiple baris juga works
- [x] Tanpa comment → semua header muncul (backward compatible)

---

## TODOs

- [x] 1. Update hurl-parser.ts - add show-header regex dan parsing

  **What to do**:
  - Add regex untuk parse `# show-header:...`
  - Extract header names ke entry.showHeaders array
  - Tambahkan ke CustomComment atau buat type baru

  **References**:
  - `src/parser/hurl-parser.ts:7-8` - regex patterns
  - `src/types/hurl.ts:53` - CustomComment type

  **Acceptance Criteria**:
  - [x] Regex matches `# show-header:Content-Type`
  - [x] Regex matches `# show-header:Content-Type,Connection`  
  - [x] Multiple lines works

- [x] 2. Update types/hurl.ts - add showHeaders field

  **What to do**:
  - Add `showHeaders?: string[]` ke HurlEntry

  **References**:
  - `src/types/hurl.ts` - HurlEntry interface

  **Acceptance Criteria**:
  - [x] Type updated

- [x] 3. Update output-generator.ts - filter headers

  **What to do**:
  - Filter headers berdasarkan entry.showHeaders jika ada

  **References**:
  - `src/generator/output-generator.ts:32` - headers assignment

  **Acceptance Criteria**:
  - [x] With showHeaders: only listed headers in output
  - [x] Without showHeaders: all headers (backward compatible)

- [x] 4. Update html-generator.ts - filter headers di HTML

  **What to do**:
  - Filter headers sebelum render tabel

  **References**:
  - `src/generator/html-generator.ts:155-158` - headers rendering

  **Acceptance Criteria**:
  - [x] HTML output juga terfilter

- [x] 5. QA verification

  **What to do**:
  - Test dengan dan tanpa show-header comment

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES
- **Manual verification**: Run CLI dengan/without show-header

### QA Scenarios

**Scenario: With show-header comment**
  Tool: Bash
  Preconditions: hurl file dengan `# show-header:Content-Type`
  Steps:
    1. Run: `node dist/index.js test/scenario.hurl`
    2. Check: `test/output/case1.json` - hanya Content-Type di headers
  Expected Result: Only Content-Type header shown

**Scenario: Without show-header (backward compatible)**
  Steps:
    1. Run pada hurl tanpa show-header comment
    2. Check: Semua header ada
  Expected Result: All headers shown