# Basketball DB Migration Skill

Use this skill when changing data structures in CloudBase collections for this project.

## Scope

- Add new fields to existing collections
- Introduce optional indexes/derived fields
- Backfill historical data
- Remove/deprecate legacy fields (only with phased rollout)

Collections in scope:

- `teams`
- `team_members`
- `users`

## Migration Principles

1. **Backward Compatible First**
   - Prefer additive schema evolution.
   - New fields should be optional at first.
   - Readers must tolerate missing fields during rollout.

2. **No Breaking Rename in One Step**
   - Avoid direct rename/remove of hot-path fields.
   - Use phased migration: add new field → dual-read/write → backfill → cutover → remove old field later.

3. **Permission-Aware Changes**
   - If security rules use `doc.field` or `get()` dependencies, update query logic and rules together.
   - Ensure query conditions remain subset-compatible with security rules.

4. **Operational Safety**
   - Batch changes in small chunks.
   - Prefer idempotent scripts/processes.
   - Keep a rollback path before execution.

## Recommended Migration Playbook

### Phase 0: Plan

- Define target schema and affected pages/functions.
- List impacted queries and permission expressions.
- Choose rollout strategy:
  - Additive-only (safe path)
  - Dual-read/write (for rename/semantic changes)

### Phase 1: Expand (Non-breaking)

- Add new field support in write paths.
- Update read paths to fallback gracefully:
  - read new field first
  - fallback to old field/default value
- Keep old behavior intact.

### Phase 2: Backfill

- Backfill old documents with deterministic logic.
- Validate sample correctness (small batch first).
- Log counts: scanned / updated / failed.

### Phase 3: Cutover

- Switch reads to new field as primary source.
- Keep temporary fallback for one release cycle.
- Monitor runtime errors and permission-denied events.

### Phase 4: Cleanup

- Remove old field write paths.
- Remove fallback reads after stabilization window.
- Update docs/rules/skills to match final schema.

## Rollback Strategy (Must Prepare)

- If failures spike:
  - revert app code to fallback/old-field reads
  - stop backfill jobs immediately
  - preserve original data for replay
- Avoid destructive delete during first rollout wave.

## Data Quality Checks

- Field presence rate for migrated docs.
- Value constraints (enum/date/string format) remain valid.
- No role enum drift (`captain | vice-captain | member`).
- No orphan references (`team_members.team_id` must map to valid `teams._id`).

## Release Gate for Migration Changes

- Migration plan documented (expand/backfill/cutover/cleanup).
- Queries and permissions verified together.
- Manual verification on key flows completed:
  - team list/detail
  - member management
  - match creation/list
  - profile read/write
- Tests pass (`npm test`, and `npm run test:unit` when applicable).

## Anti-Patterns

- Renaming/removing fields in a single release without fallback.
- Running one-shot destructive updates without sample validation.
- Updating frontend queries but forgetting security rule implications.
- Shipping migration without rollback instructions.

