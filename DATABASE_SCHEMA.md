# 篮球管理小程序 - 数据库设计文档

## 数据库集合 (Collections)

请在 [CloudBase 控制台](https://tcb.cloud.tencent.com) 创建以下集合：

---

## 1. users 用户集合

**用途**: 存储用户个人信息

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `_id` | String | 文档ID (自动生成) |
| `_openid` | String | 用户 OpenID (系统字段) |
| `nickName` | String | 昵称 |
| `avatarUrl` | String | 头像 URL |
| `height` | Number | 身高 (cm) |
| `weight` | Number | 体重 (kg) |
| `positions` | Array\<String\> | 场上位置 ['PG', 'SG', 'SF', 'PF', 'C'] |
| `skills` | Array\<String\> | 擅长技能 |
| `createdAt` | Date | 创建时间 |
| `updatedAt` | Date | 更新时间 |

**安全规则**:
```json
{
  "read": true,
  "write": "doc._openid == auth.openid"
}
```

---

## 2. teams 球队集合

**用途**: 存储球队信息

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `_id` | String | 文档ID (自动生成) |
| `name` | String | 球队名称 |
| `logo` | String | 队徽 (Cloud ID) |
| `description` | String | 球队简介 |
| `region` | String | 所属地区 |
| `captainId` | String | 队长 OpenID |
| `members` | Array | 成员列表 |
| `members[].userId` | String | 成员 OpenID |
| `members[].role` | String | 角色 (captain/member) |
| `members[].number` | Number | 球衣号码 |
| `members[].joinedAt` | Date | 加入时间 |
| `createdAt` | Date | 创建时间 |

**安全规则**:
```json
{
  "read": true,
  "write": "doc.captainId == auth.openid || doc.members.userId == auth.openid"
}
```

---

## 3. matches 比赛集合

**用途**: 存储比赛信息

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `_id` | String | 文档ID (自动生成) |
| `activityId` | String | 所属活动 ID（活动赛程比赛可用） |
| `matchType` | String | 比赛类型 (`friendly` / `league` / `cup` / `fiba` / `ncaa`) |
| `status` | String | 文档状态 (`draft` / `finalized`) |
| `matchStatus` | String | 比赛进度 (`scheduled` / `ongoing` / `finished`) |
| `teamId` | String | 业务球队 ID（可为空） |
| `teamNames` | Array\<String\> | 本场对阵队名 |
| `homeTeamName` | String | 主队名称（活动赛程使用） |
| `awayTeamName` | String | 客队名称（活动赛程使用） |
| `matchDate` | String | 比赛日期 `YYYY-MM-DD` |
| `startTime` | String | 开始时间 `HH:mm` |
| `endTime` | String | 结束时间 `HH:mm` |
| `location` | String | 比赛地点 |
| `scoreUs` | Number | 左侧队伍比分 |
| `scoreOpponent` | Number | 右侧队伍比分 |
| `quarters` | Array | 每节比分 |
| `playerStats` | Array | 单场球员技术统计 |
| `grouping` | Object | 本场两队分组快照 |
| `selectedPlayerIds` | Array\<String\> | 参赛球员 ID 列表 |
| `highlights` | String | 比赛备注 |
| `isGroupingLocked` | Boolean | 分组是否已锁定 |
| `ratingSession` | Object | 评分开关（可选，不存在表示兼容开放） |
| `ratingSession.status` | String | 评分状态（`open` 表示开放，其它值关闭） |
| `createdAt` | Date | 创建时间 |
| `updatedAt` | Date | 更新时间 |

**安全规则**:
```json
{
  "read": true,
  "write": true
}
```

> 评分开关当前内嵌在 `matches.ratingSession`，没有独立 `match_rating_sessions` 集合；若未来需要按场次扩展更多评分配置，可再迁移为独立集合。

---

## 4. players 球员集合

**用途**: 存储球员信息

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `_id` | String | 文档ID (自动生成) |
| `nickname` | String | 昵称（显示名称）|
| `realName` | String | 真实姓名 |
| `position` | String | 场上位置 (PG/SG/SF/PF/C) |
| `age` | Number | 年龄 |
| `birthday` | Date | 生日 |
| `height` | Number | 身高 (cm) |
| `weight` | Number | 体重 (kg) |
| `avatar` | String | 头像 URL（支持 GIF，可为空）|
| `isMvp` | Boolean | 是否为 MVP 球员（默认 false，影响头像特效展示）|
| `createdAt` | Date | 创建时间 |
| `updatedAt` | Date | 更新时间 |

**安全规则**:
```json
{
  "read": true,
  "write": "doc._openid == auth.openid"
}
```
> 注：以上为示例规则，建议根据业务场景限制写权限。特权操作（如管理员修改任意球员、设置 MVP 标记）建议通过云函数执行，避免前端直接操作。

---

## 5. player_ratings 球员评分源记录集合

**用途**: 存储用户对单场出场球员的原始评分。所有写入必须通过云函数 `submitPlayerRating`，前端只允许读取当前用户自己的记录。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `_id` | String | 文档ID (自动生成) |
| `_openid` | String | 评分用户 OpenID（云函数根据 `cloud.getWXContext().OPENID` 显式写入） |
| `matchId` | String | 比赛 ID |
| `playerId` | String | 球员 ID |
| `score` | Number | 评分整数，范围 1-10 |
| `starValue` | Number | 星级展示值，范围 0.5-5，等于 `score / 2` |
| `tags` | Array\<String\> | 标签白名单，最多 3 个 |
| `comment` | String | 短评，trim 后最多 80 字 |
| `compatMode` | Boolean | 是否因老比赛缺少 `playerStats` 而兼容 `selectedPlayerIds` |
| `createdAt` | Date | 创建时间 |
| `updatedAt` | Date | 更新时间 / 节流依据 |

**索引**:
- 唯一索引：`matchId + playerId + _openid`
- 普通索引：`matchId + _openid + updatedAt`
- 普通索引：`matchId + playerId`
- 普通索引：`playerId`

**安全规则**:
```json
{
  "read": "doc._openid == auth.openid",
  "create": false,
  "update": false,
  "delete": false
}
```

> 前端查询必须带 `_openid: currentOpenid`。若无法获取 OpenID，不读取本集合也不允许提交评分。

---

## 6. match_player_rating_summaries 单场球员评分摘要集合

**用途**: 存储每场比赛中每个球员的公开评分摘要，由 `submitPlayerRating` 从 `player_ratings` 重算。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `_id` | String | 文档ID (自动生成) |
| `matchId` | String | 比赛 ID |
| `playerId` | String | 球员 ID |
| `ratingCount` | Number | 评分人数 |
| `averageScore` | Number | 1-10 平均分，保留 1 位小数 |
| `averageStar` | Number | 0.5-5 星级均值 |
| `tagSummary` | Array | Top 5 标签统计 |
| `tagSummary[].tag` | String | 标签 |
| `tagSummary[].count` | Number | 次数 |
| `compatMode` | Boolean | 最近一次聚合是否包含老数据兼容标记 |
| `updatedAt` | Date | 更新时间 |

**索引**:
- 唯一索引：`matchId + playerId`
- 普通索引：`matchId`

**安全规则**:
```json
{
  "read": true,
  "write": false
}
```

---

## 7. player_rating_summaries 球员长期评分摘要集合

**用途**: 存储球员跨比赛长期评分摘要，由 `submitPlayerRating` 从 `player_ratings` 重算，球员详情页公开展示。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `_id` | String | 文档ID (自动生成) |
| `playerId` | String | 球员 ID |
| `ratingCount` | Number | 累计评分次数 |
| `averageScore` | Number | 1-10 平均分 |
| `averageStar` | Number | 0.5-5 星级均值 |
| `tagSummary` | Array | Top 5 标签统计 |
| `updatedAt` | Date | 更新时间 |

**索引**:
- 唯一索引：`playerId`

**安全规则**:
```json
{
  "read": true,
  "write": false
}
```

> 摘要集合缺失时，比赛详情与球员详情会降级为空摘要，不影响基础页面加载；提交评分仍需要先创建三个评分集合并部署云函数。

---

## 8. match_records 比赛记录集合

**用途**: 存储球员单场比赛数据

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `_id` | String | 文档ID (自动生成) |
| `playerId` | String | 球员 ID |
| `matchId` | String | 比赛 ID |
| `year` | String | 赛季年份 |
| `pts` | Number | 得分 |
| `reb` | Number | 篮板 |
| `ast` | Number | 助攻 |
| `stl` | Number | 抢断 |
| `blk` | Number | 盖帽 |
| `tov` | Number | 失误 |
| `fgm` | Number | 投篮命中数 |
| `fga` | Number | 投篮出手数 |
| `threePm` | Number | 三分命中数 |
| `threePa` | Number | 三分出手数 |
| `ftm` | Number | 罚球命中数 |
| `fta` | Number | 罚球出手数 |
| `createdAt` | Date | 创建时间 |

**安全规则**:
```json
{
  "read": true,
  "write": "doc._openid == auth.openid"
}
```
> 当前实现已演进为 `player_match_stats` 集合，用于按球员维度索引单场比赛数据，字段与比赛详情页统计保持一致。

---

## 9. activities 活动集合

**用途**: 存储一场篮球活动的主记录（报名、分组、赛程入口）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `_id` | String | 文档ID (自动生成) |
| `title` | String | 活动名称 |
| `activityDate` | String | 活动日期 `YYYY-MM-DD` |
| `startTime` | String | 开始时间 `HH:mm` |
| `endTime` | String | 结束时间 `HH:mm` |
| `location` | String | 活动地点 |
| `ruleType` | String | 规则类型（当前固定 `ncaa`） |
| `formatType` | String | 活动模式（当前固定 `3team-double-round-robin`） |
| `teamCount` | Number | 队伍数量（当前固定 3） |
| `teamNames` | Array\<String\> | 队伍名称数组 |
| `status` | String | 活动状态 (`draft` / `registration_open` / `registration_closed` / `grouped` / `in_progress` / `finished`) |
| `registrationDeadline` | String | 报名截止时间 |
| `createdByOpenid` | String | 创建者 OpenID |
| `groupingSnapshot` | Object | 活动级三队分组快照 |
| `createdAt` | Date | 创建时间 |
| `updatedAt` | Date | 更新时间 |

---

## 10. activity_registrations 活动报名集合

**用途**: 存储球员对活动的报名记录

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `_id` | String | 文档ID (自动生成) |
| `activityId` | String | 活动 ID |
| `playerId` | String | 球员 ID |
| `openid` | String | 报名者 OpenID |
| `nicknameSnapshot` | String | 报名时球员昵称快照 |
| `avatarSnapshot` | String | 报名时头像快照 |
| `positionSnapshot` | String | 报名时位置快照 |
| `status` | String | 报名状态 (`registered` / `cancelled` / `confirmed`) |
| `registeredAt` | Date | 报名时间 |
| `updatedAt` | Date | 更新时间 |

---

## 创建步骤

1. 登录 [CloudBase 控制台](https://tcb.cloud.tencent.com)
2. 选择您的环境
3. 进入 **数据库** 模块
4. 点击 **新建集合**，依次创建:
   - `users`
   - `teams`
   - `matches`
   - `players`
   - `player_match_stats`
   - `player_ratings`
   - `match_player_rating_summaries`
   - `player_rating_summaries`
   - `activities`
   - `activity_registrations`
5. 为每个集合配置相应的安全规则

## 头像功能说明

### 预设头像配置

预设头像配置位于 `miniprogram/config/avatar-presets.ts`，支持以下分类：
- **篮球经典**: 经典篮球动作 GIF
- **动漫卡通**: 篮球动漫角色
- **趣味表情**: 搞笑表情包

### 使用步骤

1. 准备 GIF 头像文件（建议尺寸 200x200，大小 < 500KB）
2. 上传到 CloudBase 云存储
3. 在云存储控制台获取文件的 HTTPS 链接
4. 将链接填入 `miniprogram/config/avatar-presets.ts` 对应头像的 `url` 字段
5. 重新编译小程序

### 技术限制

- 微信小程序 `<image>` 组件**支持播放 GIF**
- 支持格式：GIF、PNG、JPG
- 建议 GIF 大小控制在 **2MB 以内**，避免性能问题
- 不支持 APNG 格式
