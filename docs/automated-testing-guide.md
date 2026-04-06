# 小程序自动化测试指南

## 前置条件

1. **安装依赖**
```bash
cd /Users/ppt/Projects/basketball
npm install --save-dev miniprogram-automator
```

2. **开启开发者工具的 CLI/HTTP 调用功能**
   - 打开微信开发者工具
   - 设置 → 安全设置 → 开启服务端口

3. **确认 CLI 路径**（MacOS 通常无需配置）
   - 默认路径：`/Applications/wechatwebdevtools.app/Contents/MacOS/cli`
   - 如需修改，编辑 `e2e/phase01.test.js` 中的 `cliPath`

## 运行测试

### 方式1：运行所有测试
```bash
npm run test:e2e
```

### 方式2：运行特定测试文件
```bash
npx jest e2e/phase01.test.js
```

### 方式3：运行单个测试用例
```bash
npx jest e2e/phase01.test.js -t "Overall V2 算法应该正确计算"
```

## 测试内容（Phase 0+1）

1. ✅ **首页加载测试**
   - 验证首页是否正常加载

2. ✅ **basketball.js 工具模块测试**
   - Overall V2 算法计算
   - 位置权重应用

3. ✅ **球员添加页面测试**
   - 技能录入组件加载
   - 页面数据初始化

4. ✅ **球员卡片组件测试**
   - Overall 显示
   - 技能概要展示

5. ✅ **技能录入交互测试**
   - 滑动条触发
   - 值更新验证

6. ✅ **Overall 实时更新测试**
   - 修改技能后 Overall 自动更新

## 测试报告

测试完成后，Jest 会生成测试报告：
- 控制台输出：显示通过/失败的测试用例
- 覆盖率报告：`coverage/` 目录（如果配置）

## 常见问题

### 1. 开发者工具未启动
**错误信息**：`Error: Failed to launch mini program`

**解决方案**：
- 确保开发者工具已打开
- 确认项目路径正确
- 检查 CLI 路径配置

### 2. 端口被占用
**错误信息**：`Port 9420 is already in use`

**解决方案**：
- 关闭其他微信开发者工具实例
- 或修改测试配置使用不同端口

### 3. 测试超时
**错误信息**：`Timeout - Async callback was not invoked`

**解决方案**：
- 增加 `jest.setTimeout(30000)`（已设置）
- 检查开发者工具响应速度

## 下一步

- [ ] 添加更多测试用例（Phase 2-3）
- [ ] 集成到 CI/CD 流程
- [ ] 生成测试覆盖率报告
- [ ] 添加截图对比测试

## 参考文档

- [微信官方文档 - 小程序自动化](https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/)
- [miniprogram-automator API](https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/miniprogram.html)
