# Test Spec Generator Feature

## TL;DR

> **Quick Summary**: Add feature to generate Markdown test spec file after executing .hurl files - outputs table format (Name, Request, Response) automatically

> **Deliverables**:
> - New --spec CLI flag
> - New test-spec-generator.ts module
> - Auto-generated .md file after execution

> **Estimated Effort**: Short
> **Parallel Execution**: NO - sequential
> **Critical Path**: CLI → Generator → Integration

---

## Context

### Original Request
User wants to generate test case spec documentation from .hurl execution results. The spec file should contain a Markdown table with:
- **Name**: TC-001, TC-002, ...
- **Request**: curl command
- **Response**: JSON response from execution

### Interview Summary
**Key Discussions**:
- User wants auto-generate spec after execution (post-processing)
- Output should have curl command in Request column
- Add new flag --spec to enable this

**Research Findings**:
- Project already has case{N}.json output containing all needed data
- Existing --graphml flag shows exact pattern to follow
- CaseOutput has: name, entryIndex, title, status, response, duration

### Metis Review
**Identified Gaps** (addressed):
- Need to handle large JSON: Add truncation (5KB default)
- Use code fences for JSON in table cells
- Handle skipped entries: Include with SKIPPED status

---

## Work Objectives

### Core Objective
Add --spec flag to generate Markdown test spec file after executing .hurl files

### Concrete Deliverables
- Flag: --spec to enable spec generation
- Module: src/generator/test-spec-generator.ts
- Output: {input}-spec.md in output directory
- Auto-trigger: Generated after execution completes

### Definition of Done
- [x] smoke-test-maker input.hurl --spec → creates spec file
- [x] File contains Markdown table
- [x] Each row has Name, Request (curl), Response (JSON)
- [x] Works with existing flags (--graphml, --output-dir, etc.)

### Must Have
- --spec flag recognized
- Valid Markdown output
- curl format includes method, URL, headers, body

### Must NOT Have
- Don't change existing case{N}.json format
- Don't generate individual spec files per case

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (bun test, existing tests)
- **Automated tests**: Tests after
- **Framework**: bun test

### QA Policy
Agent-executed QA scenarios after implementation.

---

## Execution Strategy

### Tasks

**Single Wave** (sequential):
- [x] Task 1: Add --spec flag to CLI (src/index.ts)
- [x] Task 2: Create test-spec-generator.ts module
- [x] Task 3: Integrate into execution flow
- [x] Task 4: Test and verify

No parallelization needed - small feature.

---

## Final Verification Wave

- [x] F1. **Spec file generated** with --spec flag
- [x] F2. **Format verification** - valid Markdown table
- [x] F3. **Content verification** - curl + JSON present

---

## Success Criteria

### Verification Commands
```bash
smoke-test-maker test.hurl --spec
# Expected: Creates test-spec.md in output/
```