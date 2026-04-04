# 随机分组功能 - 关键更新总结

## 📋 核心需求变更

### 原方案
- 支持多队分组（2/3/4队）
- 纯随机分组算法
- 无能力档位概念

### **新方案（已更新）**
- **固定2队**（A队 vs B队）
- **档位平衡分组**（核心功能）
- **4级能力档位**（5/4/3/2档）

---

## 🎯 新增核心功能

### 1. 能力档位系统

#### 档位定义
| 档位 | 名称 | 人数示例 | 特征 |
|------|------|---------|------|
| 5档 | 核心球员 | 2人 | 队长、得分手、组织核心 |
| 4档 | 主力球员 | 4人 | 技术全面、稳定输出 |
| 3档 | 常规球员 | 8人 | 基本功扎实（默认） |
| 2档 | 新手球员 | 6人 | 初学者、待提升 |

#### 实现要点
```javascript
// 数据库字段
users.skillLevel: Number       // 5/4/3/2
teams.members[].skillLevel: Number

// 默认值
未设置档位 → 自动设为3档
```

### 2. 档位平衡分组算法

#### 核心逻辑
```
1. 按档位分组球员（5/4/3/2档）
2. 每个档位内随机洗牌（Fisher-Yates）
3. 每个档位均分到两队
4. 按档位+号码排序展示
```

#### 关键规则
- ✅ 每个档位人数**必须是偶数**
- ✅ 参与总人数**必须是偶数**
- ✅ 至少需要**4人**才能分组

#### 示例配置
```
20人参与分组：
- 5档: 2人 → 每队1人
- 4档: 4人 → 每队2人
- 3档: 8人 → 每队4人
- 2档: 6人 → 每队3人
= 每队10人，实力完全平衡！
```

---

## 🆕 新增页面

### 1. 能力档位设置页
**路径**: `pages/skill-level-settings/skill-level-settings`

**功能**:
- 显示所有成员列表
- 为每个成员选择档位（下拉选择：5/4/3/2）
- 实时显示档位统计
- 保存档位设置

**入口**: 成员管理页 → "能力档位设置"按钮

### 2. 分组设置页（已更新）
**路径**: `pages/random-group-settings/random-group-settings`

**更新点**:
- 按档位分组显示球员（可折叠）
- 显示各档位人数统计
- 验证各档位是否为偶数
- 自动计算每队配置

### 3. 分组结果页（已更新）
**路径**: `pages/random-group-result/random-group-result`

**更新点**:
- 按档位分组显示成员
- 用★标记档位（★★★★★）
- 显示各档位人数统计
- 展示平衡性验证

---

## 🗄️ 数据库变更

### 新增字段
```javascript
// users 集合
{
  skillLevel: Number,           // 新增: 能力档位 (5/4/3/2)
  skillLevelUpdatedAt: Date     // 新增: 档位更新时间
}

// teams 集合（members 数组）
members: [{
  userId: String,
  role: String,
  number: Number,
  joinedAt: Date,
  skillLevel: Number           // 新增: 该成员的能力档位
}]

// random_groups 集合（新增）
{
  _id: String,
  teamId: String,
  groupId: String,
  algorithm: 'balanced',        // 固定值
  groups: [{
    teamName: String,
    teamColor: String,
    members: [{
      skillLevel: Number        // 新增: 成员档位
    }],
    skillDistribution: {        // 新增: 档位分布
      level5: Number,
      level4: Number,
      level3: Number,
      level2: Number
    }
  }],
  skillSummary: {               // 新增: 总体档位统计
    level5: Number,
    level4: Number,
    level3: Number,
    level2: Number
  }
}
```

---

## ☁️ 云函数变更

### 新增云函数
#### 1. updateSkillLevel
**功能**: 更新球员能力档位

```javascript
// 输入
{
  teamId: String,
  userId: String,
  skillLevel: Number  // 5/4/3/2
}

// 输出
{
  success: Boolean,
  message: String
}
```

#### 2. balancedGroup（替代原 randomGroup）
**功能**: 执行档位平衡分组

```javascript
// 输入
{
  teamId: String,
  memberIds: [String]  // 可选，默认全部成员
}

// 输出
{
  success: Boolean,
  groupId: String,
  groups: [...],         // 两队分组结果
  skillSummary: {...},   // 档位统计
  message: String
}
```

---

## 📊 开发任务调整

### Phase 1 新增任务
| 任务 | 说明 | 工时 |
|------|------|------|
| T0 | 数据库字段扩展 | 1h |
| T2 | updateSkillLevel云函数 | 2h |
| T4 | 能力档位设置页面UI | 3h |
| T5 | 能力档位设置页面逻辑 | 3h |
| T11 | 成员管理入口 | 1h |

**Phase 1 总工时**: 20.5h → **26.5h** (+6h)

### 优先级调整
- **P0（最高）**: 档位设置 + 平衡分组（核心功能）
- **P1（次要）**: 历史记录、保存比赛、分享
- **P2（未来）**: AI推荐、自定义规则

---

## 🎨 UI/UX 更新

### 视觉标识
```
5档: ★★★★★ (红色/金色)
4档: ★★★★   (蓝色)
3档: ★★★     (绿色)
2档: ★★       (灰色)
```

### 展示逻辑
1. **分组设置页**: 按档位折叠显示，可展开/收起
2. **分组结果页**: 按档位排序（5档最前，2档最后）
3. **成员卡片**: 显示档位星级标识

### 验证提示
```
✓ 可以分组: "档位分布均衡，可以进行平衡分组"
✗ 无法分组: "5档人数为3（奇数），无法平衡分组"
```

---

## ✅ 验证测试用例

| 场景 | 输入 | 预期结果 |
|------|------|---------|
| 正常分组 | 20人（各档位偶数） | ✓ 成功分组 |
| 档位奇数 | 5档3人 | ✗ 提示错误 |
| 总人数奇数 | 19人 | ✗ 提示错误 |
| 人数过少 | 2人 | ✗ 至少4人 |
| 未设档位 | 某成员无档位 | → 默认3档 |

---

## 📝 代码示例

详细算法实现请参考:
- `/docs/random-group-algorithm-example.js` - 完整算法示例
- `/docs/random-team-feature-plan.md` - 完整开发计划

---

## 🚀 下一步行动

### 立即开始（Week 1）
1. 扩展数据库字段（users, teams）
2. 开发 updateSkillLevel 云函数
3. 创建能力档位设置页面
4. 开发 balancedGroup 云函数

### 测试验收标准
- [ ] 可以设置和更新球员档位
- [ ] 档位统计显示正确
- [ ] 平衡分组算法验证通过
- [ ] 两队各档位人数完全相同
- [ ] 分组结果展示清晰

---

**文档版本**: v1.1  
**更新日期**: 2026-02-26  
**变更类型**: 需求重大更新
