# 🏀 篮球管理小程序

业余篮球球队的微信小程序，覆盖 **球员管理**、**比赛记录**、**智能分组** 与 **个人中心** 四条核心链路。

基于微信原生开发 + 腾讯云 CloudBase，零后端运维。

## 功能特性

### 球员管理
- 创建 / 编辑 / 删除球员，支持 `PG / SG / SF / PF / C` 五个位置
- 录入昵称、身高、体重、生日、综合评分
- 批量导入球员（云函数 `batchImportPlayers`）
- 下拉刷新 + 骨架屏加载

### 比赛记录
- 创建比赛（友谊赛 / 联赛 / 杯赛 / FIBA / NCAA）
- 逐节比分记录（4 节制）
- 球员数据统计（得分、篮板、助攻、抢断、盖帽、失误、犯规、投篮命中率）
- 比赛结果自动判定（胜 / 负 / 平）
- 比赛列表按时间倒序 + 分页加载

### 智能分组
- **按位置均衡分组**（2 队）：按篮球位置分桶，桶内暴力搜索最优解（≤14人），均衡身高 / 体重 / 综合评分
- **蛇形分组**（2~N 队）：按综合评分降序蛇形轮流分配
- 一键自动分组 + 手动拖拽调整
- 草稿保存，支持继续编辑
- 锁定后分组不可变更，参赛名单与球员比赛数据保持同步

### 个人中心
- 微信静默登录 + OpenID 识别
- 球员关联绑定
- 球衣号码 / 位置 / 身份信息展示

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | 微信小程序原生框架（WXML / WXSS / JS） |
| UI 组件 | [Vant Weapp](https://vant-ui.github.io/vant-weapp/) |
| 后端 | 腾讯云 CloudBase（`wx.cloud`） |
| 数据库 | CloudBase NoSQL 文档数据库 |
| 云函数 | Node.js（`getOpenId`、`batchImportPlayers`） |
| 测试 | Jest（单元测试 + E2E） |

## 项目结构

```
basketball/
├── miniprogram/                # 小程序前端
│   ├── app.js                  # CloudBase 初始化
│   ├── app.json                # 页面路由 & TabBar 配置
│   ├── app.wxss                # 全局样式（Coinbase Blue 主题）
│   ├── pages/
│   │   ├── index/              # 首页
│   │   ├── players/            # 球员（列表 / 新增 / 详情）
│   │   ├── match/              # 比赛（列表 / 创建 / 分组 / 详情）
│   │   └── profile/            # 个人中心
│   ├── components/             # 自定义组件
│   │   ├── player-card/        # 球员卡片
│   │   ├── player-stat-input/  # 数据录入组件
│   │   ├── group-animation/    # 分组动画
│   │   ├── skeleton/           # 骨架屏
│   │   └── toast/              # Toast 提示
│   ├── utils/                  # 工具函数
│   │   ├── match-helper.js     # 比赛工具（分组算法、数据计算）
│   │   ├── group-algorithm.js  # 分组算法
│   │   ├── db.js               # 数据库封装
│   │   └── basketball.js       # 篮球常量 & 工具
│   └── styles/                 # 样式文件
├── cloudfunctions/             # 云函数
│   ├── getOpenId/              # OpenID 获取
│   └── batchImportPlayers/     # 批量导入球员
├── scripts/                    # 脚本工具
│   └── import-players.js       # 球员数据导入脚本
├── tests/                      # 单元测试
├── e2e/                        # E2E 测试
├── docs/
│   ├── design-match-record.md  # 比赛记录功能设计
│   ├── automated-testing-guide.md  # 测试指南
│   └── archive/                # 归档文档（历史计划、报告）
├── package.json
├── jest.config.js
├── jest.e2e.config.js
├── project.config.json         # 微信开发者工具配置
├── DATABASE_SCHEMA.md          # 数据库设计
└── DEPLOYMENT.md               # 部署指南
```

## 快速开始

### 前置条件

- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- 已开通 [CloudBase](https://tcb.cloud.tencent.com/) 环境

### 1. 克隆 & 安装

```bash
git clone https://github.com/julius19910613/basketball.git
cd basketball
npm install
```

### 2. 导入项目

用微信开发者工具导入项目根目录（包含 `project.config.json`）。

### 3. 配置云环境

在 `miniprogram/app.js` 中设置你的云环境 ID：

```javascript
wx.cloud.init({
  env: 'your-env-id',  // 替换为你的 CloudBase 环境 ID
  traceUser: true,
});
```

### 4. 创建数据库集合

在 CloudBase 控制台依次创建：

| 集合 | 用途 |
|------|------|
| `users` | 用户信息 |
| `teams` | 球队信息 |
| `team_members` | 球队成员关系 |
| `players` | 球员档案 |
| `matches` | 比赛记录 |

详细字段说明见 [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)。

比赛记录状态约定：
- `draft`：待分组，可继续调整参赛名单与队伍分配
- `finalized`：分组已锁定，列表进入详情页

### 5. 部署云函数

在微信开发者工具中右键 `cloudfunctions/getOpenId` → **上传并部署：云端安装依赖**。

## 测试

```bash
npm test              # E2E 测试
npm run test:unit     # 单元测试
npm run test:self     # 球员模块自测
npm run test:e2e      # 完整 E2E 套件
```

## UI 主题

| Token | 色值 | 用途 |
|-------|------|------|
| `--primary-color` | `#1652F0` | 主色调 |
| `--secondary-color` | `#3B82F6` | 辅助色 |
| `--background` | `#F4F8FF` | 页面背景 |
| `--text-color` | `#0F172A` | 主文字 |
| `--light-text` | `#64748B` | 辅助文字 |

## 常见问题

| 问题 | 解决方案 |
|------|----------|
| 报错 `-502005` | 检查 `players`、`matches` 等集合是否已在 CloudBase 创建 |
| 无法获取 `openid` | 确认云环境 ID 与 `getOpenId` 云函数在同一环境 |
| 已锁定比赛无法改分组 | 预期行为：`isGroupingLocked=true` 后仅允许查看详情 |
| Vant 组件未生效 | 在微信开发者工具中执行「工具 → 构建 npm」 |

## 相关文档

- [微信小程序云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [CloudBase 官方文档](https://docs.cloudbase.net/)
- [Vant Weapp 文档](https://vant-ui.github.io/vant-weapp/)
- [部署指南](./DEPLOYMENT.md) · [数据库设计](./DATABASE_SCHEMA.md)

## License

[MIT](./LICENSE)
