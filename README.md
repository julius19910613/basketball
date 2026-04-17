# 篮球管理小程序（WeChat Mini Program + CloudBase）

业余篮球场景的小程序项目，覆盖 **球员管理** 与 **比赛分组** 两条核心链路：
- 球员：新增、列表、详情
- 比赛：创建比赛（多队名）-> 分组（草稿/继续编辑）-> 发布锁定

## 功能特性

- **球员管理**：支持 `PG/SG/SF/PF/C` 五个位置，录入昵称、真实姓名、年龄、身高、体重
- **比赛创建**：创建比赛时可输入至少两支球队名称，并选择参赛球员（最少 4 人）
- **分组工作流**：支持一键均衡分组 + 手动调整；可保存草稿并在比赛列表继续分组
- **发布锁定**：分组发布后状态变为 `finalized`，分组不可再修改
- **状态化列表**：比赛列表按 `draft` / `finalized` 分类展示
- **云端数据**：基于 CloudBase 文档数据库与云函数 `getOpenId`

## 技术栈

- 微信小程序原生开发（`miniprogram/`）
- 腾讯云 CloudBase（`wx.cloud.database()` + 云函数）
- Jest（单元/自测/E2E）

## 快速开始

### 1) 安装依赖

```bash
git clone https://github.com/julius19910613/basketball.git
cd basketball
npm install
```

### 2) 配置 CloudBase 环境

- 在 `miniprogram/app.js` 中设置你的云环境 ID（`wx.cloud.init({ env: "..." })`）
- 在微信开发者工具导入仓库根目录（包含 `project.config.json`）
- 部署云函数：`cloudfunctions/getOpenId`

### 3) 创建数据库集合

至少创建以下集合（名称需与代码一致）：
- `players`
- `matches`

如果缺少集合，会出现 `-502005`（集合不存在）错误。

## 数据模型（当前实现）

### `players`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `nickname` | string | 昵称 |
| `realName` | string | 真实姓名 |
| `position` | string | `PG` / `SG` / `SF` / `PF` / `C` |
| `age` | number | 年龄 |
| `height` | number | 身高（cm） |
| `weight` | number | 体重（kg） |
| `createdAt` | serverDate | 创建时间 |
| `updatedAt` | serverDate | 更新时间 |

### `matches`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `title` | string | 比赛标题 |
| `date` | string | 比赛日期 |
| `location` | string | 比赛地点 |
| `teamNames` | string[] | 队伍名称数组（>=2） |
| `selectedPlayerIds` | string[] | 参赛球员 ID（>=4） |
| `grouping` | object | 分组结构（各队球员 ID） |
| `status` | string | `draft` / `finalized` |
| `createdAt` | serverDate | 创建时间 |
| `updatedAt` | serverDate | 更新时间 |

## 页面结构

- `pages/index/index`：首页
- `pages/players/list/list`：球员列表
- `pages/players/create/create`：新增球员
- `pages/players/detail/detail`：球员详情
- `pages/match/list/list`：比赛列表（草稿/已完成）
- `pages/match/create/create`：创建比赛
- `pages/match/grouping/grouping`：分组编辑与发布
- `pages/match/detail/detail`：比赛详情
- `pages/profile/profile`：个人中心

## 脚本命令

- `npm test`：E2E 配置测试（`jest.e2e.config.js`）
- `npm run test:unit`：单元测试（`jest.config.js`）
- `npm run test:self`：球员模块自测（`tests/player-module.self-test.test.js`）
- `npm run test:e2e`：完整 E2E 套件

## 常见问题

- **报错 `-502005` / `DATABASE_COLLECTION_NOT_EXIST`**
  - 检查 `players`、`matches` 集合是否已创建
- **无法获取 `openid`**
  - 检查 `app.js` 云环境 ID 与 `getOpenId` 云函数是否在同一环境
- **已发布比赛无法继续改分组**
  - 这是预期行为：`finalized` 状态下分组不可变更

## 相关文档

- [微信小程序云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [CloudBase 官方文档](https://docs.cloudbase.net/)
- [DEPLOYMENT.md](./DEPLOYMENT.md)

## License

[MIT](./LICENSE)