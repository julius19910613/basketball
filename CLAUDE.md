# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a WeChat Mini Program for basketball team management built on Tencent CloudBase. It enables amateur basketball enthusiasts to create teams, manage members, and organize matches.

**Tech Stack:**
- Frontend: WeChat Mini Program (native framework)
- Backend: Tencent CloudBase (wx.cloud)
- Database: CloudBase NoSQL Document Database
- Storage: CloudBase Cloud Storage
- Cloud Functions: Node.js

## Architecture

### Three-Tier CloudBase Architecture

This project follows the standard WeChat Mini Program + CloudBase pattern:

1. **Frontend (miniprogram/)**: WeChat Mini Program pages that use `wx.cloud` SDK to interact with CloudBase services
2. **Cloud Functions (cloudfunctions/)**: Server-side Node.js functions that execute with elevated privileges
3. **CloudBase Services**: Managed backend services (database, storage, authentication)

**Key Architectural Principle**: Authentication is handled natively through WeChat's openid system. The `getOpenId` cloud function retrieves the user's openid, which is then used for all subsequent database operations and access control.

### Database Schema

The application uses three main NoSQL collections with document-based storage:

**teams** - Ball team records
- Stores: team name, region, logo URL, jersey color (hex), creator openid
- Access: Read by all, write only by creator (`create_by` field)

**team_members** - Team membership relationships
- Stores: team_id reference, user openid, role (captain/vice-captain/member), jersey number, join time
- Access: Readable by member themselves or team captain; writable by same

**users** - User profile data
- Stores: openid, nickname, avatar URL, creation time
- Access: Read and write only by the user themselves

### Page Flow & User Journey

**Entry Points:**
- `index` (Home) → User info + quick actions (create team, discover teams, stats)
- `teams` (My Teams) → List of teams user has joined
- `create-team` → Team creation form
- `team-detail` → Team info + member list (captains see "Manage" button)
- `member-manage` → Captain-only: set vice-captains, remove members, invite

**Navigation Pattern**: Tab bar navigation is configured in `miniprogram/app.json` with icons stored in `miniprogram/images/tabbar/`.

## Development Workflow

### Local Development with WeChat DevTools

1. **Open Project in WeChat Developer Tools**
   ```bash
   # Windows
   "C:\Program Files (x86)\Tencent\微信web开发者工具\cli.bat" open --project "/Users/pptdexiaodiannao/projects/basketball"

   # macOS
   /Applications/wechatwebdevtools.app/Contents/MacOS/cli open --project "/Users/pptdexiaodiannao/projects/basketball"
   ```

2. **Configure CloudBase Environment**
   - Ensure `miniprogram/app.js` has correct `env` ID:
     ```javascript
     wx.cloud.init({
       env: 'your-env-id',  // Replace with actual CloudBase env ID
       traceUser: true,
     });
     ```

3. **Deploy Cloud Function**
   - In WeChat DevTools, right-click `cloudfunctions/getOpenId`
   - Select "Upload and Deploy: Cloud Installation"
   - Wait for deployment to complete

### Database Setup

**Create Collections** in CloudBase Console:
1. Navigate to CloudBase Console → Database
2. Create three collections: `teams`, `team_members`, `users`
3. Configure security rules for each collection (see DEPLOYMENT.md for exact rules)

**Security Rule Pattern**: This project uses CloudBase's declarative security rules where:
- `auth.openid` represents the current authenticated user
- `doc.fieldName` accesses document fields
- `get('database.collection.id.field')` performs cross-collection lookups

### Understanding CloudBase Integration

**Authentication Flow:**
1. User opens mini program → WeChat automatically provides authentication
2. Call `wx.cloud.callFunction({ name: 'getOpenId' })` to retrieve user's openid
3. Use openid as user identifier in all database operations
4. CloudBase security rules validate operations against `auth.openid`

**Database Operations:**
- Frontend uses `wx.cloud.database()` SDK directly - no custom backend needed for CRUD
- Example: `db.collection('teams').where({ create_by: openid }).get()`
- Security rules on collections enforce access control

**Cloud Storage:**
- Upload files: `wx.cloud.uploadFile()`
- Get temp URLs: `wx.cloud.getTempFileURL()`
- Used for team logos in this project

## Key Files

- `miniprogram/app.js` - CloudBase initialization, global app lifecycle
- `miniprogram/app.json` - Page routing, tab bar, window configuration
- `miniprogram/app.wxss` - Global styles (color scheme: #FF6B35 orange theme)
- `cloudfunctions/getOpenId/index.js` - Cloud function to retrieve user openid
- `project.config.json` - WeChat Mini Program project settings (appid: wxe8d95bf55ebc2ae7)

## CloudBase-Specific Patterns

### When to Use Cloud Functions vs Direct DB Access

**Use Direct DB Access (Frontend SDK) when:**
- Simple CRUD operations with security rules
- Reading user's own data
- Querying public data

**Use Cloud Functions when:**
- Need to access data that user shouldn't directly read (e.g., sensitive fields)
- Complex business logic requiring multiple operations
- Calling third-party APIs
- Server-side computation
- Operations requiring elevated privileges beyond security rules

### WeChat Mini Program + CloudBase Best Practices

1. **Always get openid via cloud function** - Never try to get it client-side
2. **Use security rules as primary access control** - Keep cloud functions for logic, not just gatekeeping
3. **Leverage wx.cloud SDK methods** - Don't reinvent database operations
4. **Store file references, not files** - Upload to cloud storage, store URLs in database
5. **Handle async operations properly** - All wx.cloud methods return Promises

## Design System

**Color Palette:**
- Primary: #FF6B35 (Orange - team energy)
- Secondary: #4CAF50 (Green - success states)
- Accent: #2196F3 (Blue - info/links)

**Layout Standards:**
- Border radius: 16rpx
- Standard spacing: 20rpx
- Responsive units: Use rpx (responsive pixels) for all dimensions

## Future Development Phases

**Phase 2 (Planned):**
- Match recording and statistics
- Discover teams feature
- Scheduling matches
- Personal data dashboard

**Phase 3 (Planned):**
- League system
- Data analysis reports
- Social feed
- Tactical board tool

## Common Operations

### Adding a New Page

1. Create page directory in `miniprogram/pages/page-name/`
2. Add page to `miniprogram/app.json` pages array
3. Use CloudBase SDK: `const db = wx.cloud.database()`
4. Apply security rules thinking: what should users access?

### Adding a New Collection

1. Create collection in CloudBase Console
2. Define security rules based on data sensitivity
3. Update relevant pages to query new collection
4. Test access control thoroughly

### Deploying Updates

1. **Cloud Functions**: Right-click in WeChat DevTools → Upload and Deploy
2. **Mini Program Code**: Click "Upload" in DevTools → Submit for review in MP Admin
3. **Database**: Changes via CloudBase Console take effect immediately

## CloudBase Console Links

After deploying resources, access management pages at:
- **Database Collections**: `https://tcb.cloud.tencent.com/dev?envId=${envId}#/db/doc`
- **Cloud Functions**: `https://tcb.cloud.tencent.com/dev?envId=${envId}#/scf`
- **Cloud Storage**: `https://tcb.cloud.tencent.com/dev?envId=${envId}#/storage`
- **Overview**: `https://tcb.cloud.tencent.com/dev?envId=${envId}#/overview`

Replace `${envId}` with your actual CloudBase environment ID.

## Test Setup and Commands

This project uses Jest for testing with a custom mock database that simulates CloudBase NoSQL operations.

**Run all tests:**
```bash
npm test
```

**Run a single test file:**
```bash
npm test -- path/to/test-file.test.js
```

**Test Architecture:**
- `jest.config.js` - Jest configuration with Babel transform
- `jest.setup.js` - Global mocks for WeChat Mini Program APIs (`wx`, `wx.cloud`, `Page`, `App`, etc.)
- `miniprogram/__test__/mock-db.js` - In-memory mock database implementing CloudBase SDK patterns:
  - Supports collections: `users`, `teams`, `team_members`, `matches`
  - Implements `add()`, `where()`, `get()`, `doc().update()`, `doc().remove()`, `orderBy()`
  - Supports `$or` queries and nested field queries (e.g., `members.userId`)
  - Reset with `mockDb.reset()` in test `beforeEach` hooks

**Test File Structure:**
- Page integration tests: `miniprogram/pages/{page}/__test__/{page}.test.js`
- Component tests: `miniprogram/components/{component}/{component}.test.js`
- Logic unit tests: `miniprogram/__test__/unit/{feature}.unit.test.js`

## Component Architecture

The project uses WeChat Mini Program's component system for reusable UI elements:

**player-card Component** (`miniprogram/components/player-card/`):
- Properties: `userProfile` (nickname, avatar, height, weight, position, skills)
- Observer pattern: Auto-converts skills to array if needed
- Lifecycle hooks: `attached`, `detached`, page-level `show`, `hide`, `resize`

## Page Structure

**Tab Bar Pages:**
- `index` - Home page with user info and quick actions
- `teams` - User's joined teams list
- `match/match-list` - Match history and upcoming matches
- `discovery` - Discover teams and public matches
- `profile` - Personal profile and settings

**Sub-pages:**
- `create-team` - Team creation form
- `team-detail` - Team info and member list
- `member-manage` - Captain-only member management
- `match/create-match` - Match scheduling

## Reference Documentation

- Product Spec: See `产品功能设计.md` for full feature roadmap
- Deployment Guide: See `DEPLOYMENT.md` for step-by-step setup instructions
- Database Schema: See `DATABASE_SCHEMA.md` for collection structures and security rules
- WeChat Cloud Development: https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html
- CloudBase Docs: https://docs.cloudbase.net/
