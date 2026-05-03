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

## 5. match_records 比赛记录集合

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
> 注：比赛数据建议仅允许创建者或管理员写入，可通过云函数验证权限。

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
   - `match_records`
5. 为每个集合配置相应的安全规则

## 头像功能说明

### 预设头像配置

预设头像配置位于 `miniprogram/config/avatar-presets.js`，支持以下分类：
- **篮球经典**: 经典篮球动作 GIF
- **动漫卡通**: 篮球动漫角色
- **趣味表情**: 搞笑表情包

### 使用步骤

1. 准备 GIF 头像文件（建议尺寸 200x200，大小 < 500KB）
2. 上传到 CloudBase 云存储
3. 在云存储控制台获取文件的 HTTPS 链接
4. 将链接填入 `miniprogram/config/avatar-presets.js` 对应头像的 `url` 字段
5. 重新编译小程序

### 技术限制

- 微信小程序 `<image>` 组件**支持播放 GIF**
- 支持格式：GIF、PNG、JPG
- 建议 GIF 大小控制在 **2MB 以内**，避免性能问题
- 不支持 APNG 格式