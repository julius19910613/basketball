# 随机分组功能开发计划

## 文档信息
- **版本**: v1.1
- **创建日期**: 2026-02-26
- **最后更新**: 2026-02-26 07:45
- **作者**: AI Assistant
- **状态**: 规划阶段（已更新分组规则）

---

## 一、需求分析

### 1.1 需求背景
用户有20位固定球员，每次比赛需要将他们随机分组，生成不同的队伍进行比赛。

### 1.2 核心问题
通过分析现有系统和需求，我们需要明确以下几个关键问题：

#### 问题1: 球员来源
**推荐方案**: 使用现有球队的成员作为固定球员池
- **优点**: 
  - 无需新建数据结构
  - 球员已经属于同一个团队，便于管理
  - 符合实际使用场景（一个球队内部训练赛）
- **实现**: 在球队详情页添加"随机分组"功能入口

#### 问题2: 分组规则
**确定方案**: 固定分2队 + 能力档位平衡
- **分组数量**: 固定2队（A队 vs B队）
- **每队人数**: 10人/队（共20人参与）
- **能力档位**: 
  - **5档**（最强）：核心球员，领导能力强
  - **4档**：主力球员，技术全面
  - **3档**：常规球员，基本功扎实
  - **2档**（最弱）：新手或技术待提升
- **分组算法**: 
  - **平衡分组**（核心功能）：每个档位内随机均分到两队，确保两队实力平衡
  - **示例配置**：
    - A队：5档(1人) + 4档(2人) + 3档(4人) + 2档(3人) = 10人
    - B队：5档(1人) + 4档(2人) + 3档(4人) + 2档(3人) = 10人
  - **关键要求**: 两队各档位人数必须相同，实现能力平衡

#### 问题3: 分组时机
**推荐方案**: 比赛开始前手动触发
- **触发入口**: 
  - 球队详情页 → 随机分组按钮
  - 创建比赛时 → 选择"随机分组比赛"类型
- **结果展示**: 即时展示分组结果，支持重新分组
- **结果保存**: 可选择保存为一场比赛记录

---

## 二、功能设计

### 2.1 用户流程图

#### 流程1: 设置球员能力档位（队长操作）
```
队长进入球队详情
    ↓
点击"成员管理"
    ↓
点击"能力档位设置"
    ↓
【能力档位设置页面】
├─ 显示所有成员列表
├─ 每个成员可选择档位（5/4/3/2）
├─ 显示当前各档位人数统计
└─ 点击"保存"
    ↓
保存成功，返回成员管理
```

#### 流程2: 随机分组
```
用户进入球队详情
    ↓
点击"随机分组"按钮
    ↓
进入分组设置页面
    ↓
【选择分组参数】
├─ 显示参与球员列表（按档位分组显示）
├─ 显示各档位人数：5档(X人)、4档(X人)、3档(X人)、2档(X人)
├─ 选择参与球员（默认全部20人）
└─ 系统自动验证：各档位人数必须是偶数
    ↓
点击"开始分组"
    ↓
【分组结果页面】
├─ A队成员（按档位排序）
│   ├─ 5档：[球员1]
│   ├─ 4档：[球员2, 球员3]
│   ├─ 3档：[球员4, 球员5, 球员6, 球员7]
│   └─ 2档：[球员8, 球员9, 球员10]
├─ B队成员（按档位排序）
│   └─ (同样结构)
├─ 操作按钮：
│   ├─ 重新分组（不满意可重试）
│   ├─ 保存为比赛记录（可选）
│   └─ 分享结果（微信群）
└─ 返回球队详情
```

### 2.2 页面交互设计

#### 页面0: 能力档位设置页 (skill-level-settings)

**页面元素:**
```
┌─────────────────────────────────┐
│  ←  能力档位设置                │
├─────────────────────────────────┤
│                                 │
│  【档位说明】                   │
│  ● 5档 - 核心球员（最强）       │
│  ● 4档 - 主力球员               │
│  ● 3档 - 常规球员               │
│  ● 2档 - 新手球员（最弱）       │
│                                 │
│  【当前统计】                   │
│  5档: 2人 | 4档: 4人 |          │
│  3档: 8人 | 2档: 6人            │
│  总计: 20人                     │
│                                 │
│  【成员列表】                   │
│  ┌──────────────────────────┐  │
│  │ 张三  #23  [5▼]  PG      │  │
│  │ 李四  #10  [4▼]  SG      │  │
│  │ 王五  #7   [3▼]  C       │  │
│  │ 赵六  #11  [2▼]  SF      │  │
│  │ ... (滚动列表)            │  │
│  └──────────────────────────┘  │
│                                 │
│  ┌──────────────────────────┐  │
│  │      保存设置             │  │
│  └──────────────────────────┘  │
└─────────────────────────────────┘
```

**交互细节:**
1. 下拉选择档位（5/4/3/2）
2. 实时更新统计信息
3. 保存时验证是否满足分组要求（各档位为偶数）
4. 支持批量设置（可选）

#### 页面1: 分组设置页 (random-group-settings)

**页面元素:**
```
┌─────────────────────────────────┐
│  ←  随机分组                    │
├─────────────────────────────────┤
│                                 │
│  【球员档位分布】               │
│  ┌──────────────────────────┐  │
│  │ 5档: 2人 (每队1人)       │  │
│  │ 4档: 4人 (每队2人)       │  │
│  │ 3档: 8人 (每队4人)       │  │
│  │ 2档: 6人 (每队3人)       │  │
│  │ ─────────────────────    │  │
│  │ 总计: 20人 → 每队10人    │  │
│  └──────────────────────────┘  │
│                                 │
│  【参与球员】 (按档位分组)      │
│  ┌──────────────────────────┐  │
│  │ ▼ 5档 - 核心球员 (2人)   │  │
│  │   ☑ 张三  #23  PG        │  │
│  │   ☑ 李四  #10  SG        │  │
│  │                          │  │
│  │ ▼ 4档 - 主力球员 (4人)   │  │
│  │   ☑ 王五  #7   C         │  │
│  │   ☑ 赵六  #11  SF        │  │
│  │   ☑ 钱七  #9   PF        │  │
│  │   ☑ 孙八  #15  PG        │  │
│  │                          │  │
│  │ ... (3档、2档同理)        │  │
│  └──────────────────────────┘  │
│  [全选] [取消全选]             │
│                                 │
│  ⚠️ 提示：各档位人数必须是     │
│  偶数才能平衡分组               │
│                                 │
│  ┌──────────────────────────┐  │
│  │      开始分组             │  │
│  └──────────────────────────┘  │
└─────────────────────────────────┘
```

**交互细节:**
1. 默认全部成员参与，可手动取消勾选
2. 各档位可折叠/展开显示
3. **验证规则**：
   - 每个档位的参与人数必须是偶数
   - 至少需要2人才能分组
   - 如果某档位为奇数，显示警告并禁止分组
4. 点击"开始分组"显示 loading 动画

#### 页面2: 分组结果页 (random-group-result)

**页面元素:**
```
┌─────────────────────────────────┐
│  ←  分组结果                    │
├─────────────────────────────────┤
│                                 │
│  【A队】 白队 (10人)            │
│  ┌──────────────────────────┐  │
│  │ ★ 5档 (1人)              │  │
│  │   👤 张三  #23  PG        │  │
│  │                          │  │
│  │ ★ 4档 (2人)              │  │
│  │   👤 王五  #7   C         │  │
│  │   👤 赵六  #11  SF        │  │
│  │                          │  │
│  │ ★ 3档 (4人)              │  │
│  │   👤 孙八  #15  PG        │  │
│  │   👤 周九  #3   SG        │  │
│  │   👤 吴十  #12  PF        │  │
│  │   👤 郑一  #8   C         │  │
│  │                          │  │
│  │ ★ 2档 (3人)              │  │
│  │   👤 冯二  #5   SF        │  │
│  │   👤 陈三  #14  SG        │  │
│  │   👤 楚四  #6   PG        │  │
│  └──────────────────────────┘  │
│                                 │
│  【B队】 蓝队 (10人)            │
│  ┌──────────────────────────┐  │
│  │ ★ 5档 (1人)              │  │
│  │   👤 李四  #10  SG        │  │
│  │                          │  │
│  │ ★ 4档 (2人)              │  │
│  │   👤 钱七  #9   PF        │  │
│  │   👤 ...                  │  │
│  │                          │  │
│  │ ... (3档、2档同理)        │  │
│  └──────────────────────────┘  │
│                                 │
│  ┌──────────────────────────┐  │
│  │      重新分组             │  │
│  └──────────────────────────┘  │
│                                 │
│  [保存为比赛]  [分享结果]      │
└─────────────────────────────────┘
```

**交互细节:**
1. 自动生成队名（白队 vs 蓝队）
2. A队用浅灰背景，B队用浅蓝背景
3. **按档位分组显示**，5档最前，2档最后
4. 每个档位内按球衣号码排序
5. 用 ★ 或数字标记档位（5★, 4★, 3★, 2★）
6. 支持下拉刷新重新分组
7. 显示分组时间戳

### 2.3 数据结构设计

#### 集合1: users (扩展)
在现有 users 集合中添加能力档位字段

```javascript
{
  _id: String,
  _openid: String,
  nickName: String,
  avatarUrl: String,
  height: Number,
  weight: Number,
  positions: Array<String>,
  skills: Array<String>,
  skillLevel: Number,        // 新增: 能力档位 (5/4/3/2)
                             // 5=核心球员, 4=主力, 3=常规, 2=新手
  skillLevelUpdatedAt: Date, // 新增: 档位更新时间
  createdAt: Date,
  updatedAt: Date
}
```

#### 集合2: teams (扩展)
在 teams 集合的 members 数组中添加能力档位

```javascript
{
  // ... 现有字段
  members: [
    {
      userId: String,
      role: String,
      number: Number,
      joinedAt: Date,
      skillLevel: Number      // 新增: 该成员在球队中的能力档位
    }
  ]
}
```
#### 集合3: random_groups (新增)
存储随机分组记录

```javascript
{
  _id: String,              // 记录ID
  teamId: String,           // 球队ID
  groupId: String,          // 分组批次ID (用于区分多次分组)
  algorithm: String,        // 分组算法: 'balanced' (固定值)
  totalMembers: Number,     // 参与分组总人数
  groups: [                 // 分组结果
    {
      teamName: String,     // 队名: "白队"
      teamColor: String,    // 队伍颜色: "#FFFFFF"
      members: [            // 成员列表（按档位组织）
        {
          userId: String,   // 用户openid
          number: Number,   // 球衣号码
          name: String,     // 姓名
          avatar: String,   // 头像
          skillLevel: Number // 能力档位
        }
      ],
      // 按档位统计
      skillDistribution: {
        level5: Number,     // 5档人数
        level4: Number,     // 4档人数
        level3: Number,     // 3档人数
        level2: Number      // 2档人数
      }
    }
  ],
  // 参与分组的球员档位分布
  skillSummary: {
    level5: Number,         // 5档总人数
    level4: Number,         // 4档总人数
    level3: Number,         // 3档总人数
    level2: Number          // 2档总人数
  },
  createdBy: String,        // 创建者openid
  createdAt: Date,          // 创建时间
  matchId: String          // 关联的比赛ID (可选)
}
```

#### 集合2: matches (扩展)
在现有 matches 集合中增加字段支持随机分组比赛

```javascript
{
  // ... 现有字段保持不变
  matchType: String,        // 新增: 'Friendly' | 'League' | 'RandomGroup'
  groupId: String,          // 新增: 关联的随机分组ID (如果是随机分组比赛)
}
```

---

## 三、技术方案

### 3.1 数据库集合设计

#### 新增集合
1. **random_groups**: 随机分组记录集合

**安全规则:**
```json
{
  "read": true,
  "write": "doc.createdBy == auth.openid"
}
```

#### 扩展现有集合
1. **matches**: 添加 `matchType` 和 `groupId` 字段

### 3.2 API/云函数设计

#### 云函数1: updateSkillLevel
**路径**: `cloudfunctions/updateSkillLevel/index.js`

**功能**: 更新球员能力档位

**输入参数:**
```javascript
{
  teamId: String,        // 球队ID
  userId: String,        // 用户openid
  skillLevel: Number     // 能力档位 (5/4/3/2)
}
```

**输出结果:**
```javascript
{
  success: Boolean,
  message: String
}
```

**实现逻辑:**
```javascript
const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  const { teamId, userId, skillLevel } = event;
  
  // 验证档位范围
  if (![5, 4, 3, 2].includes(skillLevel)) {
    return { success: false, message: '无效的能力档位' };
  }
  
  try {
    // 更新 teams 集合中的 members 数组
    await db.collection('teams').doc(teamId).update({
      data: {
        members: db.command.pull({ userId }) // 先移除
      }
    });
    
    // 再添加回去（带新的档位）
    const team = await db.collection('teams').doc(teamId).get();
    const memberIndex = team.data.members.findIndex(m => m.userId === userId);
    
    if (memberIndex === -1) {
      return { success: false, message: '未找到该成员' };
    }
    
    team.data.members[memberIndex].skillLevel = skillLevel;
    
    await db.collection('teams').doc(teamId).update({
      data: {
        members: team.data.members
      }
    });
    
    // 同时更新 users 集合
    await db.collection('users').where({
      _openid: userId
    }).update({
      data: {
        skillLevel: skillLevel,
        skillLevelUpdatedAt: db.serverDate()
      }
    });
    
    return { success: true, message: '更新成功' };
  } catch (err) {
    console.error(err);
    return { success: false, message: '更新失败' };
  }
};
```

#### 云函数2: balancedGroup
**路径**: `cloudfunctions/balancedGroup/index.js`

**功能**: 执行档位平衡分组算法

**输入参数:**
```javascript
{
  teamId: String,        // 球队ID
  memberIds: [String]    // 参与分组的成员ID列表（可选，默认全部成员）
}
```

**输出结果:**
```javascript
{
  success: Boolean,
  groupId: String,       // 分组批次ID
  groups: [              // 分组结果（2个队伍）
    {
      teamName: String,  // "白队"
      teamColor: String, // "#FFFFFF"
      members: [
        {
          userId: String,
          name: String,
          avatar: String,
          number: Number,
          skillLevel: Number
        }
      ],
      skillDistribution: {
        level5: Number,
        level4: Number,
        level3: Number,
        level2: Number
      }
    },
    // B队...
  ],
  skillSummary: {        // 总体档位分布
    level5: Number,
    level4: Number,
    level3: Number,
    level2: Number
  },
  message: String
}
```

**算法实现:**

1. **纯随机算法 (V1)**
```javascript
function randomShuffle(members) {
  // Fisher-Yates 洗牌算法
  for (let i = members.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [members[i], members[j]] = [members[j], members[i]];
  }
  return members;
}

function splitIntoTeams(members, teamCount) {
  const shuffled = randomShuffle([...members]);
  const teams = [];
  const teamSize = Math.floor(members.length / teamCount);
  
  for (let i = 0; i < teamCount; i++) {
    teams.push(shuffled.slice(i * teamSize, (i + 1) * teamSize));
  }
  
  return teams;
}
```

2. **平衡分组算法 (V2 - 后续实现)**
```javascript
function balancedSplit(members, teamCount) {
  // 基于球员能力值进行平衡分组
  // 使用贪心算法：轮流选人，每次选能力值最高的
  
  // 1. 按能力值降序排序
  const sorted = members.sort((a, b) => b.rating - a.rating);
  
  // 2. 轮流选人（蛇形选人法）
  const teams = Array.from({length: teamCount}, () => []);
  let teamIndex = 0;
  let direction = 1;
  
  for (const member of sorted) {
    teams[teamIndex].push(member);
    
    teamIndex += direction;
    if (teamIndex >= teamCount || teamIndex < 0) {
      direction *= -1;
      teamIndex += direction;
    }
  }
  
  return teams;
}
```

#### 前端API封装
**文件**: `miniprogram/utils/group-api.js`

```javascript
/**
 * 更新球员能力档位
 */
export async function updateSkillLevel(teamId, userId, skillLevel) {
  return await wx.cloud.callFunction({
    name: 'updateSkillLevel',
    data: { teamId, userId, skillLevel }
  });
}

/**
 * 执行档位平衡分组
 */
export async function performBalancedGroup(teamId, memberIds = null) {
  return await wx.cloud.callFunction({
    name: 'balancedGroup',
    data: { teamId, memberIds }
  });
}

/**
 * 保存分组记录
 */
export async function saveGroupResult(groupData) {
  const db = wx.cloud.database();
  return await db.collection('random_groups').add({ data: groupData });
}

/**
 * 获取历史分组记录
 */
export async function getGroupHistory(teamId, limit = 20) {
  const db = wx.cloud.database();
  return await db.collection('random_groups')
    .where({ teamId })
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
}

/**
 * 获取球员档位统计
 */
export async function getSkillLevelStats(teamId) {
  const db = wx.cloud.database();
  const _ = db.command;
  
  const teamRes = await db.collection('teams').doc(teamId).get();
  const members = teamRes.data.members || [];
  
  const stats = {
    level5: 0,
    level4: 0,
    level3: 0,
    level2: 0,
    unset: 0
  };
  
  members.forEach(member => {
    const level = member.skillLevel || 3;
    if (stats.hasOwnProperty(`level${level}`)) {
      stats[`level${level}`]++;
    } else {
      stats.unset++;
    }
  });
  
  return stats;
}
```

### 3.3 分组算法设计

#### 核心算法: 档位平衡分组

**算法原理**:
1. 按档位分组球员（5/4/3/2档）
2. 每个档位内随机洗牌
3. 每个档位均分到两队，确保平衡

**代码实现**:

```javascript
/**
 * 档位平衡分组算法
 * @param {Array} members - 参与分组的成员列表，每个成员包含 skillLevel 字段
 * @returns {Object} - 分组结果 { teamA, teamB }
 */
function balancedGroupBySkillLevel(members) {
  // 1. 验证各档位人数是否为偶数
  const skillGroups = {
    5: [], // 核心球员
    4: [], // 主力球员
    3: [], // 常规球员
    2: []  // 新手球员
  };
  
  // 2. 按档位分组
  members.forEach(member => {
    const level = member.skillLevel || 3; // 默认3档
    if (skillGroups[level]) {
      skillGroups[level].push(member);
    }
  });
  
  // 3. 验证每个档位是否为偶数
  for (let level = 5; level >= 2; level--) {
    const count = skillGroups[level].length;
    if (count % 2 !== 0) {
      throw new Error(`${level}档人数为${count}（奇数），无法平衡分组`);
    }
  }
  
  // 4. 初始化两队
  const teamA = [];
  const teamB = [];
  
  // 5. 对每个档位进行随机均分
  for (let level = 5; level >= 2; level--) {
    const group = skillGroups[level];
    
    // Fisher-Yates 洗牌算法
    for (let i = group.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [group[i], group[j]] = [group[j], group[i]];
    }
    
    // 均分到两队
    const half = group.length / 2;
    teamA.push(...group.slice(0, half));
    teamB.push(...group.slice(half));
  }
  
  // 6. 按档位和球衣号码排序
  const sortBySkillAndNumber = (a, b) => {
    if (b.skillLevel !== a.skillLevel) {
      return b.skillLevel - a.skillLevel; // 5档优先
    }
    return a.number - b.number; // 号码从小到大
  };
  
  teamA.sort(sortBySkillAndNumber);
  teamB.sort(sortBySkillAndNumber);
  
  return { teamA, teamB };
}

/**
 * 生成队伍统计信息
 */
function generateSkillDistribution(members) {
  return {
    level5: members.filter(m => m.skillLevel === 5).length,
    level4: members.filter(m => m.skillLevel === 4).length,
    level3: members.filter(m => m.skillLevel === 3).length,
    level2: members.filter(m => m.skillLevel === 2).length
  };
}
```

**算法示例**:

假设有20位球员：
- 5档：2人（张三、李四）
- 4档：4人（王五、赵六、钱七、孙八）
- 3档：8人（周九、吴十、郑一、冯二、陈三、楚四、魏五、蒋六）
- 2档：6人（沈七、韩八、杨九、朱十、秦一、许二）

**执行步骤**:
1. 5档洗牌 → [张三, 李四] → A队:张三, B队:李四
2. 4档洗牌 → [赵六, 孙八, 王五, 钱七] → A队:赵六+孙八, B队:王五+钱七
3. 3档洗牌 → [...] → A队:4人, B队:4人
4. 2档洗牌 → [...] → A队:3人, B队:3人

**最终结果**:
- A队：1个5档 + 2个4档 + 4个3档 + 3个2档 = 10人
- B队：1个5档 + 2个4档 + 4个3档 + 3个2档 = 10人

两队各档位人数完全相同，实力平衡！

---

## 四、开发任务拆分

### 4.1 任务列表

#### Phase 1: 核心功能 (P0 - 优先实现)

| 任务ID | 任务名称 | 预估工时 | 依赖 | 优先级 |
|--------|---------|---------|------|--------|
| T0 | 数据库字段扩展（users, teams） | 1h | - | P0 |
| T1 | 创建 random_groups 数据库集合 | 0.5h | - | P0 |
| T2 | 开发 updateSkillLevel 云函数 | 2h | T0 | P0 |
| T3 | 开发 balancedGroup 云函数 | 3h | T0, T1 | P0 |
| T4 | 创建能力档位设置页面 (UI) | 3h | - | P0 |
| T5 | 实现能力档位设置页面逻辑 | 3h | T2, T4 | P0 |
| T6 | 创建分组设置页面 (UI) | 3h | - | P0 |
| T7 | 实现分组设置页面逻辑 | 4h | T3, T6 | P0 |
| T8 | 创建分组结果页面 (UI) | 3h | - | P0 |
| T9 | 实现分组结果页面逻辑 | 3h | T8 | P0 |
| T10 | 球队详情页添加入口 | 1h | - | P0 |
| T11 | 成员管理页添加"能力设置"入口 | 1h | - | P0 |
| T12 | 测试和调试 | 3h | T0-T11 | P0 |

**Phase 1 总计**: 26.5小时

#### Phase 2: 增强功能 (P1 - 后续优化)

| 任务ID | 任务名称 | 预估工时 | 依赖 | 优先级 |
|--------|---------|---------|------|--------|
| T13 | 添加分组历史记录页面 | 3h | - | P1 |
| T14 | 实现保存为比赛功能 | 3h | T9 | P1 |
| T15 | 添加分享功能 | 2h | T9 | P1 |
| T16 | 添加档位统计可视化 | 2h | T5 | P1 |
| T17 | 支持批量设置档位 | 2h | T5 | P1 |
| T18 | 添加档位调整建议 | 3h | T2, T16 | P1 |
| T19 | 测试和优化 | 2h | T13-T18 | P1 |

**Phase 2 总计**: 17小时

#### Phase 3: 高级功能 (P2 - 未来规划)

| 任务ID | 任务名称 | 预估工时 | 依赖 | 优先级 |
|--------|---------|---------|------|--------|
| T20 | AI推荐最佳档位分配 | 6h | T2, T18 | P2 |
| T21 | 支持自定义分组规则 | 4h | T7 | P2 |
| T22 | 分组效果数据分析 | 4h | T13 | P2 |
| T23 | 支持多队分组（3队、4队） | 4h | T3 | P2 |

**Phase 3 总计**: 18小时

### 4.2 开发时间线

```
Week 1 (Phase 1 核心功能 - Part 1)
├─ Day 1: T0-T2 (数据库扩展 + updateSkillLevel云函数)
├─ Day 2: T3-T5 (balancedGroup云函数 + 能力档位设置页面)
└─ Day 3: T6-T7 (分组设置页面)

Week 2 (Phase 1 核心功能 - Part 2)
├─ Day 1-2: T8-T9 (分组结果页面)
├─ Day 3: T10-T11 (入口按钮)
└─ Day 4-5: T12 (测试和调试)

Week 3-4 (Phase 2 增强功能)
├─ Week 3: T13-T15 (历史记录、保存比赛、分享)
└─ Week 4: T16-T19 (档位统计、批量设置、优化)

Week 5+ (Phase 3 高级功能)
└─ 根据用户反馈和需求优先级决定
```

### 4.3 依赖关系图

```
T0 (数据库扩展)
 ├─→ T2 (updateSkillLevel云函数)
 │    └─→ T5 (能力设置页面逻辑)
 │         ├─→ T16 (档位统计可视化)
 │         └─→ T17 (批量设置)
 │
 └─→ T3 (balancedGroup云函数)
      └─→ T7 (分组设置页面逻辑)
           └─→ T9 (分组结果页面逻辑)
                ├─→ T14 (保存为比赛)
                └─→ T15 (分享功能)

T1 (random_groups集合) ──┘

T4 (能力设置页面UI) ──→ T5
T6 (分组设置页面UI) ──→ T7
T8 (分组结果页面UI) ──→ T9

T10 (球队详情入口) ──→ T7
T11 (成员管理入口) ──→ T5

T12 (测试) ──依赖── 所有任务

T13 (历史记录) ──→ T22 (数据分析)
T18 (档位建议) ──→ T20 (AI推荐)
```

---

## 五、UI/UX 建议

### 5.1 设计原则

1. **简洁直观**: 一键分组，减少用户操作步骤
2. **结果可视化**: 清晰展示分组结果，不同队伍用颜色区分
3. **快速重试**: 不满意可立即重新分组
4. **趣味性**: 添加动画效果，增加使用乐趣

### 5.2 页面布局草图

#### 球队详情页入口
```
┌─────────────────────────────────┐
│  球队详情                        │
│  [队徽] 湖人队                   │
│  成员: 20人                      │
│                                  │
│  【快捷操作】                    │
│  [成员管理] [随机分组] ← 新增    │
└─────────────────────────────────┘
```

#### 分组动画效果
```
分组中...
┌─────────────────────────────────┐
│                                  │
│      🏀  分组进行中...           │
│                                  │
│   [球员卡片飞舞动画]             │
│                                  │
│      ⏳  请稍候                  │
│                                  │
└─────────────────────────────────┘
```

### 5.3 交互流程优化

#### 快速分组模式
```
球队详情 → 长按"随机分组" → 直接生成2队随机分组
```

#### 高级分组模式
```
球队详情 → 点击"随机分组" → 进入设置页面 → 自定义参数 → 分组
```

### 5.4 视觉设计建议

#### 色彩方案
```css
/* 主题色 */
--primary-color: #FF6B35;      /* 橙色 - 保留现有 */
--success-color: #4CAF50;      /* 绿色 */

/* 队伍颜色 */
--team-white: #FFFFFF;
--team-blue: #2196F3;
--team-red: #F44336;
--team-yellow: #FFEB3B;

/* 队伍卡片背景 */
--team-white-bg: #F5F5F5;
--team-blue-bg: #E3F2FD;
--team-red-bg: #FFEBEE;
--team-yellow-bg: #FFF9C4;
```

#### 动画效果
1. **分组动画** (1.5秒)
   - 球员卡片随机飞舞
   - 卡片按队伍聚合
   - 队伍颜色渐显

2. **重新分组** (0.5秒)
   - 淡出当前结果
   - 显示分组中动画
   - 淡入新结果

3. **保存成功**
   - ✅ 对勾动画
   - 轻微震动反馈

### 5.5 响应式设计

#### 参与球员列表
```wxss
/* 单列显示（小屏） */
.player-list {
  display: flex;
  flex-direction: column;
}

/* 双列显示（大屏） */
@media (min-width: 750rpx) {
  .player-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20rpx;
  }
}
```

---

## 六、测试计划

### 6.1 功能测试用例

| 测试ID | 测试场景 | 预期结果 | 优先级 |
|--------|---------|---------|--------|
| TC1 | 设置球员能力档位 | 成功更新到数据库 | P0 |
| TC2 | 各档位为偶数时分组 | 成功分组，两队平衡 | P0 |
| TC3 | 某档位为奇数时分组 | 提示错误，无法分组 | P0 |
| TC4 | 20人分组（5档2人、4档4人、3档8人、2档6人） | A队10人、B队10人，各档位人数相同 | P0 |
| TC5 | 未设置档位的球员 | 默认为3档 | P0 |
| TC6 | 重复分组 | 每次结果不同，但档位分布相同 | P0 |
| TC7 | 部分成员参与 | 仅对勾选成员分组，验证档位为偶数 | P1 |
| TC8 | 查看分组历史 | 显示历史分组记录，包含档位分布 | P1 |
| TC9 | 保存分组为比赛 | 成功创建比赛记录 | P1 |
| TC10 | 分享分组结果 | 成功分享到微信，显示完整信息 | P1 |
| TC11 | 批量设置档位 | 一次性设置多个球员档位 | P1 |
| TC12 | 档位统计可视化 | 图表显示各档位人数分布 | P1 |
| TC13 | 所有球员同一档位 | 仍可分组（纯随机） | P2 |
| TC14 | 极端情况（只有2人） | 提示至少需要4人（每队2人） | P2 |

### 6.2 性能测试

- **分组速度**: 100人分组 < 1秒
- **页面加载**: 首屏加载 < 2秒
- **动画流畅度**: 60 FPS

### 6.3 兼容性测试

- iOS 微信版本: 8.0+
- Android 微信版本: 8.0+
- 不同屏幕尺寸适配

---

## 七、风险和注意事项

### 7.1 技术风险

1. **云函数冷启动**: 首次调用可能有延迟
   - **缓解措施**: 添加 loading 动画，优化用户体验

2. **随机算法质量**: 纯随机可能导致不公平
   - **缓解措施**: 提供重新分组功能，后续实现平衡算法

3. **数据一致性**: 并发分组可能导致冲突
   - **缓解措施**: 使用事务或乐观锁

### 7.2 用户体验风险

1. **分组结果不满意**: 用户可能频繁重新分组
   - **缓解措施**: 添加分组次数限制或冷却时间

2. **误操作**: 用户误触"重新分组"
   - **缓解措施**: 添加确认弹窗

### 7.3 数据风险

1. **历史数据丢失**: 用户删除分组记录
   - **缓解措施**: 软删除机制，保留30天

---

## 八、后续迭代方向

### 8.1 短期优化 (1-2个月)

1. **平衡分组算法**: 基于球员能力值智能分组
2. **分组历史**: 记录历史分组，查看统计
3. **保存为比赛**: 一键创建比赛记录
4. **分享功能**: 分享分组结果到微信群

### 8.2 中期扩展 (3-6个月)

1. **智能推荐**: AI分析历史数据，推荐最佳分组
2. **队长保护**: 确保每个队伍至少有1个核心球员
3. **自定义规则**: 支持更多分组规则配置
4. **数据分析**: 分组效果分析，胜率统计

### 8.3 长期规划 (6个月+)

1. **训练模式**: 支持多种训练场景的分组
2. **联赛模式**: 结合联赛系统自动分组
3. **AI教练**: AI助手推荐战术和阵容
4. **社交功能**: 分组PK，好友挑战

---

## 九、附录

### 9.1 能力档位标准

| 档位 | 名称 | 标识 | 描述 | 典型特征 |
|------|------|------|------|---------|
| 5档 | 核心球员 | ★★★★★ | 球队领袖，技术全面 | 得分能力强，组织能力好，关键时刻靠谱 |
| 4档 | 主力球员 | ★★★★ | 技术扎实，稳定输出 | 各项基本功扎实，有特长技能 |
| 3档 | 常规球员 | ★★★ | 基本功扎实 | 能正常参与比赛，技术均衡 |
| 2档 | 新手球员 | ★★ | 初学者或技术待提升 | 基本功一般，需要更多练习 |

**档位调整建议**:
- 新成员默认设为3档
- 每季度根据比赛表现调整档位
- 队长和副队长通常为4档或5档
- 档位应尽量使各档人数为偶数，便于平衡分组

### 9.2 分组验证规则

**必须满足的条件**:
1. 参与总人数必须是偶数（≥4人）
2. 每个档位的参与人数必须是偶数
3. 至少有2个不同的档位有球员

**错误提示示例**:
- "5档人数为3（奇数），无法平衡分组"
- "参与人数为奇数，无法平均分配到两队"
- "请至少选择4位球员进行分组"

### 9.3 相关文档
- [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md) - 数据库设计
- [README.md](../README.md) - 项目说明
- [产品功能设计.md](../产品功能设计.md) - 产品功能文档

### 9.2 参考资源
- [微信小程序云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [CloudBase 文档](https://docs.cloudbase.net/)
- [Fisher-Yates 洗牌算法](https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle)

### 9.5 开发检查清单

#### Phase 1 完成标准
- [ ] 数据库字段扩展完成（users.skillLevel, teams.members[].skillLevel）
- [ ] random_groups 集合创建完成
- [ ] updateSkillLevel 云函数部署并测试通过
- [ ] balancedGroup 云函数部署并测试通过
- [ ] 能力档位设置页面UI完成
- [ ] 能力档位设置页面逻辑完成（更新档位、统计）
- [ ] 分组设置页面UI完成
- [ ] 分组设置页面逻辑完成（验证、调用云函数）
- [ ] 分组结果页面UI完成
- [ ] 分组结果页面逻辑完成（展示、重分组）
- [ ] 球队详情页入口添加完成
- [ ] 成员管理页入口添加完成
- [ ] 基础功能测试通过（档位设置、平衡分组）
- [ ] 代码提交并合并到主分支
- [ ] 文档更新完成

#### Phase 2 完成标准
- [ ] 分组历史记录页面完成
- [ ] 保存为比赛功能完成
- [ ] 分享功能完成
- [ ] 档位统计可视化完成
- [ ] 批量设置档位功能完成
- [ ] 档位调整建议功能完成
- [ ] 增强功能测试通过
- [ ] 用户反馈收集和优化

---

**文档结束**

如有疑问或建议，请联系开发团队。
