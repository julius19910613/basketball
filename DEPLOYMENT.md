# 篮球管理小程序 - 部署指南

## 项目概述

这是一个基于微信云开发的篮球球队管理小程序，实现了球队创建、成员管理等核心功能。

## 功能模块

### 已实现功能

1. **球队管理**
   - 创建球队（队名、队徽、队服颜色、地区）
   - 球队列表展示
   - 球队详情查看

2. **成员管理**
   - 邀请成员（通过分享）
   - 设置副队长
   - 移除成员
   - 成员列表展示

3. **首页**
   - 用户信息展示
   - 统计概览
   - 快捷入口

## 数据库设计

### 集合结构

1. **teams** (球队集合)
   ```javascript
   {
     _id: String,              // 球队ID
     name: String,             // 队名
     region: String,           // 地区
     color: String,            // 队服颜色（十六进制）
     logo: String,             // 队徽URL
     create_time: Date,        // 创建时间
     create_by: String         // 创建者openid
   }
   ```

2. **team_members** (球队成员集合)
   ```javascript
   {
     _id: String,              // 成员记录ID
     team_id: String,         // 球队ID
     openid: String,          // 用户openid
     role: String,            // 角色: captain/vice-captain/member
     number: Number,          // 球员号码（可选）
     join_time: Date          // 加入时间
   }
   ```

3. **users** (用户集合)
   ```javascript
   {
     _id: String,              // 用户ID
     openid: String,           // 微信openid
     nickName: String,         // 昵称
     avatarUrl: String,       // 头像URL
     create_time: Date         // 创建时间
   }
   ```

## 部署步骤

### 1. 准备 CloudBase 环境

由于当前环境查询失败，需要手动配置 CloudBase 环境：

#### 方式一：通过微信开发者工具

1. 打开微信开发者工具
2. 导入项目 `c:/Users/lifan/CodeBuddy/basketball`
3. 点击工具栏"云开发"按钮
4. 按照提示开通云开发环境
5. 复制环境 ID

#### 方式二：通过 CloudBase 控制台

1. 访问 [腾讯云 CloudBase 控制台](https
://console.cloud.tencent.com/tcb)
2. 创建新的云开发环境
3. 选择"按量计费"或"包年包月"
4. 复制环境 ID

### 2. 配置环境 ID

修改 `miniprogram/app.js` 文件：

```javascript
wx.cloud.init({
  env: 'your-env-id', // 替换为你的云开发环境 ID
  traceUser: true,
});
```

将 `your-env-id` 替换为你实际的 CloudBase 环境 ID。

### 3. 创建数据库集合

在 CloudBase 控制台的数据库页面，创建以下集合：

1. **teams**
2. **team_members**
3. **users**

### 4. 配置数据库安全规则

#### teams 集合规则

```json
{
  "read": true,
  "write": "auth.openid == doc.create_by"
}
```

#### team_members 集合规则

```json
{
  "read": "auth.openid == doc.openid || auth.openid == get('database.teams.' + doc.team_id + '.create_by')",
  "write": "auth.openid == doc.openid || auth.openid == get('database.teams.' + doc.team_id + '.create_by')"
}
```

#### users 集合规则

```json
{
  "read": "auth.openid == doc.openid",
  "write": "auth.openid == doc.openid"
}
```

### 5. 部署云函数

项目已包含 `getOpenId` 云函数，用于获取用户的 openid。

1. 在微信开发者工具中，右键 `cloudfunctions/getOpenId` 文件夹
2. 选择"上传并部署：云端安装依赖"
3. 等待部署完成

### 6. 上传小程序代码

1. 在微信开发者工具中点击"上传"按钮
2. 填写版本号和项目备注
3. 上传完成后，在微信公众平台（小程序后台）提交审核
4. 审核通过后即可发布

## 使用说明

### 创建球队

1. 打开小程序，点击"创建球队"
2. 填写队名和地区
3. 可选上传队徽和选择队服颜色
4. 提交创建

### 管理成员

1. 进入"我的球队"
2. 点击球队查看详情
3. 队长可以点击"管理"进入成员管理页面
4. 长按成员可设置副队长或移除成员
5. 点击"邀请新成员"可通过分享邀请好友

## 注意事项

1. **环境 ID 配置**：必须正确配置 CloudBase 环境 ID 才能使用云开发功能
2. **数据库权限**：需要根据实际业务需求调整数据库安全规则
3. **小程序 AppID**：需要在 `project.config.json` 中配置正确的 AppID
4. **域名配置**：如果使用云存储或云函数 HTTP 访问，需要配置服务器域名

## 后续开发建议

### 第二阶段功能

1. 比赛记录与数据统计
2. 发现球队功能
3. 约球功能
4. 个人数据看板

### 第三阶段功能

1. 联赛系统
2. 数据分析报表
3. 社交动态广场
4. 战术板工具

## 常见问题

### Q: 为什么无法获取 openid？

A: 请检查是否正确配置了 CloudBase 环境 ID，并且云函数 `getOpenId` 已成功部署。

### Q: 为什么无法创建球队？

A: 请检查数据库集合 `teams` 和 `team_members` 是否已创建，安全规则是否配置正确。

### Q: 为什么上传队徽失败？

A: 请检查云存储是否已开通，并确保文件大小在限制范围内。

## 技术支持

如有问题，请参考：
- [微信云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [腾讯云 CloudBase 文档](https://docs.cloudbase.net/)

---

**项目版本**：v1.0
**最后更新**：2026-01-28
