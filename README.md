# 球员管理（微信小程序 + CloudBase）

面向业余篮球场景的**球员信息管理**小程序：在云端维护球员档案，支持按场上五个位置分类、录入体测与姓名信息，并提供列表与详情查看。

[License: MIT](LICENSE)
[Powered by CloudBase](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit)

> 仓库说明文档结构参考 [GitHub 关于 README 的说明](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes)：优先让读者在首屏看到「是什么、如何跑起来、去哪查细节」。

## 目录

- [功能概览](#功能概览)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [数据模型](#数据模型)
- [项目结构](#项目结构)
- [脚本与测试](#脚本与测试)
- [常见问题](#常见问题)
- [相关文档](#相关文档)
- [许可证](#许可证)

## 功能概览


| 能力     | 说明                                           |
| ------ | -------------------------------------------- |
| 球员列表   | 从 CloudBase 文档库读取 `players`，按创建时间倒序展示；支持下拉刷新 |
| 新增球员   | 昵称、真实姓名、年龄、身高(cm)、体重(kg)、场上位置（PG/SG/SF/PF/C） |
| 球员详情   | 通过文档 `_id` 查看单条球员信息                          |
| 历史数据兼容 | 列表展示优先 `nickname`，兼容旧数据中的 `name` 字段          |


## 技术栈

- **客户端**：微信小程序原生（`miniprogram/`）
- **后端**：腾讯云 CloudBase（`wx.cloud` 云数据库；身份通过 `cloudfunctions/getOpenId` 获取 openid）
- **测试**：Jest（单元/自测脚本 + 可选 E2E，见下文）

## 快速开始

### 前置条件

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 注册小程序账号并开通 [云开发 / CloudBase](https://console.cloud.tencent.com/tcb)
3. 本机安装 Node.js（用于运行仓库内 Jest 脚本）

### 三步跑通

1. **克隆并安装依赖**
  ```bash
   git clone https://github.com/julius19910613/basketball.git
   cd basketball
   npm install
  ```
2. **配置云环境**
  在 `[miniprogram/app.js](miniprogram/app.js)` 中将 `wx.cloud.init({ env: '...' })` 的 `env` 改为你自己的 CloudBase 环境 ID。
3. **创建数据库集合并导入项目**
  - 在 CloudBase 控制台 → 文档型数据库 → **新建集合 `players`**（名称需与代码一致，否则会出现 `-502005` 集合不存在错误）。  
  - 用微信开发者工具 **导入仓库根目录**（包含 `project.config.json` 与 `miniprogram/`，不要只选子目录）。  
  - 部署云函数：右键 `cloudfunctions/getOpenId` → 上传并部署（云端安装依赖）。

完成以上步骤后，在开发者工具中编译预览，首页即进入 **球员列表**。

## 数据模型

### `players`（球员集合）

小程序读写字段约定如下（新增页写入；列表/详情读取）：


| 字段          | 类型         | 说明                              |
| ----------- | ---------- | ------------------------------- |
| `nickname`  | string     | 昵称                              |
| `realName`  | string     | 真实姓名                            |
| `position`  | string     | `PG` / `SG` / `SF` / `PF` / `C` |
| `age`       | number     | 年龄                              |
| `height`    | number     | 身高（厘米）                          |
| `weight`    | number     | 体重（千克）                          |
| `createdAt` | serverDate | 创建时间                            |
| `updatedAt` | serverDate | 更新时间                            |


**安全规则**：请在控制台为 `players` 配置符合你产品要求的读写规则；开发阶段可先用较宽规则验证链路，上线前务必收紧（仅创建者可写、按 openid 隔离等）。更细的规则示例见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

## 项目结构

```
├── cloudfunctions/getOpenId/   # 获取 openid
├── miniprogram/
│   ├── app.js                    # 云初始化、登录
│   ├── app.json                  # 全局路由（仅球员三页）
│   ├── app.wxss                  # 全局样式变量
│   └── pages/players/
│       ├── list/                 # 球员列表（入口页）
│       ├── create/               # 新增球员
│       └── detail/               # 球员详情
├── e2e/                          # E2E 测试（可选，需开发者工具）
├── tests/                        # 单元与自测
├── project.config.json           # 小程序项目配置
├── DEPLOYMENT.md                 # 部署与数据库说明
└── README.md
```

## 脚本与测试


| 命令                  | 作用                                                                          |
| ------------------- | --------------------------------------------------------------------------- |
| `npm test`          | 默认 E2E 配置下的健康检查（`jest.e2e.config.js`）                                       |
| `npm run test:unit` | 单元测试（`jest.config.js`）                                                      |
| `npm run test:self` | **球员模块自测**：校验位置枚举、表单写入字段、列表兼容与详情加载（`tests/player-module.self-test.test.js`） |
| `npm run test:e2e`  | 完整 E2E 套件（部分用例需本机微信开发者工具与环境变量，见 `package.json` 与 `e2e/`）                    |


## 常见问题

**Q: 控制台报错 `DATABASE_COLLECTION_NOT_EXIST` / `-502005`，提示 `players` 不存在？**  
A: 在 CloudBase 控制台创建名为 `**players`** 的文档集合后再试。代码中已对缺失集合做了提示，但必须先创建集合才能正常读写。

**Q: 无法获取 openid？**  
A: 确认 `app.js` 中环境 ID 正确，且 `getOpenId` 云函数已成功部署到同一环境。

**Q: 旧文档里还有球队/比赛模块说明？**  
A: 当前产品已收敛为球员管理；历史说明以本 README 与 `DEPLOYMENT.md` 为准，若文档内有冲突请优先以代码与本文为准。

## 相关文档

- [微信云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [腾讯云 CloudBase 文档](https://docs.cloudbase.net/)
- [错误码：数据库集合不存在](https://docs.cloudbase.net/error-code/basic/DATABASE_COLLECTION_NOT_EXIST)
- 本仓库部署细节：[DEPLOYMENT.md](./DEPLOYMENT.md)

## 许可证

[MIT License](LICENSE)

---

维护提示：更新功能或数据模型时，请同步修改本文件中的「功能概览」「数据模型」「项目结构」三节，避免读者与代码脱节。