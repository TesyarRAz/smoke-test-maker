# HTML Generator Improvements - Display Modes & Configurable Width

## TL;DR

> **Quick Summary**: Improve HTML generator with: (1) scrollable table for multi-row, form layout for single-row, (2) display modes (vertical/horizontal/grid), (3) configurable width
> 
> **Deliverables**: Updated CLI options + HTML generator with new display logic
> - [ ] Add CLI: --display-mode and --display-width
> - [ ] Update HTML generator with display logic
> - [ ] Build passes
> 
> **Estimated Effort**: Short (1-2 hours)
> **Critical Path**: Add CLI → Update Generator → Build test

---

## Context

### Current Behavior
- All DB results rendered as table
- No scroll support for large datasets
- No display mode options
- Fixed width container

### User Requirements
- **Multiple rows**: scrollable table
- **Single row**: form layout (vertical - label above value)
- **Display modes**: Vertical, Horizontal, Grid
- **Width**: configurable via CLI (default 1400px)
- **CLI format**: --display-mode vertical | horizontal | grid, --display-width NNNN
- **Scope**: Global only (same for all queries)

---

## Work Objectives

### Core Objective
Add CLI options to control HTML display and implement display mode logic in generator.

### Concrete Deliverables
- New CLI options: --display-mode, --display-width
- Updated html-generator with:
  - Single vs multi-row detection
  - Form layout for single row
  - Scrollable table for multi-row
  - Display mode CSS
  - Configurable container width

### Definition of Done
- [ ] CLI accepts --display-mode and --display-width
- [ ] Build passes
- [ ] Single row shows as form (vertical layout)
- [ ] Multi-row shows as scrollable table
- [ ] Container width matches --display-width

### Must Have
- Single row → form (vertical, label above value)
- Multi-row → scrollable table
- CLI options work

### Must NOT Have (Guardrails)
- No per-query display override (global only)
- No change to PNG generation

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: NO
- **Manual test**: Build check + code review
- **Verification**: Build passes, logic reviewed

---

## Execution Strategy

### Sequential
```
Task 1: Add CLI options (--display-mode, --display-width)
└── Task 2: Update HTML generator with display logic
    └── Task 3: Build + verify
```

---

## TODOs

- [x] 1. Add CLI options --display-mode and --display-width

  **What to do**:
  - In `src/index.ts`, add CLI options:
    - `--display-mode <vertical|horizontal|grid>` (default: vertical)
    - `--display-width <number>` (default: 1400)
  - Pass these options to HTML generator

  **Acceptance Criteria**:
  - [ ] CLI accepts --display-mode vertical
  - [ ] CLI accepts --display-width 1200
  - [ ] Options passed to generator

- [x] 2. Update HTML generator with display logic

- [x] 3. Build + verify

  **What to do**:
  - Run build
  - Verify no TS errors

  **Acceptance Criteria**:
  - [ ] Build passes

---

## Success Criteria

### Verification Commands
```bash
bun run build  # Should exit 0
```

### Final Checklist
- [ ] --display-mode CLI option works
- [ ] --display-width CLI option works
- [ ] Single row shows form layout
- [ ] Multi-row shows scrollable table
- [ ] Width matches CLI option