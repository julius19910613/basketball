# 小程序自动化测试指南

## 测试目标

测试采用四层结构：

| 层级 | 命令 | 覆盖范围 |
|------|------|----------|
| Unit | `npm run test:unit` | 纯逻辑、分组算法、分页和数据转换 |
| Page | `npm run test:page` | 页面状态、导航、数据库调用和异常反馈 |
| Component | `npm run test:component` | 自定义组件渲染与交互 |
| E2E | `npm run test:e2e:dev` | 真实微信开发者工具、线上 `dev_*` 数据契约和核心页面 |

`npm test` 串行运行前三层并生成 `coverage/`。E2E 明确独立执行，避免 CI 或无 GUI 环境误连线上资源。

## 线上 Dev 测试原则

- 只允许访问 `dev_*` 集合，测试代码维护显式集合白名单。
- E2E 只读，不新增、修改或删除业务记录。
- 使用 `skip + limit(20)` 读取完整集合，不能用单次 `limit(100)` 代替分页。
- 校验球员、活动、比赛、报名、技术统计和评分摘要之间的引用完整性。
- 校验活动赛程的参赛名单与该场两支分组队伍完全一致。
- 校验已生成赛程的活动状态为 `in_progress` 或 `finished`。
- 冒烟打开球员、比赛、活动列表和球员详情，并核对页面数据来自线上 dev 集合。

## 前置条件

1. 安装依赖：`npm install`。
2. 登录微信开发者工具。
3. 在“设置 -> 安全设置”中开启服务端口。
4. 确认项目 AppID 和 `miniprogram/app.ts` 的 CloudBase 环境 ID 正确。
5. 开发版使用 `miniprogram/config/env.ts` 中定义的 `dev_*` 集合映射。

Dev 集合权限建议：

| 集合 | 权限 |
|------|------|
| `dev_players`、`dev_matches`、`dev_player_match_stats` | 所有人可读、创建者可写 |
| `dev_activities`、`dev_activity_registrations` | 所有人可读、创建者可写，支持分享报名和组织者汇总 |
| `dev_match_player_rating_summaries`、`dev_player_rating_summaries` | 所有人可读、仅可信后端写入 |
| `dev_player_ratings` | 用户仅访问自己的记录，聚合由云函数执行 |

评分集合索引应与 `DATABASE_SCHEMA.md` 保持一致，尤其是评分源记录的 `matchId + playerId + _openid` 唯一索引，以及两个摘要集合的唯一索引。

## 运行方式

```bash
npm test
npm run test:e2e:dev
```

默认 CLI 路径为：

```text
/Applications/wechatwebdevtools.app/Contents/MacOS/cli
```

可通过环境变量覆盖：

```bash
WECHAT_DEVTOOLS_CLI=/custom/path/cli npm run test:e2e:dev
MINIPROGRAM_PROJECT_PATH=/custom/project npm run test:e2e:dev
E2E_AUTOMATION_PORT=9431 npm run test:e2e:dev
```

如果已手动用 CLI 开启自动化，可直接连接 WebSocket：

```bash
E2E_WS_ENDPOINT=ws://127.0.0.1:9421 npm run test:e2e:dev
```

E2E 配置固定 `maxWorkers: 1`，避免多个开发者工具实例并发读取同一环境。

## 常见问题

### 服务端口未开启

出现 `Failed to launch wechat web devTools` 时，先开启开发者工具服务端口，或重启到固定 HTTP 端口后再运行：

```bash
/Applications/wechatwebdevtools.app/Contents/MacOS/cli quit
/Applications/wechatwebdevtools.app/Contents/MacOS/cli auto --project "$PWD" --port 9420 --auto-port 9421
E2E_WS_ENDPOINT=ws://127.0.0.1:9421 npm run test:e2e:dev
```

### 管理端有数据但页面为空

优先检查集合权限、记录 `_openid` 和查询条件是否匹配。管理端查询可以绕过客户端安全规则，不能替代真实小程序身份下的 E2E。

### 记录超过 20 条后缺失

微信小程序云数据库查询必须分页。业务页面统一使用 `miniprogram/utils/cloud-pagination.ts`，线上数据测试也按 20 条逐页读取。

## 参考

- [微信小程序自动化](https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/)
- [CloudBase 文档型数据库](https://docs.cloudbase.net/database/introduce)
- [CloudBase 安全规则](https://docs.cloudbase.net/database/security-rules)
