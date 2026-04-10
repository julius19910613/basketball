# Basketball Feature Delivery Skill

Use this skill when adding or refactoring product features in this repository.

## Suitable Tasks

- Add new feature pages (or extend existing pages) in `miniprogram/pages/**`
- Add member/team/match-related business logic
- Add or adjust CloudBase data reads/writes
- Add reusable UI components for current product flows

## Delivery Flow (Step-by-Step)

1. **Clarify Scope**
   - Confirm target user action and success criteria.
   - Identify touched pages, collections, and role permissions.

2. **Map Data Contract**
   - Reuse current collection contracts (`teams`, `team_members`, `users`) whenever possible.
   - If new fields are required, prefer additive changes (backward compatible).
   - Never change role enum semantics (`captain | vice-captain | member`).

3. **Design Permission Path**
   - Frontend: hide/disable unauthorized operations for UX.
   - CloudBase Security Rules: enforce final authorization.
   - Ensure DB query conditions are compatible with rule expressions.

4. **Implement UI Consistently**
   - Use Coinbase-style token system in `miniprogram/app.wxss`.
   - Keep visual hierarchy: light background + white card + blue primary CTA.
   - Prefer existing component patterns before creating new ones.

5. **Implement Data Operations Safely**
   - Use `wx.cloud.database()` for straightforward CRUD.
   - Use cloud functions only for privileged or third-party integration flows.
   - Add defensive error handling and user-friendly feedback.

6. **Regression & Tests**
   - Run targeted tests for changed logic first.
   - Run project-level tests before finish (`npm test`; plus `npm run test:unit` when relevant).
   - Keep E2E execution serial to avoid mini-program automator conflicts.

## Feature PR/Change Checklist

- Scope is minimal and focused.
- No route/path break in `app.json`.
- No incompatible collection/field rename.
- No role semantic drift.
- No theme regression to old palette.
- Error states handled for all cloud/database mutations.
- Tests pass and key user path manually verified.

## Anti-Patterns

- Mixing Web framework patterns into Mini Program code.
- Shipping frontend-only permission checks without rule-aware query design.
- Introducing one-off hard-coded colors/styles that bypass global tokens.
- Copy-pasting complex logic across pages without extraction.

