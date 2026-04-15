# 🏀 比赛记录管理 - 详细设计文档

> **项目**: Basketball 微信小程序
> **模块**: 比赛记录管理（Match Record）
> **版本**: v1.0
> **创建日期**: 2026-04-14
> **状态**: Draft

---

## 📋 目录

1. [设计目标](#1-设计目标)
2. [架构概览](#2-架构概览)
3. [数据模型](#3-数据模型)
4. [页面设计](#4-页面设计)
5. [云函数设计](#5-云函数设计)
6. [工具函数设计](#6-工具函数设计)
7. [用户流程](#7-用户流程)
8. [设计决策](#8-设计决策)
9. [Phase 规划](#9-phase-规划)
10. [验收标准](#10-验收标准)
11. [风险评估](#11-风险评估)
12. [技术参考](#12-技术参考)

---

## 1. 设计目标

### 核心目标

1. **比赛 CRUD**：支持创建、查看、编辑、删除比赛记录
2. **球员数据统计**：记录每位出场球员的关键数据（得分、篮板、助攻、抢断等）
3. **比分明细**：按节记录比分，支持查看每节走势
4. **球员历史统计**：查看某球员的所有比赛数据和场均统计

### 设计原则

- **风格一致**：与现有球员列表页面保持一致的视觉风格（浅蓝背景 `#f4f8ff`、白色卡片、蓝色主色 `#1652f0`）
- **简洁录入**：赛后录入为主，减少录入步骤
- **数据准确**：自动计算命中率、总分，校验数据一致性
- **渐进增强**：MVP 先做赛后录入，后续可扩展实时记录

---

## 2. 架构概览

### 模块关系

```
┌─────────────────────────────────────────────────┐
│                   前端页面                        │
│                                                   │
│  match-list  ←→  create-match  ←→  match-detail  │
│                    ↓                              │
│              player-data-entry                    │
│                    ↓                              │
│  player-detail ←→  player-match-history           │
│                                                   │
├─────────────────────────────────────────────────┤
│                   工具层                          │
│                                                   │
│  utils/db.js (matches 相关函数)                   │
│  utils/match-helper.js (计算/格式化)              │
│                                                   │
├─────────────────────────────────────────────────┤
│                   数据层                          │
│                                                   │
│  云数据库: matches / player_match_stats           │
│  云函数: (复用现有 batchImportPlayers 架构)       │
│                                                   │
└─────────────────────────────────────────────────┘
```

### 新增文件清单

```
miniprogram/
├── pages/
│   └── match/
│       ├── list/                    # 比赛列表
│       │   ├── list.js
│       │   ├── list.wxml
│       │   ├── list.wxss
│       │   └── list.json
│       ├── create/                  # 新建/编辑比赛
│       │   ├── create.js
│       │   ├── create.wxml
│       │   ├── create.wxss
│       │   └── create.json
│       └── detail/                  # 比赛详情
│           ├── detail.js
│           ├── detail.wxml
│           ├── detail.wxss
│           └── detail.json
├── components/
│   └── player-stat-input/           # 球员数据录入组件
│       ├── player-stat-input.js
│       ├── player-stat-input.wxml
│       ├── player-stat-input.wxss
│       └── player-stat-input.json
└── utils/
    └── match-helper.js              # 比赛相关计算/格式化工具
```

### 修改文件清单

```
miniprogram/
├── app.json                         # 注册新页面
├── utils/db.js                      # 新增 matches 相关 CRUD 函数
└── pages/players/detail/
    ├── detail.wxml                  # 新增"比赛记录"入口
    └── detail.js                    # 新增跳转逻辑
```

---

## 3. 数据模型

### 3.1 matches 集合

```javascript
{
  _id: "match_xxx",                  // 自动生成
  teamId: "team_xxx",                // 所属球队 ID
  opponent: "野猫队",                 // 对手名称（必填）
  matchDate: "2026-04-14",           // 比赛日期（必填）
  startTime: "21:13",                // 开始时间（选填）
  endTime: "22:45",                  // 结束时间（选填）
  location: "万体馆",                 // 比赛地点（选填）
  matchType: "friendly",             // 比赛类型：friendly/league/cup（默认 friendly）
  status: "completed",               // 状态：upcoming/ongoing/completed

  // 比分
  scoreUs: 68,                       // 我方总分（必填，完成后）
  scoreOpponent: 55,                 // 对手总分（必填，完成后）

  // 每节比分
  quarters: [
    { quarter: 1, scoreUs: 18, scoreOpponent: 12 },
    { quarter: 2, scoreUs: 15, scoreOpponent: 20 },
    { quarter: 3, scoreUs: 22, scoreOpponent: 11 },
    { quarter: 4, scoreUs: 13, scoreOpponent: 12 }
  ],

  // 球员数据
  playerStats: [
    {
      playerId: "player_xxx",        // 关联球员 ID
      nickname: "骚当",               // 冗余存储，方便展示
      position: "SF",                 // 冗余存储
      played: true,                   // 是否出场
      points: 24,                     // 得分
      rebounds: 8,                    // 篮板
      assists: 5,                     // 助攻
      steals: 3,                      // 抢断
      blocks: 0,                      // 盖帽
      turnovers: 2,                   // 失误
      fouls: 3,                       // 犯规
      shotsMade: 10,                  // 投篮命中数
      shotsAttempted: 16,             // 投篮出手数
      threePtMade: 2,                 // 三分命中数
      threePtAttempted: 5,            // 三分出手数
      ftMade: 0,                      // 罚球命中数
      ftAttempted: 0                  // 罚球出手数
    }
  ],

  highlights: "",                     // 比赛备注/精彩瞬间（选填）
  createdAt: "2026-04-14T22:50:00Z", // 创建时间
  updatedAt: "2026-04-14T22:50:00Z"  // 更新时间
}
```

### 3.2 player_match_stats 集合

冗余设计，方便按球员维度快速查询历史数据，无需扫描 matches 集合。

```javascript
{
  _id: "pms_xxx",                    // 自动生成
  matchId: "match_xxx",              // 关联比赛 ID
  playerId: "player_xxx",            // 关联球员 ID
  teamId: "team_xxx",                // 关联球队 ID

  // 冗余字段（减少联表查询）
  nickname: "骚当",
  opponent: "野猫队",
  matchDate: "2026-04-14",
  matchType: "friendly",
  result: "win",                     // win/loss

  // 数据
  points: 24,
  rebounds: 8,
  assists: 5,
  steals: 3,
  blocks: 0,
  turnovers: 2,
  fouls: 3,
  shotsMade: 10,
  shotsAttempted: 16,
  fgPct: 62.5,                       // 计算字段：投篮命中率
  threePtMade: 2,
  threePtAttempted: 5,
  threePtPct: 40.0,                  // 计算字段：三分命中率
  ftMade: 0,
  ftAttempted: 0,
  ftPct: 0,                          // 计算字段：罚球命中率

  createdAt: "2026-04-14T22:50:00Z"
}
```

### 3.3 数据库索引

```javascript
// matches 集合
db.collection('matches').createIndex({ teamId: 1, matchDate: -1 })

// player_match_stats 集合
db.collection('player_match_stats').createIndex({ playerId: 1, matchDate: -1 })
db.collection('player_match_stats').createIndex({ matchId: 1 })
```

> **注意**：微信云开发数据库索引需要在云开发控制台手动创建，或在云函数中使用 `db.collection.createIndex()` 创建。

---

## 4. 页面设计

### 4.1 比赛列表页 `pages/match/list/list`

#### 功能
- 展示该球队的所有比赛记录，按日期倒序排列
- 筛选：全部 / 胜 / 负（van-tabs 顶部切换）
- 下拉刷新 + 上拉加载更多
- 左滑删除（van-swipe-cell）
- 点击卡片进入比赛详情
- 右上角"新增比赛"按钮

#### UI 布局

```
┌──────────────────────────────────────┐
│  比赛记录                  [新增比赛]  │  ← 同球员列表 header 风格
│                                      │
│  [全部] [胜] [负]                     │  ← van-tabs
│                                      │
│  ┌─ 2026-04-14 ────────────────────┐ │
│  │  vs 野猫队                       │ │
│  │  [友谊赛]                        │ │  ← van-tag，蓝色背景
│  │  68 : 55                         │ │  ← 大号加粗
│  │  📍 万体馆 · 21:13-22:45        │ │
│  └──────────────────────────────────┘ │  ← 胜利卡片左侧可加绿色竖条
│                                      │
│  ┌─ 2026-04-07 ────────────────────┐ │
│  │  vs 飞鹰队                       │ │
│  │  [联赛]                          │ │
│  │  42 : 56                         │ │
│  │  📍 体育馆 · 19:00-20:30        │ │
│  └──────────────────────────────────┘ │  ← 失败卡片左侧加红色竖条
│                                      │
│  ← 左滑可删除                        │
└──────────────────────────────────────┘
```

#### 卡片样式要点
- 胜利卡片：左侧 4rpx 绿色竖条 `#22c55e`
- 失败卡片：左侧 4rpx 红色竖条 `#ef4444`
- 比赛类型 tag：
  - 友谊赛：蓝色 `#1652f0` 背景 `#eef4ff`
  - 联赛：橙色 `#f59e0b` 背景 `#fffbeb`
  - 杯赛：紫色 `#8b5cf6` 背景 `#f5f3ff`
- 比分：32rpx 加粗，胜绿色 `#22c55e`，负红色 `#ef4444`
- 日期 + 地点 + 时间：24rpx 灰色 `#64748b`

#### JS 逻辑

```javascript
Page({
  data: {
    matches: [],
    loading: true,
    activeTab: 0,        // 0=全部, 1=胜, 2=负
    page: 0,
    pageSize: 20,
    hasMore: true
  },

  onLoad() {
    this.loadMatches()
  },

  onPullDownRefresh() {
    this.setData({ page: 0, hasMore: true })
    this.loadMatches().then(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (this.data.hasMore) this.loadMatches()
  },

  onTabChange(e) {
    this.setData({ activeTab: e.detail.index, page: 0, hasMore: true })
    this.loadMatches()
  },

  async loadMatches() {
    const { activeTab, page, pageSize } = this.data
    const filter = {}
    if (activeTab === 1) filter.result = 'win'
    if (activeTab === 2) filter.result = 'loss'

    const result = await db.getMatchList(this.data.teamId, filter, page, pageSize)
    const matches = page === 0 ? result : [...this.data.matches, ...result]
    this.setData({
      matches,
      hasMore: result.length === pageSize,
      page: page + 1,
      loading: false
    })
  },

  goCreate() {
    wx.navigateTo({ url: '/pages/match/create/create' })
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/match/detail/detail?id=${id}` })
  },

  async onDelete(e) {
    const id = e.currentTarget.dataset.id
    await db.deleteMatch(id)
    this.setData({ page: 0, hasMore: true })
    this.loadMatches()
  }
})
```

---

### 4.2 新建/编辑比赛页 `pages/match/create/create`

#### 功能
- 接收可选参数 `?id=xxx` 进行编辑模式
- van-tabs 分三个步骤：基本信息 / 比分录入 / 球员数据
- 基本信息填写后自动验证
- 球员数据录入支持批量操作
- 提交时自动计算命中率、校验总分

#### UI 布局

**Tab 1：基本信息**

```
┌──────────────────────────────────────┐
│  ✕  新建比赛                          │
│                                      │
│  [基本信息] [比分录入] [球员数据]       │  ← van-tabs
│                                      │
│  ┌──────────────────────────────────┐ │
│  │  对手名称 *                       │ │
│  │  [                              ]│ │  ← van-field
│  │                                  │ │
│  │  比赛日期 *                       │ │
│  │  [2026-04-14         ▼]          │ │  ← van-datetime-picker
│  │                                  │ │
│  │  开始时间                         │ │
│  │  [21:13               ▼]         │ │  ← van-datetime-picker
│  │                                  │ │
│  │  结束时间                         │ │
│  │  [22:45               ▼]         │ │
│  │                                  │ │
│  │  比赛地点                         │ │
│  │  [万体馆               ]         │ │
│  │                                  │ │
│  │  比赛类型                         │ │
│  │  [友谊赛               ▼]         │ │  ← picker
│  │                                  │ │
│  │  比赛结果                         │ │
│  │  ○ 未开始  ● 已结束              │ │  ← van-radio-group
│  └──────────────────────────────────┘ │
│                                      │
│         [下一步 →]                    │
└──────────────────────────────────────┘
```

**Tab 2：比分录入**（仅 status=completed 时显示）

```
┌──────────────────────────────────────┐
│  ✕  新建比赛                          │
│                                      │
│  [基本信息] [比分录入] [球员数据]       │
│                                      │
│  ┌──────────────────────────────────┐ │
│  │          我方    对手              │ │
│  │                                  │ │
│  │  总分   [68 ]   [55 ]           │ │  ← 大号 input
│  │                                  │ │
│  │  ──────────────────────────────  │ │
│  │                                  │ │
│  │  第1节  [18 ]   [12 ]           │ │
│  │  第2节  [15 ]   [20 ]           │ │
│  │  第3节  [22 ]   [11 ]           │ │
│  │  第4节  [13 ]   [12 ]           │ │
│  │                                  │ │
│  │  ⚠️ 每节合计: 68 / 55           │ │  ← 自动计算，与总分对比
│  └──────────────────────────────────┘ │
│                                      │
│  [← 上一步]      [下一步 →]           │
└──────────────────────────────────────┘
```

**Tab 3：球员数据**

```
┌──────────────────────────────────────┐
│  ✕  新建比赛                          │
│                                      │
│  [基本信息] [比分录入] [球员数据]       │
│                                      │
│  [全选] 已选 8/12 人                  │
│                                      │
│  ┌──────────────────────────────────┐ │
│  │  ☑ 骚当 SF                       │ │  ← van-checkbox
│  │  得分[24] 板[8] 助[5] 抢[3]     │ │  ← 横排小 input
│  │  投[10/16] 三[2/5] 罚[0/0]      │ │
│  │  命中率: 62.5%                   │ │  ← 自动计算
│  ├──────────────────────────────────┤ │
│  │  ☑ 大伟 PF                       │ │
│  │  得分[16] 板[12] 助[3] 抢[1]    │ │
│  │  投[6/10] 三[0/2] 罚[4/6]       │ │
│  │  命中率: 60.0%                   │ │
│  ├──────────────────────────────────┤ │
│  │  ☑ 阿杰 PG                       │ │
│  │  得分[12] 板[3] 助[8] 抢[2]     │ │
│  │  投[4/9] 三[2/4] 罚[2/2]        │ │
│  │  命中率: 44.4%                   │ │
│  ├──────────────────────────────────┤ │
│  │  ☐ 小李 SG                       │ │  ← 未勾选 = 未出场
│  │  (未出场)                        │ │
│  └──────────────────────────────────┘ │
│                                      │
│  ┌──────────────────────────────────┐ │
│  │  球员得分合计: 52                 │ │  ← 自动计算
│  │  ⚠️ 与比分不一致 (68 vs 52)       │ │  ← 警告提示
│  └──────────────────────────────────┘ │
│                                      │
│  [← 上一步]     [保存比赛]            │
└──────────────────────────────────────┘
```

#### 球员数据录入组件 `player-stat-input`

封装为独立组件，便于复用：

```javascript
// components/player-stat-input/player-stat-input.js
Component({
  properties: {
    players: { type: Array, value: [] },       // 所有球员列表
    value: { type: Array, value: [] },          // 当前已填写的数据
  },

  data: {
    selectedIds: [],       // 选中的球员 ID 列表
    stats: {}              // { playerId: { points, rebounds, ... } }
  },

  methods: {
    onSelectChange(e) {
      // 更新选中状态
    },

    onStatInput(e) {
      // 更新某球员某项数据
      // 自动触发命中率计算
    },

    getFormData() {
      // 返回完整的球员统计数据
    },

    getTotalPoints() {
      // 返回球员得分合计
    }
  }
})
```

---

### 4.3 比赛详情页 `pages/match/detail/detail`

#### 功能
- 展示比赛完整信息
- van-tabs 切换：每节比分 / 球员数据 / 比赛备注
- 支持编辑、删除操作
- 支持分享（生成图片，Phase 2）

#### UI 布局

```
┌──────────────────────────────────────┐
│  ← 比赛详情                  [···]   │  ← 更多菜单（编辑/删除）
│                                      │
│  ┌──────────────────────────────────┐ │
│  │  vs 野猫队                       │ │
│  │  [友谊赛]                        │ │
│  │                                  │ │
│  │       68 : 55                    │ │  ← 48rpx 加粗
│  │       胜 13 分                   │ │  ← 28rpx 绿色
│  │                                  │ │
│  │  📍 万体馆                       │ │
│  │  📅 2026-04-14 21:13 - 22:45    │ │
│  └──────────────────────────────────┘ │
│                                      │
│  [每节比分] [球员数据] [备注]          │  ← van-tabs
│                                      │
│  ── 每节比分 ──                       │
│  ┌──────────────────────────────────┐ │
│  │        我方    对手    分差       │ │
│  │  第1节   18     12    +6        │ │
│  │  第2节   15     20    -5        │ │  ← 分差负数红色
│  │  第3节   22     11    +11       │ │
│  │  第4节   13     12    +1        │ │
│  │  ────────────────────────────   │ │
│  │  总计    68     55    +13       │ │  ← 加粗
│  └──────────────────────────────────┘ │
│                                      │
│  ── 球员数据 ──                       │
│  ┌──────────────────────────────────┐ │
│  │  #1 骚当 SF                      │ │
│  │  24分  8板  5助  3抢             │ │
│  │  投篮 10/16 (62.5%)              │ │
│  │  三分 2/5 (40.0%)  罚球 0/0      │ │
│  ├──────────────────────────────────┤ │
│  │  #2 大伟 PF                      │ │
│  │  16分  12板  3助  1抢            │ │
│  │  投篮 6/10 (60.0%)               │ │
│  │  三分 0/2 (0.0%)  罚球 4/6       │ │
│  └──────────────────────────────────┘ │
│                                      │
│  ── 未出场 ──                         │
│  小李 SG · 老王 C                     │
└──────────────────────────────────────┘
```

---

### 4.4 球员比赛历史 `pages/players/detail/detail` 增强

#### 改动

在球员详情页底部新增「比赛记录」入口卡片：

```
┌──────────────────────────────────────┐
│  ← 球员详情                           │
│                                      │
│  ┌──────────────────────────────────┐ │
│  │  骚当                     [SF]   │ │
│  │  真实姓名：XXX                    │ │
│  │  ...                             │ │
│  └──────────────────────────────────┘ │
│                                      │
│  ┌──────────────────────────────────┐ │
│  │  📊 比赛记录                    │ │  ← 新增卡片
│  │                                  │ │
│  │  总场次: 12  场均: 18.5分       │ │  ← 统计摘要
│  │  最高分: 32  命中率: 55.2%      │ │
│  │                                  │ │
│  │  → 查看详情                      │ │  ← 点击跳转
│  └──────────────────────────────────┘ │
│                                      │
│  [编辑球员]                           │
└──────────────────────────────────────┘
```

点击后跳转到 `pages/match/list/list?playerId=xxx`，列表页过滤该球员的比赛。

---

## 5. 云函数设计

### 5.1 方案选择

**不新建云函数**，直接在 `db.js` 中新增函数，通过小程序端调用云数据库。

原因：
1. 比赛数据量不大（业余球队每周 1-3 场）
2. 查询逻辑简单，不需要复杂计算
3. 减少维护成本

### 5.2 db.js 新增函数

```javascript
// ================== Matches 相关操作 ==================

/**
 * 创建比赛
 * @param {Object} matchData - 比赛数据（不含 _id）
 * @returns {Promise<string>} 比赛 ID
 */
async function createMatch(matchData) { ... }

/**
 * 获取比赛列表
 * @param {string} teamId - 球队 ID
 * @param {Object} filter - 筛选条件 { result?: 'win'|'loss', matchType?: string }
 * @param {number} page - 页码（从 0 开始）
 * @param {number} pageSize - 每页数量
 * @returns {Promise<Array>} 比赛列表
 */
async function getMatchList(teamId, filter = {}, page = 0, pageSize = 20) { ... }

/**
 * 获取比赛详情
 * @param {string} matchId - 比赛 ID
 * @returns {Promise<Object>} 比赛详情
 */
async function getMatchDetail(matchId) { ... }

/**
 * 更新比赛
 * @param {string} matchId - 比赛 ID
 * @param {Object} updateData - 更新数据
 * @returns {Promise<boolean>}
 */
async function updateMatch(matchId, updateData) { ... }

/**
 * 删除比赛
 * @param {string} matchId - 比赛 ID
 * @returns {Promise<boolean>}
 */
async function deleteMatch(matchId) { ... }

/**
 * 获取球员比赛历史
 * @param {string} playerId - 球员 ID
 * @param {number} limit - 返回数量
 * @returns {Promise<Array>} 比赛统计列表
 */
async function getPlayerMatchHistory(playerId, limit = 20) { ... }

/**
 * 获取球员赛季统计
 * @param {string} playerId - 球员 ID
 * @param {string} season - 赛季标识（如 "2026"）
 * @returns {Promise<Object>} 场均统计数据
 */
async function getPlayerSeasonStats(playerId, season) { ... }
```

---

## 6. 工具函数设计

### `utils/match-helper.js`

```javascript
/**
 * 计算投篮命中率
 */
function calcFgPct(made, attempted) {
  if (!attempted || attempted === 0) return 0
  return Math.round((made / attempted) * 1000) / 10
}

/**
 * 计算球员得分合计
 */
function calcTeamPoints(playerStats) {
  return playerStats
    .filter(p => p.played)
    .reduce((sum, p) => sum + (p.points || 0), 0)
}

/**
 * 计算每节比分合计
 */
function calcQuarterTotals(quarters) {
  return quarters.reduce(
    (acc, q) => ({
      scoreUs: acc.scoreUs + (q.scoreUs || 0),
      scoreOpponent: acc.scoreOpponent + (q.scoreOpponent || 0)
    }),
    { scoreUs: 0, scoreOpponent: 0 }
  )
}

/**
 * 判断比赛胜负
 */
function getMatchResult(scoreUs, scoreOpponent) {
  if (scoreUs > scoreOpponent) return 'win'
  if (scoreUs < scoreOpponent) return 'loss'
  return 'draw'
}

/**
 * 格式化比赛类型
 */
function formatMatchType(type) {
  const map = {
    friendly: '友谊赛',
    league: '联赛',
    cup: '杯赛'
  }
  return map[type] || type
}

/**
 * 格式化比赛类型标签样式
 */
function getMatchTypeTagClass(type) {
  const map = {
    friendly: 'tag-friendly',  // 蓝色
    league: 'tag-league',      // 橙色
    cup: 'tag-cup'             // 紫色
  }
  return map[type] || 'tag-friendly'
}

/**
 * 初始化空球员数据
 */
function createEmptyPlayerStat(player) {
  return {
    playerId: player._id,
    nickname: player.nickname || player.displayNickname,
    position: player.position || player.displayPosition,
    played: false,
    points: 0,
    rebounds: 0,
    assists: 0,
    steals: 0,
    blocks: 0,
    turnovers: 0,
    fouls: 0,
    shotsMade: 0,
    shotsAttempted: 0,
    threePtMade: 0,
    threePtAttempted: 0,
    ftMade: 0,
    ftAttempted: 0
  }
}

/**
 * 初始化空比赛数据（新建时使用）
 */
function createEmptyMatch(teamId) {
  return {
    teamId,
    opponent: '',
    matchDate: formatDate(new Date()),
    startTime: '',
    endTime: '',
    location: '',
    matchType: 'friendly',
    status: 'completed',
    scoreUs: 0,
    scoreOpponent: 0,
    quarters: [
      { quarter: 1, scoreUs: 0, scoreOpponent: 0 },
      { quarter: 2, scoreUs: 0, scoreOpponent: 0 },
      { quarter: 3, scoreUs: 0, scoreOpponent: 0 },
      { quarter: 4, scoreUs: 0, scoreOpponent: 0 }
    ],
    playerStats: [],
    highlights: ''
  }
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * 准备保存的数据（清理零值、计算命中率）
 */
function prepareMatchForSave(matchData) {
  const playerStats = matchData.playerStats
    .filter(p => p.played)
    .map(p => ({
      ...p,
      fgPct: calcFgPct(p.shotsMade, p.shotsAttempted),
      threePtPct: calcFgPct(p.threePtMade, p.threePtAttempted),
      ftPct: calcFgPct(p.ftMade, p.ftAttempted)
    }))

  return {
    ...matchData,
    playerStats,
    result: getMatchResult(matchData.scoreUs, matchData.scoreOpponent),
    updatedAt: db.serverDate()
  }
}

/**
 * 从比赛数据生成 player_match_stats 记录
 */
function extractPlayerMatchStats(match) {
  return match.playerStats
    .filter(p => p.played)
    .map(p => ({
      matchId: match._id,
      playerId: p.playerId,
      teamId: match.teamId,
      nickname: p.nickname,
      opponent: match.opponent,
      matchDate: match.matchDate,
      matchType: match.matchType,
      result: getMatchResult(match.scoreUs, match.scoreOpponent),
      points: p.points,
      rebounds: p.rebounds,
      assists: p.assists,
      steals: p.steals,
      blocks: p.blocks,
      turnovers: p.turnovers,
      fouls: p.fouls,
      shotsMade: p.shotsMade,
      shotsAttempted: p.shotsAttempted,
      fgPct: calcFgPct(p.shotsMade, p.shotsAttempted),
      threePtMade: p.threePtMade,
      threePtAttempted: p.threePtAttempted,
      threePtPct: calcFgPct(p.threePtMade, p.threePtAttempted),
      ftMade: p.ftMade,
      ftAttempted: p.ftAttempted,
      ftPct: calcFgPct(p.ftMade, p.ftAttempted),
      createdAt: db.serverDate()
    }))
}

module.exports = {
  calcFgPct,
  calcTeamPoints,
  calcQuarterTotals,
  getMatchResult,
  formatMatchType,
  getMatchTypeTagClass,
  createEmptyPlayerStat,
  createEmptyMatch,
  prepareMatchForSave,
  extractPlayerMatchStats
}
```

---

## 7. 用户流程

### 7.1 创建比赛

```
比赛列表 → 点击「新增比赛」
  → 填写对手名称、日期、地点、类型
  → 切换到「比分录入」
  → 输入总分 + 每节比分
  → 系统自动校验：每节合计 vs 总分
  → 切换到「球员数据」
  → 勾选出场球员
  → 输入每人的得分/篮板/助攻/抢断/投篮数据
  → 系统自动计算命中率
  → 系统校验：球员得分合计 vs 总分
  → 点击「保存」
  → 保存 matches + player_match_stats
  → 返回列表
```

### 7.2 查看比赛

```
比赛列表 → 点击某比赛卡片
  → 比赛详情（比分 + 每节明细 + 球员数据）
  → 切换 tabs 查看不同维度
  → 右上角「···」→ 编辑 / 删除
```

### 7.3 查看球员历史

```
球员详情 → 点击「比赛记录」卡片
  → 比赛列表（仅显示该球员参加的比赛）
  → 显示统计摘要（总场次、场均、最高分）
```

---

## 8. 设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 录入时机 | 赛后录入 | MVP 够用，实时记录复杂度高，后续扩展 |
| 数据粒度 | 6 基础项 + 3 投篮项 | 业余比赛 95% 场景，投篮命中率为选填 |
| 每节比分 | 支持 4 节 | 业余常见 4 节制，比分趋势有价值 |
| 球员数据 | 内嵌在比赛文档中 | 读多写少，避免多次查询 |
| 冗余集合 | player_match_stats | 按球员查历史无需 scan matches，性能好 |
| 云函数 | 不新建，复用 db.js | 数据量小，查询简单，减少维护 |
| 数据校验 | 仅提示不阻止 | 球员得分合计 vs 总分可能因替补得分不一致 |
| UI 风格 | 与球员列表一致 | 统一体验，用户无学习成本 |

---

## 9. Phase 规划

### Phase 1：比赛 CRUD（预计 3 小时）

**目标**：完成比赛列表、新建比赛、比赛详情三个页面

**任务清单**：

- [ ] 创建 `utils/match-helper.js` 工具函数
- [ ] 在 `db.js` 中新增 matches 相关 CRUD 函数
  - [ ] `createMatch` - 创建比赛（同时写入 player_match_stats）
  - [ ] `getMatchList` - 获取比赛列表（支持筛选和分页）
  - [ ] `getMatchDetail` - 获取比赛详情
  - [ ] `updateMatch` - 更新比赛（同时更新 player_match_stats）
  - [ ] `deleteMatch` - 删除比赛（同时删除 player_match_stats）
- [ ] 在 `app.json` 注册新页面
- [ ] 创建比赛列表页 `pages/match/list/`
  - [ ] 列表展示（按日期倒序）
  - [ ] 胜/负筛选（van-tabs）
  - [ ] 下拉刷新 + 上拉加载
  - [ ] 左滑删除（van-swipe-cell）
  - [ ] 新增按钮
- [ ] 创建新建比赛页 `pages/match/create/`
  - [ ] Tab 1：基本信息表单
  - [ ] Tab 2：比分录入（总分 + 每节）
  - [ ] Tab 3：球员选择（勾选出场球员）
  - [ ] 表单校验和提交
- [ ] 创建比赛详情页 `pages/match/detail/`
  - [ ] 比赛概览卡片（比分 + 基本信息）
  - [ ] Tab：每节比分 / 球员数据 / 备注
  - [ ] 编辑和删除功能

**验收标准**：

- [ ] 能创建新比赛并保存到云数据库
- [ ] 比赛列表按日期倒序展示
- [ ] 胜/负筛选正常工作
- [ ] 能查看比赛详情（比分 + 每节明细）
- [ ] 能编辑和删除比赛
- [ ] 无 500 错误
- [ ] 样式与球员列表一致

### Phase 2：球员数据录入 + 自动计算（预计 2 小时）

**目标**：在新建/编辑比赛时支持录入球员详细数据

**任务清单**：

- [ ] 创建 `player-stat-input` 组件
  - [ ] 球员多选（van-checkbox-group）
  - [ ] 每人数据行：得分/篮板/助攻/抢断
  - [ ] 展开行：投篮/三分/罚球
  - [ ] 自动计算命中率
- [ ] 集成到新建比赛页 Tab 3
- [ ] 球员得分合计 vs 总分校验提示
- [ ] 比赛详情页球员数据 Tab 展示
  - [ ] 按得分降序排列
  - [ ] 显示命中率

**验收标准**：

- [ ] 能选择出场球员并录入数据
- [ ] 命中率自动计算正确
- [ ] 球员得分合计与总分不一致时给出提示
- [ ] 比赛详情页正确展示球员数据

### Phase 3：球员历史统计（预计 1.5 小时）

**目标**：在球员详情页查看比赛历史和统计

**任务清单**：

- [ ] 在 `db.js` 新增 `getPlayerMatchHistory` 和 `getPlayerSeasonStats`
- [ ] 球员详情页新增「比赛记录」卡片
- [ ] 跳转到比赛列表（按球员过滤）
- [ ] 统计摘要：总场次、场均得分/篮板/助攻、最高分、命中率
- [ ] 列表展示该球员所有比赛数据

**验收标准**：

- [ ] 球员详情页显示比赛统计摘要
- [ ] 能查看该球员的历史比赛列表
- [ ] 场均数据计算正确

---

## 10. 验收标准

### 功能验收

- [ ] 比赛完整生命周期：创建 → 查看 → 编辑 → 删除
- [ ] 比赛列表支持胜/负筛选
- [ ] 比分录入支持总分 + 每节比分
- [ ] 球员数据录入支持 6 基础项 + 3 投篮项
- [ ] 命中率自动计算（投篮/三分/罚球）
- [ ] 数据校验：每节合计 vs 总分、球员得分 vs 总分
- [ ] 球员历史统计准确（场均、最高分）

### 性能验收

- [ ] 列表加载 < 1s（20 条以内）
- [ ] 详情加载 < 500ms
- [ ] 保存操作 < 2s

### 样式验收

- [ ] 与球员列表页视觉风格一致
- [ ] 胜/负状态颜色区分明显
- [ ] 比赛类型 tag 颜色正确
- [ ] 适配不同屏幕尺寸

### 安全验收

- [ ] 比赛数据绑定 teamId，只有同队成员可见
- [ ] 删除操作有二次确认
- [ ] 输入数据有长度和范围校验

---

## 11. 风险评估

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|---------|
| 云数据库写入并发限制 | 低 | 低 | 业余球队不会并发写入 |
| 球员数据录入复杂度高 | 用户放弃录入 | 中 | Phase 1 只录入基本信息，Phase 2 再加球员数据 |
| 包体积超限 | 无法发布 | 低 | 不引入新依赖，纯 Vant + 原生组件 |
| 历史数据迁移 | 旧数据不兼容 | 低 | 无历史数据，全新功能 |

---

## 12. 技术参考

- [微信小程序云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [Vant Weapp 组件库](https://vant-ui.github.io/vant-weapp/)
- [微信小程序自定义组件](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/)
- [Apple Fitness 数据展示设计参考](https://developer.apple.com/design/human-interface-guidelines/health-and-fitness)
- [Basketball Stats App Best Practices](https://www.basketballforcoaches.com/basketball-stats-apps/)

---

*创建日期: 2026-04-14 | 作者: Javis | 状态: Draft*
