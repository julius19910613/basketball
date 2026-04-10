# Basketball Mini Program Delivery Skill

Use this skill when implementing or refactoring features in this repository.

## Scope

This repository is a WeChat Mini Program for basketball team management, backed by Tencent CloudBase.

- Frontend: `miniprogram/` (`.js`, `.wxml`, `.wxss`)
- Cloud function: `cloudfunctions/getOpenId`
- Core features already implemented:
  - Team creation/list/detail
  - Member management (captain/vice-captain/member)
  - Match list/create
  - Discovery page
  - Profile page

## Architecture Rules (Must Follow)

1. Authentication is WeChat-native; identity is `openid`.
2. Retrieve `openid` via cloud function (`getOpenId`), then use it in DB queries.
3. Prefer direct DB access via `wx.cloud.database()` for normal CRUD.
4. Add new cloud functions only if server-side privilege/third-party integration is required.
5. Keep collection contracts compatible:
   - `teams`: `name`, `region`, `logo`, `color`, `create_by`, `create_time`
   - `team_members`: `team_id`, `openid`, `role`, `number`, `join_time`
   - `users`: `openid`, `nickName`, `avatarUrl`, `create_time`
6. Role enum is fixed: `captain | vice-captain | member`.

## Security-Rule Aware Querying (Best Practice)

When writing `wx.cloud.database()` queries, design them to match CloudBase Security Rules:

1. Query conditions must be a subset of rule conditions.
2. If rules depend on `doc.fieldName`, include that field in `where(...)`.
3. If rules use cross-document `get()` checks, include required reference fields in query filters.
4. Keep permission checks in both places:
   - frontend: for UX gating (hide/disable actions)
   - security rules: for final enforcement

## UI/Theming Rules (Current Product Theme)

Current project theme is Coinbase-style blue system. Reuse global tokens in `miniprogram/app.wxss`:

- `--primary-color: #1652F0`
- `--secondary-color: #3B82F6`
- `--background: #F4F8FF`
- `--text-color: #0F172A`
- `--light-text: #64748B`

UI implementation constraints:

- Prefer light background + white card + blue primary CTA.
- Keep spacing/radius consistent with existing pages.
- Use `rpx` for layout sizes.
- Avoid introducing old orange palette values.

## Implementation Workflow

1. Read the target page/component and adjacent data flow before editing.
2. Confirm whether the change touches:
   - data model
   - role permissions
   - navigation/tab flow
3. Implement smallest safe change first.
4. Handle errors for all cloud/database operations (`try/catch` + user feedback).
5. Keep style changes token-driven (prefer variables over hard-coded colors).
6. Add/update tests for logic changes.

### Suggested Delivery Loop

1. Read page + related collection contract.
2. Draft minimal change (UI + data + permission impact).
3. Implement with token-based styling and error handling.
4. Run focused test first, then project-level test command.
5. Validate no route/field/role regressions.

## Quality Checklist Before Finish

- No invalid role values introduced.
- No incompatible field renames in existing collections.
- No Web-only APIs/framework code added to Mini Program files.
- No theme regression to orange palette.
- Tests run successfully (`npm test`; and `npm run test:unit` when relevant).
- E2E remains stable (no concurrent automator sessions; keep serial execution).

## Common Pitfalls to Avoid

- Using client-generated fake identity instead of `openid`.
- Moving permission checks only to frontend without cloud rule awareness.
- Breaking tab/page route paths in `app.json`.
- Duplicating shared logic across pages instead of extracting reusable code.

## GitHub-Inspired Rule/Skill Hygiene

For maintainability, keep this skill practical and short:

- Put immutable standards in `.cursor/rules`.
- Put task playbooks in `.cursor/skills`.
- Prefer checklists and failure modes over long prose.
- Update this skill whenever a new core page or collection is introduced.

