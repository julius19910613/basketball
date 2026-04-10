# Basketball Release Check Skill

Use this skill right before merging, deploying, or submitting a release build.

## Goal

Prevent release regressions across:

- Core basketball workflows (team/member/match/profile)
- CloudBase permission/data safety
- Theme consistency (Coinbase blue system)
- Test and runtime stability

## Pre-Release Checklist

### 1) Product Flow Sanity

- Home (`index`) loads user + stats without runtime errors.
- Team list (`teams`) can open details and create team entry path works.
- Team detail (`team-detail`) and member management permissions behave correctly.
- Match list/create basic path works.
- Profile page loads and saves expected fields.

### 2) Data & Permission Safety

- Queries comply with Security Rules subset requirements.
- `openid`-related logic uses platform identity path (not client-faked IDs).
- No destructive schema changes without migration plan.
- Role values remain `captain | vice-captain | member`.

### 3) UI/Theme Consistency

- Pages use global blue token system from `miniprogram/app.wxss`.
- No reintroduction of legacy orange palette.
- Cards, buttons, and text contrast are visually consistent.
- New pages/components use `rpx` sizing conventions.

### 4) Test Execution

- Run `npm test` (project default e2e health path).
- If logic-heavy changes exist, run `npm run test:unit`.
- Keep automator/E2E tests serial (`runInBand` or equivalent single worker).

### 5) Cloud Function & Config Safety

- If `cloudfunctions/**` changed, verify function entry and dependencies are valid.
- Avoid accidental edits to sensitive config values (e.g., `project.config.json` appid).
- Ensure environment-dependent values are not hard-coded incorrectly.

## Release Decision Rules

- **Block release** if any permission or identity path is uncertain.
- **Block release** if tests fail or critical page path is broken.
- **Block release** if data contract changes are not documented.
- **Allow release** only when all checklist categories pass.

## Optional Evidence to Record

- Commands run and their pass/fail result.
- Screenshots (or manual notes) for key page flows.
- List of touched collections/fields and why.
- Known residual risk with mitigation plan.

