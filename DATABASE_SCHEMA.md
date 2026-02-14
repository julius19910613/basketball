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
| `type` | String | 比赛类型 ('Friendly' / 'League') |
| `status` | String | 状态 ('scheduled' / 'ongoing' / 'finished') |
| `homeTeamId` | String | 主队 ID |
| `homeTeam` | Object | 主队信息快照 {_id, name, logo} |
| `awayTeamId` | String | 客队 ID (可选) |
| `awayTeam` | Object | 客队信息快照 (可选) |
| `startTime` | Date | 比赛开始时间 |
| `location` | Object | 比赛地点 {name, latitude?, longitude?} |
| `homeScore` | Number | 主队得分 |
| `awayScore` | Number | 客队得分 |
| `createdAt` | Date | 创建时间 |

**安全规则**:
```json
{
  "read": true,
  "write": true
}
```

---

## 创建步骤

1. 登录 [CloudBase 控制台](https://tcb.cloud.tencent.com)
2. 选择您的环境
3. 进入 **数据库** 模块
4. 点击 **新建集合**，依次创建:
   - `users`
   - `teams`
   - `matches`
5. 为每个集合配置相应的安全规则
