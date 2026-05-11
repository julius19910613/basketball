# JS→TS 迁移计划

## 目标与范围

- 目标：将当前微信小程序项目从 JavaScript 渐进迁移到 TypeScript，优先降低公共模块、工具函数、页面逻辑、云函数与测试代码的动态类型风险。
- 现状：共 `61` 个 `.js` 文件，约 `8,187` 行。
- 技术栈：微信小程序（`wx` API）+ 微信云开发（`wx-server-sdk`）+ Jest（`unit/page/component/e2e` 四套配置）+ Node 脚本。
- 约束：
  - `package.json` 为 `commonjs`，迁移阶段继续保持 CommonJS 兼容。
  - 不一次性全量改造，采用分批迁移、每批 `1-3` 个文件。
  - 优先保证公共模块、算法和数据层先稳定，再进入页面与测试。

## 迁移原则

- 先基础设施，后业务文件：先落地 `TypeScript` 编译体系、声明文件与目录结构，再迁移业务代码。
- 先低耦合，后高耦合：先迁移无界面依赖、低上下文共享的文件，再处理页面与组件。
- 先类型边界，后内部精化：先把函数签名、返回值、数据模型、`wx`/云开发接口边界声明出来，再逐步收紧内部实现类型。
- 允许过渡型写法：早期可使用 `unknown`、索引签名、可选属性、类型断言，但必须优先避免 `any` 扩散。
- 编译与测试并行：每一批迁移后都应执行最小验证，确保类型正确与行为未回归。

## 前置任务

### 1. 安装 TypeScript 相关依赖

- 安装 `typescript`
- 安装 `ts-jest`
- 安装 `@types/jest`
- 安装微信小程序 API 类型包（如项目采用社区声明则统一放入 `types/miniprogram/` 进行补充）
- 安装 Node 类型包 `@types/node`

说明：

- Jest 已拆分为 `unit/page/component/e2e` 四套配置，迁移时建议统一切换到 `ts-jest` 或保留现有 Jest 运行方式并让 TS 仅负责编译检查。
- 若小程序测试依赖自定义 mock，类型可先在本项目 `types/` 下补齐，不依赖外部运行时改变。

### 2. 配置顶层 `tsconfig.json`

顶层 `tsconfig.json` 采用 `project references`，引用四个子项目：

- `tsconfig.miniprogram.json`
- `tsconfig.cloudfunctions.json`
- `tsconfig.tests.json`
- `tsconfig.scripts.json`

建议结构：

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.miniprogram.json" },
    { "path": "./tsconfig.cloudfunctions.json" },
    { "path": "./tsconfig.tests.json" },
    { "path": "./tsconfig.scripts.json" }
  ]
}
```

### 3. 子 tsconfig 设计

#### `tsconfig.miniprogram.json`

- 覆盖 `miniprogram/**/*.ts`
- `module`: `commonjs`
- `target`: 以现有工具链可接受的 ES 版本为准，建议 `ES2019` 或 `ES2020`
- `composite: true`
- `declaration: true`
- `allowJs: true` 仅在过渡期启用
- `checkJs: false`，迁移初期避免全量 JS 报错
- `strict: true`
- `baseUrl: "."`
- `typeRoots`: `["./types", "./node_modules/@types"]`

#### `tsconfig.cloudfunctions.json`

- 覆盖 `cloudfunctions/**/*.ts`
- `module`: `commonjs`
- `types`: `["node"]`
- 单独声明云函数事件、上下文、数据库返回结构
- 允许对 `wx-server-sdk` 相关封装增加本地补充声明

#### `tsconfig.tests.json`

- 覆盖 `tests/**/*.ts`、`e2e/**/*.ts`、各类 Jest 配置 `.ts`
- `types`: `["jest", "node"]`
- 如保留页面/组件测试自定义运行环境，需为全局注入对象补本地声明

#### `tsconfig.scripts.json`

- 覆盖 `scripts/**/*.ts`
- `types`: `["node"]`
- 面向 CLI 脚本与一次性数据导入逻辑

### 4. 创建 `types/` 目录

必须先创建以下目录结构：

- `types/miniprogram/`
- `types/cloudfunctions/`
- `types/models/`

建议职责：

- `types/miniprogram/`
  - `wx` API 补充声明
  - `Page` / `Component` data 与 instance 混合类型
  - 测试环境中的小程序 mock 全局声明
- `types/cloudfunctions/`
  - 云函数 `event` / `context` / 数据库调用返回结构
  - `wx-server-sdk` 的补充声明或局部封装类型
- `types/models/`
  - `User`
  - `Player`
  - `Team`
  - `TeamMember`
  - `Match`
  - `Activity`
  - `GroupingResult`
  - `AvatarPreset`
  - `PlayerStat`

### 5. 初始类型基线

第一阶段即应建立以下共享类型：

- 数据模型：玩家、活动、比赛、队伍、成员、用户
- 通用分页/列表结果类型
- 数据库文档基础类型：`_id`、`_openid`、`create_time`
- 页面 `setData` 的 data 类型约束
- 云函数统一环境类型：开发/测试/生产环境路由

## 优先级迁移策略

## Priority 1：配置 / 算法 / 云函数公共模块

- 策略：作为全项目类型基础，最先迁移。
- 重点：
  - 把配置对象声明为只读常量或字面量联合类型来源。
  - 为算法模块建立清晰输入输出接口，减少后续页面和测试重复声明。
  - 为环境路由、头像预设、分组算法建立共享类型，供组件、页面、脚本复用。
- 风险：低到中等，主要是字面量类型过窄、算法数据结构不完整。

## Priority 2：组件 + 工具函数

- 策略：在共享类型已有基础上迁移，可快速形成高复用收益。
- 重点：
  - 组件定义 `properties`、`data`、`methods` 的显式类型。
  - 工具函数按“纯函数优先、数据层次清晰、返回类型稳定”原则改造。
  - `db.js` 作为数据访问核心，应在迁移前统一模型与查询结果类型。
- 风险：中等到高，尤其 `match-helper.js` 与 `db.js` 的输入输出复杂度高。

## Priority 3：页面

- 策略：依赖前两类完成后的共享类型与工具类型，再迁移页面。
- 重点：
  - 为每个页面建立 `PageData`、页面参数类型、事件类型。
  - 收紧 `setData`、`onLoad(options)`、异步加载流程中的类型边界。
  - 页面只消费已类型化的工具层和数据库层，避免页面内重复拼装动态对象。
- 风险：高。页面状态与异步流程多，`this` 上下文与 `setData` 容易出错。

## Priority 4：Mock

- 策略：在核心模型类型稳定后迁移，用于提升测试数据一致性。
- 重点：
  - 让 mock 数据直接实现真实模型接口。
  - 把 mock 生成逻辑与页面/工具测试断言统一到同一组类型。
- 风险：低到中等，主要是 mock 数据字段不完整或与真实模型漂移。

## Priority 5：云函数 / 脚本 / 测试 / E2E

- 策略：最后迁移边缘运行环境代码，原因是它们依赖前面所有类型输出。
- 重点：
  - 云函数事件入参、数据库写入参数显式化。
  - Node 脚本参数、文件读取、数据库导入结构显式化。
  - Jest 与 E2E 测试文件使用被测模块类型，避免断言对象结构失真。
- 风险：中等。测试环境 mock、全局变量和运行器集成是主要风险点。

## 分批迁移计划（约 25 批）

说明：

- 每批 `1-3` 个文件，严格按优先级顺序推进。
- 建议每批结束后执行 `tsc -b` 对应子项目，并运行最小必要测试。

### 批次 01

- 文件：
  - `jest.shared.js`（6）
  - `jest.config.js`（7）
  - `jest.unit.config.js`（11）
- 迁移难度：`★☆☆`
- 关键类型需求：
  - Jest 配置对象类型
  - CommonJS 导出兼容
  - 共享配置合并类型
- 测试验证方式：
  - 运行 Jest 配置加载验证
  - 执行 `unit` 测试 smoke 级启动检查

### 批次 02

- 文件：
  - `jest.page.config.js`（13）
  - `jest.component.config.js`（新增）
  - `jest.e2e.config.js`（16）
- 迁移难度：`★☆☆`
- 关键类型需求：
  - page/component/e2e Jest 配置类型
  - 测试环境、runner、setup 文件路径类型
- 测试验证方式：
  - 分别执行 page/component/e2e 配置启动检查
  - 更新 jest.config.ts 中 projects 路径为 .ts

### 批次 03

- 文件：
  - `cloudfunctions/common/env-router.js`（59）
  - `miniprogram/config/env.js`（89）
- 迁移难度：`★★☆☆`
- 关键类型需求：
  - 环境枚举：`dev | test | prod`
  - 环境配置映射类型
  - 云函数与小程序共享环境路由接口
- 测试验证方式：
  - 运行 `tsc -b tsconfig.cloudfunctions.json tsconfig.miniprogram.json`
  - 对环境切换逻辑补单元测试或最小 smoke 测试

### 批次 04

- 文件：
  - `miniprogram/config/avatar-presets.js`（167）
- 迁移难度：`★☆☆`
- 关键类型需求：
  - `AvatarPreset`
  - 头像分类、标签、资源路径字面量类型
  - 只读数组声明
- 测试验证方式：
  - 静态编译检查
  - 组件/页面引用处进行类型消费检查

### 批次 05

- 文件：
  - `miniprogram/utils/group-algorithm.js`（275）
- 迁移难度：`★★★`
- 关键类型需求：
  - `Player`, `Group`, `GroupingResult`
  - 算法输入约束：人数、能力值、位置、分组参数
  - 算法输出稳定结构与错误分支类型
- 测试验证方式：
  - 补充或迁移算法单测
  - 运行相关分组逻辑 smoke 验证

### 批次 06

- 文件：
  - `jest.setup.js`（53）
  - `miniprogram/components/player-stat-input/player-stat-input.js`（92）
- 迁移难度：`★★☆☆`
- 关键类型需求：
  - Jest 全局 mock 类型
  - 组件 `properties` / `data` / `methods` 类型
  - `PlayerStat` 输入输出类型
- 测试验证方式：
  - 运行组件测试
  - 校验 Jest setup 无类型错误

### 批次 07

- 文件：
  - `miniprogram/utils/basketball.js`（144）
  - `miniprogram/components/avatar-picker/avatar-picker.js`（167）
- 迁移难度：`★★☆☆`
- 关键类型需求：
  - 篮球规则/统计计算函数签名
  - 头像选择组件属性与事件类型
  - 与 `AvatarPreset` 的联动类型
- 测试验证方式：
  - 运行组件测试
  - 为纯工具函数补最小单测

### 批次 08

- 文件：
  - `miniprogram/utils/activity-helper.js`（223）
- 迁移难度：`★★★`
- 关键类型需求：
  - `Activity`
  - 活动状态、报名信息、分组上下文
  - 辅助函数返回联合类型
- 测试验证方式：
  - 运行 `activity-helper` 单元测试

### 批次 09

- 文件：
  - `miniprogram/utils/match-helper.js`（500）
- 迁移难度：`★★★`
- 关键类型需求：
  - `Match`, `PlayerStat`, `ScoreSummary`
  - 统计聚合、编辑、展示转换的类型边界
  - 可选字段与默认值策略
- 测试验证方式：
  - 运行 `match-helper.unit` 测试
  - 关联页面 smoke 测试

### 批次 10

- 文件：
  - `miniprogram/utils/db.js`（1035）
- 迁移难度：`★★★`
- 关键类型需求：
  - 集合名到模型的映射类型
  - 通用查询/新增/更新返回类型
  - 云开发数据库命令、where 条件、分页结果类型
- 测试验证方式：
  - 运行 `unit` 与依赖数据层的 `page` 测试
  - 对关键 CRUD 流程做编译与行为双验证

### 批次 11

- 文件：
  - `miniprogram/app.js`（144）
  - `miniprogram/pages/index/index.js`（69）
- 迁移难度：`★★☆☆`
- 关键类型需求：
  - `App` 全局数据类型
  - 首页 `PageData`
  - 全局初始化、云开发初始化类型
- 测试验证方式：
  - 运行首页相关 page 测试
  - 小程序启动 smoke 验证

### 批次 12

- 文件：
  - `miniprogram/pages/activity/list/list.js`（40）
  - `miniprogram/pages/activity/create/create.js`（79）
- 迁移难度：`★★☆☆`
- 关键类型需求：
  - 活动列表项类型
  - 页面表单数据类型
  - 页面加载参数与提交 payload 类型
- 测试验证方式：
  - 运行活动模块 page 测试

### 批次 13

- 文件：
  - `miniprogram/pages/players/list/list.js`（89）
  - `miniprogram/pages/activity/register/register.js`（102）
- 迁移难度：`★★☆☆`
- 关键类型需求：
  - 玩家列表展示模型
  - 报名状态、报名请求参数
  - 页面事件对象与导航参数类型
- 测试验证方式：
  - 运行玩家/活动报名相关 page 测试

### 批次 14

- 文件：
  - `miniprogram/pages/match/list/list.js`（122）
  - `miniprogram/pages/activity/detail/detail.js`（127）
- 迁移难度：`★★★`
- 关键类型需求：
  - 比赛列表卡片模型
  - 活动详情聚合数据类型
  - 异步加载状态联合类型：`idle | loading | success | error`
- 测试验证方式：
  - 运行活动详情与比赛列表测试

### 批次 15

- 文件：
  - `miniprogram/pages/match/stats/edit.js`（128）
- 迁移难度：`★★★`
- 关键类型需求：
  - 统计编辑表单类型
  - 组件联动事件类型
  - 玩家统计更新 payload 类型
- 测试验证方式：
  - 运行 `match-stats-edit.page` 测试
  - 运行 `player-stat-input.component` 测试

### 批次 16

- 文件：
  - `miniprogram/pages/activity/grouping/grouping.js`（165）
- 迁移难度：`★★★`
- 关键类型需求：
  - 分组算法输入输出类型复用
  - 页面分组状态、筛选条件、异常信息类型
- 测试验证方式：
  - 运行 `activity-grouping.page` 测试

### 批次 17

- 文件：
  - `miniprogram/pages/match/detail/detail.js`（178）
  - `miniprogram/pages/players/create/create.js`（198）
- 迁移难度：`★★★`
- 关键类型需求：
  - 比赛详情聚合展示模型
  - 玩家创建表单类型
  - 上传头像、位置、身高体重等字段约束
- 测试验证方式：
  - 运行相关 page 测试
  - 验证创建流程与详情展示流程

### 批次 18

- 文件：
  - `miniprogram/pages/match/create/create.js`（237）
- 迁移难度：`★★★`
- 关键类型需求：
  - 比赛创建表单
  - 队伍、参赛人、时间、地点等 payload 类型
  - 数据库写入前的 DTO 类型
- 测试验证方式：
  - 运行 `match-create.page` 测试

### 批次 19

- 文件：
  - `miniprogram/pages/match/grouping/grouping.js`（265）
- 迁移难度：`★★★`
- 关键类型需求：
  - 比赛分组页面状态机类型
  - 分组参数与结果展示类型
  - 与 `group-algorithm` 的强类型连接
- 测试验证方式：
  - 运行 `match-grouping.workflow` 测试

### 批次 20

- 文件：
  - `miniprogram/pages/players/detail/detail.js`（300）
  - `miniprogram/pages/profile/profile.js`（304）
- 迁移难度：`★★★`
- 关键类型需求：
  - 玩家详情聚合模型
  - 个人主页用户态、成员态、队伍态类型
  - 编辑、展示、跳转参数类型
- 测试验证方式：
  - 运行玩家模块与 profile 相关测试
  - 页面手工 smoke 验证

### 批次 21

- 文件：
  - `miniprogram/utils/mock/index.js`（11）
  - `miniprogram/utils/mock/mock-groups.js`（140）
  - `miniprogram/utils/mock/mock-players.js`（293）
- 迁移难度：`★★☆☆`
- 关键类型需求：
  - mock 玩家、mock 分组结果类型
  - mock 工厂函数返回值类型
  - 与真实模型接口一致性校验
- 测试验证方式：
  - 运行依赖 mock 的 unit/page 测试

### 批次 22

- 文件：
  - `cloudfunctions/getOpenId/index.js`（18）
  - `cloudfunctions/batchImportPlayers/index.js`（123）
- 迁移难度：`★★☆☆`
- 关键类型需求：
  - 云函数 `event` / `context`
  - 导入玩家 payload、返回结果、错误对象类型
  - 数据库批量写入参数类型
- 测试验证方式：
  - 运行 `tsc -b tsconfig.cloudfunctions.json`
  - 对云函数做最小调用 smoke 测试

### 批次 23

- 文件：
  - `scripts/import-players.js`（45）
  - `scripts/seed-match.js`（258）
  - `docs/archive/random-group-algorithm-example.js`（259）
- 迁移难度：`★★☆☆`
- 关键类型需求：
  - CLI 参数、输入数据、导入记录类型
  - 示例脚本对算法接口的类型消费
  - Node 文件与进程 API 类型
- 测试验证方式：
  - 运行 `tsc -b tsconfig.scripts.json`
  - 对脚本执行入口做参数 smoke 验证

### 批次 24

- 文件：
  - `tests/smoke.test.js`（8）
  - `tests/match-helper.unit.test.js`（42）
  - `tests/player-stat-input.component.test.js`（91）
- 迁移难度：`★☆☆`
- 关键类型需求：
  - Jest 断言类型
  - 被测模块导出类型推断
  - 组件实例 mock 类型
- 测试验证方式：
  - 运行 `unit` + `component` 测试

### 批次 25

- 文件：
  - `tests/activity-helper.unit.test.js`（94）
  - `tests/match-create.page.test.js`（94）
  - `tests/match-stats-edit.page.test.js`（99）
- 迁移难度：`★★☆☆`
- 关键类型需求：
  - 页面实例 mock 类型
  - helper 返回结果断言类型
  - 表单与统计编辑测试数据类型
- 测试验证方式：
  - 运行 `unit` + `page` 测试

### 批次 26

- 文件：
  - `tests/activity-grouping.page.test.js`（109）
  - `tests/activity-phase1.page.test.js`（176）
- 迁移难度：`★★☆☆`
- 关键类型需求：
  - 分组页面状态与 mock 数据类型
  - 活动流程阶段数据类型
- 测试验证方式：
  - 运行活动相关 `page` 测试

### 批次 27

- 文件：
  - `tests/match-grouping.workflow.test.js`（200）
  - `tests/player-module.self-test.test.js`（229）
- 迁移难度：`★★★`
- 关键类型需求：
  - 跨模块工作流测试类型
  - 页面、工具、mock 联合类型
- 测试验证方式：
  - 运行 workflow/self-test

### 批次 28

- 文件：
  - `e2e/setup.js`（8）
  - `e2e/health.test.js`（9）
  - `e2e/test-connection.js`（29）
- 迁移难度：`★☆☆`
- 关键类型需求：
  - E2E 全局初始化类型
  - 连接检测结果类型
  - 运行器环境变量类型
- 测试验证方式：
  - 运行最小 E2E 健康检查

### 批次 29

- 文件：
  - `e2e/test-connection-stability.js`（33）
  - `e2e/find-port.js`（47）
  - `e2e/phase01-simple.test.js`（47）
- 迁移难度：`★★☆☆`
- 关键类型需求：
  - 端口发现函数类型
  - 重试/稳定性检查结果类型
  - E2E 简化流程断言类型
- 测试验证方式：
  - 运行连接稳定性与简化流程测试

### 批次 30

- 文件：
  - `e2e/minimal-test.js`（49）
  - `e2e/test-page-load.js`（52）
  - `e2e/test-launch.js`（55）
- 迁移难度：`★★☆☆`
- 关键类型需求：
  - 页面加载结果、启动句柄、超时控制类型
  - E2E 工具辅助函数类型
- 测试验证方式：
  - 运行页面加载与启动测试

### 批次 31

- 文件：
  - `e2e/phase01.test.js`（156）
- 迁移难度：`★★★`
- 关键类型需求：
  - 端到端流程状态类型
  - 页面节点定位、行为脚本、断言结果类型
  - 多步骤测试上下文类型
- 测试验证方式：
  - 运行完整 `e2e` 测试

## 每阶段完成定义

### 基础设施阶段完成定义

- 顶层 `tsconfig.json` 与四个子 `tsconfig` 可执行 `project references`
- `types/miniprogram/`、`types/cloudfunctions/`、`types/models/` 创建完成
- Jest 与 TS 至少能并存运行

### 公共模块阶段完成定义

- `env`、头像配置、分组算法、核心 helper 与 `db` 均已有显式导出类型
- 页面与测试不再手写重复对象结构

### 页面阶段完成定义

- 所有页面均具备显式 `PageData` 类型
- `onLoad` 参数、`setData`、导航参数、异步返回值均已类型化

### 测试与边缘代码阶段完成定义

- 云函数、脚本、单测、E2E 均已迁移为 `.ts`
- `tsc -b` 可覆盖四个子项目
- 四套 Jest 配置和 E2E 配置均可正常执行

## 类型设计重点

### 小程序页面与组件

- 为页面定义：
  - `PageData`
  - `PageCustomState`
  - `PageOptions`
- 为组件定义：
  - `Properties`
  - `Data`
  - `Methods`
- 尽量通过辅助泛型约束 `setData`，减少拼写错误和字段类型错误。

### 数据模型

- 在 `types/models/` 中集中管理：
  - `User`
  - `Player`
  - `Match`
  - `Activity`
  - `Team`
  - `TeamMember`
  - `MatchStats`
  - `GroupingResult`
- 使用共享基础接口承接公共字段，例如：
  - `BaseDoc`
  - `CreatedDoc`
  - `OwnedDoc`

### 数据库访问层

- `db` 层应建立“集合名 -> 文档类型”的映射。
- 常见返回值统一化：
  - `Promise<T | null>`
  - `Promise<T[]>`
  - `Promise<{ data: T[]; total?: number }>`
  - `Promise<{ success: true } | { success: false; error: string }>`

### 云函数

- 统一定义：
  - `CloudFunctionEvent<TPayload>`
  - `CloudFunctionResult<TData>`
  - `CloudEnvName`
- 对导入脚本和批处理函数明确成功/失败记录结构，避免批量写入结果失真。

## 测试策略

### 编译检查

- 每批迁移完成后，至少对所属子项目执行一次 `tsc -b`。
- 批量页面迁移阶段，建议每 2-3 批执行一次完整 `tsc -b`。

### Jest 验证

- 配置类变更：验证 Jest 能正确加载配置。
- helper / 算法变更：优先运行 `unit`。
- 组件变更：运行 `component`。
- 页面变更：运行 `page`。
- 端到端工具或流程变更：运行 `e2e`。

### 回归范围建议

- 每完成一个优先级类别后，执行一次该类别相关的完整测试集。
- `db.js`、`match-helper.js`、分组算法、页面创建/编辑流程迁移后，建议执行跨模块回归。

## 风险与应对

### 风险 1：小程序类型声明不足

- 应对：优先在 `types/miniprogram/` 补本地声明，不等待外部依赖完全覆盖。

### 风险 2：`db.js` 动态返回结构太多

- 应对：先规范对外 API，再逐步细化内部实现；必要时拆分为查询、写入、映射三个子模块。

### 风险 3：页面 `this` 与 `setData` 类型复杂

- 应对：为页面建立局部 helper 类型，优先约束 data 结构与关键 methods，不强求首轮完全消灭断言。

### 风险 4：测试环境 mock 与运行器不兼容

- 应对：先迁移 Jest 配置与 setup，再迁移测试文件，保持测试基座先稳定。

### 风险 5：迁移范围过大导致长分支堆积

- 应对：按上述批次推进，每批独立提交，优先保证可回滚、可验证。

## 建议执行顺序总结

1. 完成前置任务：安装依赖、配置 `tsconfig`、创建 `types/` 目录。
2. 迁移 Priority 1，建立环境配置、头像预设、分组算法等基础类型。
3. 迁移 Priority 2，重点完成 `match-helper` 与 `db` 的强类型改造。
4. 迁移 Priority 3，按页面复杂度逐步推进。
5. 迁移 Priority 4，使 mock 与真实模型保持一致。
6. 迁移 Priority 5，收尾云函数、脚本、测试与 E2E。
7. 最终执行四个子项目的 `tsc -b` 与四套测试回归。

## 预期结果

- 项目形成基于 `project references` 的可扩展 TypeScript 工程结构。
- 核心业务模型、数据库访问层、页面状态和测试数据具备统一类型源。
- 迁移过程可按批次独立推进，每批都具备明确的类型目标和验证手段。
