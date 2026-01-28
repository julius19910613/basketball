# 篮球管理小程序

基于微信云开发的篮球球队管理小程序，帮助业余篮球爱好者管理球队、组织比赛、记录数据。

[![Powered by CloudBase](https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/mcp/powered-by-cloudbase-badge.svg)](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit)

> 本项目基于 [**CloudBase AI ToolKit**](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit) 开发，通过AI提示词和 MCP 协议+云开发，让开发更智能、更高效。

## 项目特点

- 🏀 **球队管理**：创建球队、上传队徽、设置队服颜色
- 👥 **成员管理**：邀请成员、设置副队长、管理球队成员
- 📊 **数据统计**：球队统计、成员数据展示
- ☁️ **云开发**：基于微信云开发，无需自建服务器
- 🚀 **快速部署**：一键部署至腾讯云 CloudBase

## 核心功能

### 1. 球队管理
- 创建球队：自定义队名、地区、队徽、队服颜色
- 球队列表：查看所有加入的球队
- 球队详情：展示球队信息和成员列表

### 2. 成员管理
- 邀请成员：通过小程序分享邀请好友
- 角色设置：设置队长、副队长
- 成员管理：移除成员、查看成员信息

### 3. 用户系统
- 微信登录：基于 openid 的免登认证
- 用户信息：头像、昵称展示

## 技术栈

- **前端框架**：微信小程序原生框架
- **云服务**：腾讯云 CloudBase（云数据库 + 云函数 + 云存储）
- **UI 组件**：自定义组件 + 原生组件

## 数据库设计

### teams（球队集合）
```javascript
{
  _id: String,              // 球队ID
  name: String,             // 队名
  region: String,           // 地区
  color: String,            // 队服颜色
  logo: String,             // 队徽URL
  create_time: Date,        // 创建时间
  create_by: String         // 创建者openid
}
```

### team_members（成员集合）
```javascript
{
  _id: String,              // 成员记录ID
  team_id: String,         // 球队ID
  openid: String,          // 用户openid
  role: String,            // 角色: captain/vice-captain/member
  number: Number,          // 球员号码
  join_time: Date          // 加入时间
}
```

### users（用户集合）
```javascript
{
  _id: String,              // 用户ID
  openid: String,           // 微信openid
  nickName: String,         // 昵称
  avatarUrl: String,       // 头像URL
  create_time: Date         // 创建时间
}
```

## 快速开始

### 前置条件

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 注册 [微信小程序账号](https://mp.weixin.qq.com/)
3. 开通 [腾讯云 CloudBase](https://console.cloud.tencent.com/tcb)

### 部署步骤

1. **导入项目**
   - 打开微信开发者工具
   - 导入项目目录 `c:/Users/lifan/CodeBuddy/basketball`

2. **配置 CloudBase 环境**
   - 在 `miniprogram/app.js` 中配置环境 ID
   ```javascript
   wx.cloud.init({
     env: 'your-env-id', // 替换为你的云开发环境 ID
     traceUser: true,
   });
   ```

3. **创建数据库集合**
   - 在 CloudBase 控制台创建 `teams`、`team_members`、`users` 集合
   - 配置数据库安全规则（详见 [DEPLOYMENT.md](./DEPLOYMENT.md)）

4. **部署云函数**
   - 右键 `cloudfunctions/getOpenId` 文件夹
   - 选择"上传并部署：云端安装依赖"

5. **上传小程序**
   - 点击"上传"按钮
   - 在小程序后台提交审核并发布

详细部署说明请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 项目结构

```
├── cloudfunctions/           # 云函数目录
│   └── getOpenId/          # 获取用户openid
│       ├── index.js
│       └── package.json
├── miniprogram/             # 小程序代码
│   ├── app.js              # 小程序入口
│   ├── app.json            # 小程序配置
│   ├── app.wxss            # 全局样式
│   ├── pages/              # 页面目录
│   │   ├── index/          # 首页
│   │   ├── teams/          # 球队列表
│   │   ├── create-team/    # 创建球队
│   │   ├── team-detail/    # 球队详情
│   │   └── member-manage/  # 成员管理
│   ├── components/         # 自定义组件
│   │   └── cloudbase-badge/
│   └── images/             # 图片资源
│       └── tabbar/         # 底部导航图标
├── project.config.json     # 项目配置
├── DEPLOYMENT.md          # 部署指南
├── 产品功能设计.md         # 产品功能文档
└── README.md              # 项目说明
```

## 页面说明

### 首页（index）
- 展示用户信息
- 统计概览（球队数、比赛数、数据数）
- 快捷入口（创建球队、发现球队、数据统计）

### 球队列表（teams）
- 展示用户加入的所有球队
- 支持创建新球队
- 查看球队详情

### 创建球队（create-team）
- 填写队名、地区
- 上传队徽
- 选择队服颜色

### 球队详情（team-detail）
- 展示球队基本信息
- 成员列表
- 队长可进入成员管理

### 成员管理（member-manage）
- 查看所有成员
- 设置副队长
- 移除成员
- 邀请新成员

## 开发说明

### 云函数
目前使用 `getOpenId` 云函数获取用户 openid，所有数据库操作通过前端 SDK 直接进行。

### 数据库安全规则
- **teams**：所有人可读，仅创建者可写
- **team_members**：成员本人和球队队长可读写
- **users**：仅用户本人可读写

### 样式规范
- 主色调：#FF6B35（橙色）
- 辅助色：#4CAF50（绿色）、#2196F3（蓝色）
- 圆角：16rpx
- 间距：20rpx

## 后续规划

### 第二阶段
- [ ] 比赛记录与数据统计
- [ ] 发现球队功能
- [ ] 约球功能
- [ ] 个人数据看板

### 第三阶段
- [ ] 联赛系统
- [ ] 数据分析报表
- [ ] 社交动态广场
- [ ] 战术板工具

## 常见问题

**Q: 为什么无法获取 openid？**
A: 请检查 CloudBase 环境 ID 是否正确配置，以及云函数是否成功部署。

**Q: 为什么无法创建球队？**
A: 请确认数据库集合 `teams` 和 `team_members` 已创建，并配置了正确的安全规则。

**Q: 如何配置数据库安全规则？**
A: 请参考 [DEPLOYMENT.md](./DEPLOYMENT.md) 中的详细说明。

## 技术支持

- [微信云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [腾讯云 CloudBase 文档](https://docs.cloudbase.net/)
- [CloudBase AI ToolKit](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit)

## 许可证

MIT License

---

**项目版本**：v1.0
**最后更新**：2026-01-28