# AGENTS.md

This file provides guidance to all coding agents (Claude Code, Cursor, Gemini CLI, etc.) when working with this repository.

## Project Overview

WeChat Mini Program for basketball team management, built on Tencent CloudBase.

**Tech Stack:**
- Frontend: WeChat Mini Program (native framework, WXML/WXSS/JS)
- Backend: Tencent CloudBase (wx.cloud)
- Database: CloudBase NoSQL Document Database
- Storage: CloudBase Cloud Storage
- Cloud Functions: Node.js
- UI Components: Vant Weapp

## Architecture

### Three-Tier CloudBase Architecture

1. **Frontend (`miniprogram/`)**: Pages using `wx.cloud` SDK
2. **Cloud Functions (`cloudfunctions/`)**: Server-side Node.js functions
3. **CloudBase Services**: Managed backend (database, storage, auth)

### Authentication

- **WeChat native identity + openid** via `getOpenId` cloud function
- Do NOT introduce Web login flows

### Core Collections

- `teams`: `name`, `region`, `logo`, `color`, `create_by`, `create_time`
- `team_members`: `team_id`, `openid`, `role`, `number`, `join_time`
- `users`: `openid`, `nickName`, `avatarUrl`, `create_time`
- `players`: `nickname`, `avatar`, `height`, `weight`, `position`, `birthday`, `skills`, `overall`
- `matches`: match records
- Roles: `captain` / `vice-captain` / `member` — do NOT invent new role values

## Page Structure

### Tab Bar Pages
- `index` — Home
- `players/list` — Player list
- `match/list` — Match history
- `profile` — Personal profile

### Sub-pages
- `players/create` — Create player
- `players/detail` — Player detail
- `match/create` — Create match
- `match/detail` — Match detail

## Architecture & Data Constraints

- Prefer `wx.cloud.database()` direct access for CRUD
- Only use cloud functions for: cross-collection transactions, sensitive writes, third-party APIs, elevated privileges
- Frontend query conditions MUST be compatible with security rules (query is a subset of rule conditions)
- Keep existing paths and field names unless a migration plan is provided

## UI & Style

**Theme: Coinbase Blue**
- Primary: `--primary-color: #1652F0`
- Secondary: `--secondary-color: #3B82F6`
- Background: `--background: #F4F8FF`
- Text: `--text-color: #0F172A`
- Light text: `--light-text: #64748B`

- Style source of truth: `miniprogram/app.wxss`
- New UI: light background + white cards + blue primary buttons
- Units: `rpx` only
- Do NOT fall back to old orange theme (`#FF6B35`)

## Code Conventions

- Promise/async for all async operations with error handling and user feedback
- No sensitive credentials in client code; identity via `openid` + security rules
- Extract reusable logic to `utils/` or components
- Cloud functions via `wx.cloud.callFunction` with explicit `success/fail` or `try/catch`
- No Web stack (React, DOM API, CloudBase Web Auth) in mini program code
- No arbitrary field/collection/role name changes

## Testing

- Jest with custom mock database
- Run: `npm test`
- Add/update at least one test per data read/write change
- E2E runs serially (single worker)

## Key Files

- `miniprogram/app.js` — CloudBase init, global lifecycle
- `miniprogram/app.json` — Page routing, tab bar, window config
- `miniprogram/app.wxss` — Global styles
- `cloudfunctions/getOpenId/index.js` — OpenID retrieval
- `project.config.json` — WeChat project settings (appid: `wxe8d95bf55ebc2ae7`)

## Documentation

- Product spec: `产品功能设计.md`
- Deployment guide: `DEPLOYMENT.md`
- Database schema: `DATABASE_SCHEMA.md`
- WeChat Cloud Dev: https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html
- CloudBase Docs: https://docs.cloudbase.net/
