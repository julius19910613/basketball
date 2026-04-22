# Basketball 小程序 - UX 优化测试方案

> 版本：v1.0
> 日期：2026-02-26
> 状态：待评审
> 关联文档：[ux-enhancement-plan.md](./ux-enhancement-plan.md)

---

## 一、测试策略

### 1.1 测试范围

| 模块 | 测试内容 | 优先级 | 负责人 |
|------|----------|--------|--------|
| **骨架屏组件** | 通用骨架屏组件、各页面骨架屏布局 | P0 | 待分配 |
| **扫光动画** | 骨架屏扫光动效、性能表现 | P0 | 待分配 |
| **分组动画** | 卡片飞舞、聚合、落地动画 | P0 | 待分配 |
| **基础动画** | 页面切换、弹窗、按钮反馈 | P1 | 待分配 |
| **微交互** | 选中态、Toast、成功弹窗 | P1 | 待分配 |
| **兼容性** | iOS/Android 微信、深色模式 | P1 | 待分配 |
| **性能** | 帧率、内存、低端机表现 | P1 | 待分配 |

### 1.2 测试优先级

**P0 - 冒烟测试（必须通过）**
- 骨架屏正确显示/隐藏
- 核心分组动画完整执行
- 动画不影响功能正确性
- 无明显卡顿和崩溃

**P1 - 功能测试**
- 所有动画触发条件正确
- 边界条件处理
- 不同数据量下的表现

**P2 - 体验优化**
- 动画流畅度评分
- 用户满意度测试
- 性能极致优化

### 1.3 测试环境

#### 设备要求

| 分类 | 设备 | 系统版本 | 微信版本 | 用途 |
|------|------|----------|----------|------|
| **高端 iOS** | iPhone 14 Pro | iOS 17+ | 8.0.44+ | 性能基准测试 |
| **中端 iOS** | iPhone 12 | iOS 15+ | 8.0.40+ | 兼容性测试 |
| **低端 iOS** | iPhone X | iOS 14+ | 8.0.35+ | 低端机测试 |
| **高端 Android** | 小米 14 | Android 14 | 8.0.44+ | 性能基准测试 |
| **中端 Android** | 华为 P40 | HarmonyOS 4 | 8.0.40+ | 兼容性测试 |
| **低端 Android** | 红米 Note 9 | Android 10 | 8.0.35+ | 低端机测试 |

#### 微信版本覆盖

- 最新版本（8.0.44+）
- 主流版本（8.0.40）
- 最低兼容版本（8.0.35）

### 1.4 测试工具

| 工具 | 用途 | 备注 |
|------|------|------|
| 微信开发者工具 | 基础调试、性能分析 | 基础能力 |
| Chrome DevTools | 性能分析、帧率监控 | 调试模式 |
| PerfDog | 真机性能监控 | FPS、内存、CPU |
| vconsole | 真机调试 | 日志、性能数据 |
| 小程序自动化工具 | E2E 测试 | miniprogram-automator |

---

## 二、功能测试用例

### 2.1 骨架屏测试用例

#### 2.1.1 通用组件测试

| 用例ID | 测试项 | 前置条件 | 测试步骤 | 预期结果 |
|--------|--------|----------|----------|----------|
| SKEL-001 | 组件渲染 | 骨架屏组件已开发 | 1. 引入骨架屏组件<br>2. 设置 loading=true | 显示灰色占位布局 |
| SKEL-002 | 扫光动画 | 骨架屏显示中 | 1. 观察动画效果<br>2. 检查动画循环 | 1.5s 循环扫光，流畅无卡顿 |
| SKEL-003 | 颜色规范 | 骨架屏显示中 | 1. 截图<br>2. 检查颜色值 | 背景 #F2F2F2，占位块 #E6E6E6 |
| SKEL-004 | 圆角统一 | 骨架屏显示中 | 1. 检查各占位块圆角 | 统一 16rpx |
| SKEL-005 | 切换到内容 | 骨架屏显示中 | 1. 数据加载完成<br>2. 设置 loading=false | 骨架屏消失，真实内容显示 |
| SKEL-006 | 切换动画 | 骨架屏→内容 | 1. 观察切换过程 | 平滑过渡，无闪烁 |
| SKEL-007 | 空状态处理 | 无数据场景 | 1. 加载空数据 | 显示空状态提示，非骨架屏 |
| SKEL-008 | 快速切换 | 网络较慢 | 1. 快速切换页面<br>2. 立即返回 | 骨架屏显示/隐藏逻辑正确 |

#### 2.1.2 team-detail 页面骨架屏

| 用例ID | 测试项 | 前置条件 | 测试步骤 | 预期结果 |
|--------|--------|----------|----------|----------|
| TD-SKEL-001 | 整体布局 | 进入球队详情页 | 1. 首次进入页面<br>2. 观察骨架屏布局 | 依次显示：球队信息卡→快捷入口→成员列表 |
| TD-SKEL-002 | 队徽占位 | 骨架屏显示中 | 检查队徽位置 | 圆形占位，直径约 120rpx |
| TD-SKEL-003 | 球队名称占位 | 骨架屏显示中 | 检查名称位置 | 长条形占位，宽度约 60% |
| TD-SKEL-004 | 标签占位 | 骨架屏显示中 | 检查标签区域 | 2-3 个小圆角矩形占位 |
| TD-SKEL-005 | 成员列表占位 | 骨架屏显示中 | 检查成员区域 | 3-5 个成员项占位 |
| TD-SKEL-006 | 加载后切换 | 数据加载完成 | 观察切换过程 | 骨架屏消失，真实内容淡入 |
| TD-SKEL-007 | 刷新场景 | 页面已加载 | 1. 下拉刷新<br>2. 观察骨架屏 | 刷新时显示骨架屏 |
| TD-SKEL-008 | 缓存场景 | 曾访问过 | 1. 二次进入页面 | 优先显示缓存内容，无骨架屏 |

#### 2.1.3 skill-level 页面骨架屏

| 用例ID | 测试项 | 前置条件 | 测试步骤 | 预期结果 |
|--------|--------|----------|----------|----------|
| SL-SKEL-001 | 整体布局 | 进入能力档位设置页 | 1. 首次进入页面 | 依次显示：统计卡→快捷操作→球员列表 |
| SL-SKEL-002 | 档位分布占位 | 骨架屏显示中 | 检查档位分布区 | 4 个圆形占位 + 标签 |
| SL-SKEL-003 | 平均档位占位 | 骨架屏显示中 | 检查平均档位区 | 长条形数字占位 |
| SL-SKEL-004 | 球员列表占位 | 骨架屏显示中 | 检查球员区域 | 5-8 个球员项占位 |
| SL-SKEL-005 | 大数据量 | 球员数 > 20 | 进入页面 | 列表可滚动，骨架屏覆盖可见区域 |
| SL-SKEL-006 | 档位筛选 | 骨架屏显示中 | 切换档位筛选 | 不应触发骨架屏重新显示 |

#### 2.1.4 random-group 页面骨架屏

| 用例ID | 测试项 | 前置条件 | 测试步骤 | 预期结果 |
|--------|--------|----------|----------|----------|
| RG-SKEL-001 | 整体布局 | 进入分组设置页 | 1. 首次进入页面 | 依次显示：统计卡→队伍数选择→球员选择区 |
| RG-SKEL-002 | 档位标签占位 | 骨架屏显示中 | 检查档位区域 | 4 档各 6 个标签占位 |
| RG-SKEL-003 | 选择器状态 | 骨架屏显示中 | 检查队伍数选择器 | 数字选择器占位 |
| RG-SKEL-004 | 交互阻断 | 骨架屏显示中 | 点击选择球员 | 无响应，等待加载完成 |

#### 2.1.5 group-result 页面骨架屏

| 用例ID | 测试项 | 前置条件 | 测试步骤 | 预期结果 |
|--------|--------|----------|----------|----------|
| GR-SKEL-001 | 整体布局 | 进入分组结果页 | 1. 首次进入页面 | 依次显示：统计卡→多个队伍卡片 |
| GR-SKEL-002 | 队伍卡片占位 | 骨架屏显示中 | 检查队伍卡片 | 队伍名 + 5 个头像占位 |
| GR-SKEL-003 | 多队伍场景 | 队伍数 = 4 | 进入页面 | 显示 4 个队伍卡片骨架 |
| GR-SKEL-004 | 可滚动场景 | 队伍数 > 3 | 进入页面 | 页面可滚动，骨架屏覆盖完整 |

---

### 2.2 动画效果测试用例

#### 2.2.1 分组动画测试

| 用例ID | 测试项 | 前置条件 | 测试步骤 | 预期结果 |
|--------|--------|----------|----------|----------|
| GROUP-ANIM-001 | 触发条件 | 分组设置完成 | 点击"开始分组"按钮 | 动画开始播放 |
| GROUP-ANIM-002 | 卡片飞舞阶段 | 动画播放中 | 观察第一阶段 | 所有球员卡片向中心聚拢 |
| GROUP-ANIM-003 | 卡片聚合阶段 | 动画播放中 | 观察第二阶段 | 卡片按队伍聚合 |
| GROUP-ANIM-004 | 卡片落地阶段 | 动画播放中 | 观察第三阶段 | 卡片落到各自队伍位置 |
| GROUP-ANIM-005 | 动画完整性 | 动画播放完成 | 等待动画结束 | 动画完整执行，无中断 |
| GROUP-ANIM-006 | 动画时长 | 动画播放中 | 计时总时长 | 总时长 2-3 秒，各阶段平滑衔接 |
| GROUP-ANIM-007 | 多队伍场景 | 队伍数 = 4 | 执行分组动画 | 4 个队伍同时落地，布局合理 |
| GROUP-ANIM-008 | 大数据量 | 球员数 = 20 | 执行分组动画 | 动画流畅，无卡顿 |
| GROUP-ANIM-009 | 小数据量 | 球员数 = 6 | 执行分组动画 | 动画完整，无异常 |
| GROUP-ANIM-010 | 跳过动画 | 动画播放中 | 点击"跳过"按钮 | 立即显示结果，动画停止 |
| GROUP-ANIM-011 | 动画中断 | 动画播放中 | 返回上一页 | 动画停止，资源释放 |
| GROUP-ANIM-012 | 重复执行 | 已完成分组 | 再次点击分组 | 新动画正常播放，旧数据清除 |
| GROUP-ANIM-013 | 弱网环境 | 网络较慢 | 执行分组 | 动画在数据加载后播放，无卡顿 |

#### 2.2.2 页面切换动画测试

| 用例ID | 测试项 | 前置条件 | 测试步骤 | 预期结果 |
|--------|--------|----------|----------|----------|
| PAGE-ANIM-001 | 推入动画 | 页面 A | wx.navigateTo 到页面 B | 页面 B 从右侧滑入 |
| PAGE-ANIM-002 | 返回动画 | 页面 B | wx.navigateBack | 页面 B 向右滑出 |
| PAGE-ANIM-003 | Tab 切换 | Tab 页面 | 切换 Tab | 平滑切换，300ms 内完成 |
| PAGE-ANIM-004 | 快速切换 | 任意页面 | 快速切换多个页面 | 动画不冲突，无卡顿 |
| PAGE-ANIM-005 | 手势返回 | 页面 B | 从左边缘滑动返回 | 跟手动画，流畅自然 |

#### 2.2.3 弹窗动画测试

| 用例ID | 测试项 | 前置条件 | 测试步骤 | 预期结果 |
|--------|--------|----------|----------|----------|
| MODAL-ANIM-001 | 弹窗打开 | 触发弹窗条件 | 打开弹窗 | 从中心放大淡入 |
| MODAL-ANIM-002 | 弹窗关闭 | 弹窗打开状态 | 关闭弹窗 | 向中心缩小淡出 |
| MODAL-ANIM-003 | 遮罩层 | 弹窗打开 | 检查遮罩层 | 遮罩层同步淡入 |
| MODAL-ANIM-004 | 背景锁定 | 弹窗打开 | 尝试滚动背景 | 背景不可滚动 |
| MODAL-ANIM-005 | 多弹窗 | 弹窗 A 打开 | 打开弹窗 B | B 覆盖 A，动画正确 |

#### 2.2.4 按钮反馈动画测试

| 用例ID | 测试项 | 前置条件 | 测试步骤 | 预期结果 |
|--------|--------|----------|----------|----------|
| BTN-ANIM-001 | 点击缩放 | 按钮可点击 | 点击按钮 | 按钮缩小至 0.95 |
| BTN-ANIM-002 | 释放恢复 | 按钮按压中 | 释放按钮 | 按钮恢复原大小 |
| BTN-ANIM-003 | 禁用状态 | 按钮禁用 | 点击禁用按钮 | 无动画反馈 |
| BTN-ANIM-004 | 加载状态 | 异步操作中 | 点击提交按钮 | 显示 loading 动画 |
| BTN-ANIM-005 | 成功反馈 | 操作成功 | 完成操作 | 按钮变色 + 对勾动画 |

#### 2.2.5 微交互动画测试

| 用例ID | 测试项 | 前置条件 | 测试步骤 | 预期结果 |
|--------|--------|----------|----------|----------|
| MICRO-001 | 球员选中 | 球员未选中 | 点击选中球员 | 放大 + 边框出现 + 对勾 |
| MICRO-002 | 球员取消选中 | 球员已选中 | 点击取消选中 | 缩小 + 边框消失 |
| MICRO-003 | Toast 显示 | 触发 Toast | 显示 Toast | 从底部滑入，2s 后滑出 |
| MICRO-004 | Toast 队列 | 多个 Toast | 连续触发多个 Toast | 依次显示，不重叠 |
| MICRO-005 | 成功弹窗 | 分组完成 | 显示成功弹窗 | 对勾绘制动画 + 缩放 |
| MICRO-006 | 数字变化 | 档位变化 | 修改球员档位 | 数字滚动动画 |
| MICRO-007 | 列表项滑动 | 列表项可操作 | 左滑列表项 | 显示操作按钮 |

---

### 2.3 边界条件测试

| 用例ID | 测试项 | 测试场景 | 预期结果 |
|--------|--------|----------|----------|
| EDGE-001 | 空数据骨架屏 | 球队无成员 | 骨架屏后显示空状态 |
| EDGE-002 | 快速切换页面 | 1s 内切换 5 次 | 无内存泄漏，无卡顿 |
| EDGE-003 | 网络超时 | 请求超时 10s | 骨架屏消失，显示错误提示 |
| EDGE-004 | 动画中来电 | 动画播放中 | 来电中断动画，返回后可继续 |
| EDGE-005 | 小程序切后台 | 动画播放中 | 切后台，返回后动画重置或完成 |
| EDGE-006 | 内存警告 | 系统内存不足 | 降级动画或暂停，不崩溃 |
| EDGE-007 | 深色模式切换 | 骨架屏显示中 | 切换深色模式 | 骨架屏颜色适配 |
| EDGE-008 | 字体放大 | 系统字体放大 | 检查骨架屏 | 布局不错乱 |
| EDGE-009 | 极端数据量 | 球员数 = 100 | 进入页面 | 骨架屏显示，页面可滚动 |
| EDGE-010 | 弱网环境 | 2G 网络 | 进入页面 | 骨架屏显示，最终加载成功 |

---

## 三、性能测试方案

### 3.1 测试指标

| 指标 | 目标值 | 最低可接受值 | 测试方法 |
|------|--------|--------------|----------|
| **动画帧率** | 60 FPS | 45 FPS | PerfDog 真机监控 |
| **骨架屏加载时间** | < 100ms | < 200ms | 开发者工具性能分析 |
| **首次内容绘制** | < 500ms | < 800ms | 微信性能面板 |
| **动画 CPU 占用** | < 30% | < 50% | PerfDog 监控 |
| **内存增量** | < 10MB | < 20MB | 开发者工具内存分析 |
| **动画耗时** | 2-3s | - | 手动计时 |

### 3.2 测试工具配置

#### 3.2.1 PerfDog 配置

```
1. 安装 PerfDog 客户端
2. 连接测试设备（USB 或 WiFi）
3. 选择微信进程
4. 配置监控项：FPS、CPU、Memory
5. 设置采样间隔：100ms
6. 开始录制 → 执行测试场景 → 停止录制
7. 导出报告
```

#### 3.2.2 微信开发者工具性能分析

```
1. 打开开发者工具
2. 调试器 → Performance
3. 点击录制
4. 执行测试场景
5. 停止录制
6. 分析帧率、函数耗时
```

#### 3.2.3 vconsole 集成

```javascript
// app.js
import VConsole from 'vconsole'

if (process.env.NODE_ENV === 'development') {
  new VConsole()
}
```

### 3.3 性能测试场景

| 场景ID | 测试场景 | 测试步骤 | 通过标准 |
|--------|----------|----------|----------|
| PERF-001 | 骨架屏首次加载 | 1. 清除缓存<br>2. 进入 team-detail<br>3. 监控 FPS | FPS ≥ 55 |
| PERF-002 | 分组动画完整流程 | 1. 选择 20 个球员<br>2. 开始分组<br>3. 监控全过程 | FPS ≥ 45，CPU < 50% |
| PERF-003 | 快速页面切换 | 1. 快速切换 5 个页面<br>2. 每页停留 1s<br>3. 监控内存 | 内存增量 < 20MB |
| PERF-004 | 长时间使用 | 1. 连续使用 10 分钟<br>2. 执行各种操作<br>3. 监控内存 | 无内存泄漏 |
| PERF-005 | 大数据量渲染 | 1. 球员数 = 50<br>2. 进入 skill-level<br>3. 滚动列表 | FPS ≥ 50 |
| PERF-006 | 低端机骨架屏 | 1. 使用低端设备<br>2. 进入各页面<br>3. 监控加载时间 | 加载时间 < 200ms |
| PERF-007 | 低端机动画 | 1. 使用低端设备<br>2. 执行分组动画<br>3. 监控 FPS | FPS ≥ 30 |
| PERF-008 | 弱网加载 | 1. 模拟 2G 网络<br>2. 进入页面<br>3. 监控体验 | 骨架屏显示正常 |

### 3.4 性能监控方案

#### 3.4.1 线上性能监控

```javascript
// utils/performance.js
class PerformanceMonitor {
  constructor() {
    this.metrics = {}
  }

  // 记录骨架屏加载时间
  recordSkeletonLoad(pageName, duration) {
    this.metrics[`skeleton_${pageName}`] = duration
    this.report('skeleton_load', { pageName, duration })
  }

  // 记录动画帧率
  recordAnimationFPS(animName, avgFPS) {
    this.metrics[`anim_${animName}`] = avgFPS
    this.report('animation_fps', { animName, avgFPS })
  }

  // 上报数据
  report(eventName, data) {
    wx.reportAnalytics(eventName, data)
  }
}

export default new PerformanceMonitor()
```

#### 3.4.2 动画帧率监控

```javascript
// utils/fps-monitor.js
class FPSMonitor {
  constructor() {
    this.frames = []
    this.lastTime = 0
    this.monitoring = false
  }

  start() {
    this.monitoring = true
    this.lastTime = Date.now()
    this.tick()
  }

  tick() {
    if (!this.monitoring) return

    const now = Date.now()
    const delta = now - this.lastTime
    this.frames.push(delta)
    this.lastTime = now

    requestAnimationFrame(() => this.tick())
  }

  stop() {
    this.monitoring = false
    const avgFrameTime = this.frames.reduce((a, b) => a + b, 0) / this.frames.length
    const fps = 1000 / avgFrameTime
    this.frames = []
    return Math.round(fps)
  }
}

export default new FPSMonitor()
```

### 3.5 性能通过标准

| 分类 | 指标 | 高端机 | 中端机 | 低端机 |
|------|------|--------|--------|--------|
| **骨架屏** | 加载时间 | < 100ms | < 150ms | < 200ms |
| **分组动画** | 平均 FPS | ≥ 60 | ≥ 50 | ≥ 30 |
| **分组动画** | CPU 占用 | < 30% | < 40% | < 50% |
| **页面滚动** | 平均 FPS | ≥ 60 | ≥ 55 | ≥ 45 |
| **内存** | 增量 | < 10MB | < 15MB | < 20MB |

---

## 四、兼容性测试矩阵

### 4.1 设备兼容性

#### 4.1.1 iOS 设备矩阵

| 设备 | 系统版本 | 微信版本 | 屏幕尺寸 | 测试项 | 状态 |
|------|----------|----------|----------|--------|------|
| iPhone 15 Pro Max | iOS 17.2 | 8.0.44 | 6.7" | 全量测试 | ⬜ |
| iPhone 14 Pro | iOS 17.0 | 8.0.44 | 6.1" | 全量测试 | ⬜ |
| iPhone 13 | iOS 16.5 | 8.0.42 | 6.1" | 兼容性测试 | ⬜ |
| iPhone 12 | iOS 16.0 | 8.0.40 | 6.1" | 兼容性测试 | ⬜ |
| iPhone 11 | iOS 15.7 | 8.0.38 | 6.1" | 兼容性测试 | ⬜ |
| iPhone X | iOS 14.8 | 8.0.35 | 5.8" | 低端机测试 | ⬜ |
| iPhone SE (3rd) | iOS 16.0 | 8.0.40 | 4.7" | 小屏测试 | ⬜ |

#### 4.1.2 Android 设备矩阵

| 设备 | 系统版本 | 微信版本 | 屏幕尺寸 | 测试项 | 状态 |
|------|----------|----------|----------|--------|------|
| 小米 14 | Android 14 | 8.0.44 | 6.36" | 全量测试 | ⬜ |
| OPPO Find X6 | Android 13 | 8.0.42 | 6.74" | 兼容性测试 | ⬜ |
| 华为 P50 Pro | HarmonyOS 4 | 8.0.40 | 6.6" | 兼容性测试 | ⬜ |
| 华为 Mate 40 | HarmonyOS 3 | 8.0.38 | 6.5" | 兼容性测试 | ⬜ |
| vivo X90 | Android 13 | 8.0.40 | 6.78" | 兼容性测试 | ⬜ |
| 红米 Note 12 | Android 12 | 8.0.38 | 6.67" | 中端机测试 | ⬜ |
| 红米 Note 9 | Android 10 | 8.0.35 | 6.53" | 低端机测试 | ⬜ |

### 4.2 微信版本兼容性

| 微信版本 | 发布时间 | 测试重点 | 兼容性说明 |
|----------|----------|----------|------------|
| 8.0.44 | 2024.01 | 全量功能测试 | 最新版本，支持所有特性 |
| 8.0.42 | 2023.11 | 核心功能测试 | 主流版本 |
| 8.0.40 | 2023.09 | 核心功能测试 | 主流版本 |
| 8.0.38 | 2023.07 | 基础功能测试 | 较老版本 |
| 8.0.35 | 2023.04 | 基础功能测试 | 最低兼容版本 |

### 4.3 屏幕尺寸兼容性

| 尺寸分类 | 代表设备 | 分辨率 | 测试重点 |
|----------|----------|--------|----------|
| 小屏 (< 6") | iPhone SE | 750×1334 | 布局适配、字体大小 |
| 标准屏 (6-6.5") | iPhone 14 | 1170×2532 | 基准测试 |
| 大屏 (> 6.5") | iPhone 15 Pro Max | 1290×2796 | 布局拉伸、间距 |
| 长屏 | Android 全面屏 | 1080×2400 | 底部安全区 |

### 4.4 特殊场景兼容性

| 场景 | 测试内容 | 预期结果 |
|------|----------|----------|
| **深色模式** | 骨架屏颜色、动画效果 | 颜色自动适配，动画正常 |
| **系统字体放大** | 布局、骨架屏 | 布局自适应，无溢出 |
| **高对比度模式** | 可读性 | 内容清晰可辨 |
| **省电模式** | 动画性能 | 动画降级但功能正常 |
| **低电量 (< 20%)** | 动画表现 | 功能正常，可降级 |
| **横屏** | 布局适配 | 提示旋转或适配布局 |

---

## 五、自动化测试方案

### 5.1 单元测试用例

#### 5.1.1 骨架屏组件测试

```javascript
// __tests__/components/skeleton.test.js
describe('Skeleton Component', () => {
  test('should render with loading state', () => {
    const wrapper = mount(Skeleton, {
      propsData: { loading: true }
    })
    expect(wrapper.find('.skeleton-container').exists()).toBe(true)
  })

  test('should hide when loading is false', () => {
    const wrapper = mount(Skeleton, {
      propsData: { loading: false }
    })
    expect(wrapper.find('.skeleton-container').exists()).toBe(false)
  })

  test('should apply correct colors', () => {
    const wrapper = mount(Skeleton, {
      propsData: { loading: true }
    })
    const container = wrapper.find('.skeleton-container')
    expect(container.element.style.backgroundColor).toBe('#F2F2F2')
  })

  test('should animate with shimmer effect', () => {
    const wrapper = mount(Skeleton, {
      propsData: { loading: true }
    })
    const shimmer = wrapper.find('.skeleton-shimmer')
    expect(shimmer.exists()).toBe(true)
  })
})
```

#### 5.1.2 动画工具函数测试

```javascript
// __tests__/utils/animation.test.js
import { createGroupingAnimation, easeOutCubic } from '@/utils/animation'

describe('Animation Utils', () => {
  test('easeOutCubic should return correct value', () => {
    expect(easeOutCubic(0)).toBe(0)
    expect(easeOutCubic(1)).toBe(1)
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875, 3)
  })

  test('createGroupingAnimation should return animation config', () => {
    const config = createGroupingAnimation(4, 20)
    expect(config.duration).toBe(2500)
    expect(config.stages.length).toBe(3)
  })
})
```

### 5.2 E2E 测试场景

#### 5.2.1 骨架屏 E2E 测试

```javascript
// e2e/skeleton.spec.js
const automator = require('miniprogram-automator')

describe('Skeleton E2E Tests', () => {
  let miniProgram

  beforeAll(async () => {
    miniProgram = await automator.launch({
      cliPath: '/Applications/wechatwebdevtools.app/Contents/MacOS/cli',
      projectPath: '/path/to/project'
    })
  })

  afterAll(async () => {
    await miniProgram.close()
  })

  test('team-detail skeleton should display on first load', async () => {
    const page = await miniProgram.reLaunch('/pages/team-detail/team-detail?id=1')
    await page.waitFor(100)
    
    const skeleton = await page.$('.skeleton-container')
    expect(skeleton).not.toBeNull()
    
    await page.waitFor(1000)
    const content = await page.$('.team-info-card')
    expect(content).not.toBeNull()
  })

  test('skeleton should hide after data loaded', async () => {
    const page = await miniProgram.reLaunch('/pages/team-detail/team-detail?id=1')
    await page.waitFor(2000)
    
    const skeleton = await page.$('.skeleton-container')
    expect(skeleton).toBeNull()
  })
})
```

#### 5.2.2 分组动画 E2E 测试

```javascript
// e2e/group-animation.spec.js
describe('Group Animation E2E Tests', () => {
  test('grouping animation should complete successfully', async () => {
    // 1. 进入分组设置页
    const page = await miniProgram.reLaunch('/pages/team/random-group/random-group?teamId=1')
    await page.waitFor(1000)
    
    // 2. 选择球员
    const playerTags = await page.$$('.player-tag')
    for (let i = 0; i < Math.min(10, playerTags.length); i++) {
      await playerTags[i].tap()
    }
    
    // 3. 开始分组
    const startBtn = await page.$('.start-group-btn')
    await startBtn.tap()
    
    // 4. 等待动画完成
    await page.waitFor(3000)
    
    // 5. 验证结果页面
    const resultPage = await miniProgram.currentPage()
    expect(resultPage.path).toContain('group-result')
  })

  test('animation should be skippable', async () => {
    const page = await miniProgram.reLaunch('/pages/team/random-group/random-group?teamId=1')
    await page.waitFor(1000)
    
    // 选择球员并开始分组
    const startBtn = await page.$('.start-group-btn')
    await startBtn.tap()
    
    // 等待动画开始
    await page.waitFor(500)
    
    // 点击跳过
    const skipBtn = await page.$('.skip-animation-btn')
    if (skipBtn) {
      await skipBtn.tap()
      await page.waitFor(500)
      
      // 验证直接显示结果
      const result = await page.$('.group-result-container')
      expect(result).not.toBeNull()
    }
  })
})
```

### 5.3 性能自动化测试

```javascript
// e2e/performance.spec.js
describe('Performance E2E Tests', () => {
  test('skeleton load time should be under 200ms', async () => {
    const startTime = Date.now()
    const page = await miniProgram.reLaunch('/pages/team-detail/team-detail?id=1')
    
    await page.waitFor('.skeleton-container')
    const loadTime = Date.now() - startTime
    
    expect(loadTime).toBeLessThan(200)
  })

  test('animation FPS should be above 45', async () => {
    const page = await miniProgram.reLaunch('/pages/team/random-group/random-group?teamId=1')
    await page.waitFor(1000)
    
    // 开始性能监控
    await page.callMethod('startFPSMonitor')
    
    // 执行分组动画
    const startBtn = await page.$('.start-group-btn')
    await startBtn.tap()
    await page.waitFor(3000)
    
    // 获取 FPS 数据
    const fpsData = await page.callMethod('stopFPSMonitor')
    expect(fpsData.averageFPS).toBeGreaterThanOrEqual(45)
  })
})
```

### 5.4 测试执行脚本

```bash
#!/bin/bash
# scripts/run-e2e-tests.sh

echo "Running E2E Tests..."

# 运行骨架屏测试
npx jest e2e/skeleton.spec.js --config=jest.e2e.config.js

# 运行动画测试
npx jest e2e/group-animation.spec.js --config=jest.e2e.config.js

# 运行性能测试
npx jest e2e/performance.spec.js --config=jest.e2e.config.js

# 生成测试报告
npx jest --coverage --config=jest.e2e.config.js

echo "E2E Tests completed!"
```

---

## 六、验收标准

### 6.1 功能验收清单

#### 6.1.1 骨架屏功能

| 验收项 | 验收标准 | 状态 |
|--------|----------|------|
| ✅ 组件化设计 | 骨架屏可复用，配置灵活 | ⬜ |
| ✅ 四页面覆盖 | team-detail、skill-level、random-group、group-result 均有骨架屏 | ⬜ |
| ✅ 扫光动画 | 1.5s 循环，流畅无卡顿 | ⬜ |
| ✅ 颜色规范 | 背景 #F2F2F2，占位 #E6E6E6 | ⬜ |
| ✅ 圆角统一 | 所有占位块圆角 16rpx | ⬜ |
| ✅ 加载切换 | 数据加载完成后平滑切换到真实内容 | ⬜ |
| ✅ 空状态处理 | 无数据时显示空状态，非骨架屏 | ⬜ |
| ✅ 刷新场景 | 下拉刷新时显示骨架屏 | ⬜ |
| ✅ 缓存场景 | 有缓存时直接显示内容 | ⬜ |

#### 6.1.2 分组动画功能

| 验收项 | 验收标准 | 状态 |
|--------|----------|------|
| ✅ 触发条件 | 点击"开始分组"触发动画 | ⬜ |
| ✅ 三阶段动画 | 飞舞 → 聚合 → 落地，完整执行 | ⬜ |
| ✅ 动画时长 | 总时长 2-3s，各阶段衔接自然 | ⬜ |
| ✅ 多队伍支持 | 支持 2-5 个队伍的分组动画 | ⬜ |
| ✅ 大数据量 | 20 个球员动画流畅 | ⬜ |
| ✅ 跳过功能 | 可跳过动画直接查看结果 | ⬜ |
| ✅ 中断处理 | 返回页面时动画停止，资源释放 | ⬜ |

#### 6.1.3 基础动画功能

| 验收项 | 验收标准 | 状态 |
|--------|----------|------|
| ✅ 页面切换 | 推入/返回动画自然流畅 | ⬜ |
| ✅ 弹窗动画 | 打开/关闭动画正确 | ⬜ |
| ✅ 按钮反馈 | 点击缩放效果正确 | ⬜ |
| ✅ 微交互 | 选中、Toast、成功弹窗动画正确 | ⬜ |

### 6.2 性能验收标准

#### 6.2.1 帧率标准

| 场景 | 高端机 | 中端机 | 低端机 | 验收状态 |
|------|--------|--------|--------|----------|
| 骨架屏加载 | ≥ 60 FPS | ≥ 55 FPS | ≥ 45 FPS | ⬜ |
| 分组动画 | ≥ 60 FPS | ≥ 50 FPS | ≥ 30 FPS | ⬜ |
| 页面滚动 | ≥ 60 FPS | ≥ 55 FPS | ≥ 45 FPS | ⬜ |
| 列表滚动 | ≥ 60 FPS | ≥ 50 FPS | ≥ 40 FPS | ⬜ |

#### 6.2.2 加载时间标准

| 场景 | 目标值 | 最低可接受值 | 验收状态 |
|------|--------|--------------|----------|
| 骨架屏显示 | < 100ms | < 200ms | ⬜ |
| 首次内容绘制 | < 500ms | < 800ms | ⬜ |
| 分组动画完成 | 2-3s | - | ⬜ |

#### 6.2.3 资源占用标准

| 指标 | 目标值 | 最低可接受值 | 验收状态 |
|------|--------|--------------|----------|
| 动画 CPU 占用 | < 30% | < 50% | ⬜ |
| 内存增量 | < 10MB | < 20MB | ⬜ |
| 无内存泄漏 | 10 分钟测试内存稳定 | - | ⬜ |

### 6.3 兼容性验收标准

#### 6.3.1 设备兼容性

| 分类 | 验收标准 | 验收状态 |
|------|----------|----------|
| iOS 高端机 | 全部功能正常，性能达标 | ⬜ |
| iOS 中端机 | 全部功能正常，性能达标 | ⬜ |
| iOS 低端机 | 功能正常，性能可接受 | ⬜ |
| Android 高端机 | 全部功能正常，性能达标 | ⬜ |
| Android 中端机 | 全部功能正常，性能达标 | ⬜ |
| Android 低端机 | 功能正常，性能可接受 | ⬜ |

#### 6.3.2 微信版本兼容性

| 版本 | 验收标准 | 验收状态 |
|------|----------|----------|
| 8.0.44+ | 全部功能正常 | ⬜ |
| 8.0.40 | 全部功能正常 | ⬜ |
| 8.0.35 | 核心功能正常 | ⬜ |

#### 6.3.3 特殊场景兼容性

| 场景 | 验收标准 | 验收状态 |
|------|----------|----------|
| 深色模式 | 颜色自适应，动画正常 | ⬜ |
| 系统字体放大 | 布局自适应 | ⬜ |
| 省电模式 | 动画降级，功能正常 | ⬜ |
| 低电量 | 功能正常 | ⬜ |

### 6.4 用户体验验收

#### 6.4.1 主观评分标准

| 维度 | 评分方式 | 通过标准 |
|------|----------|----------|
| 动画流畅度 | 1-5 分评分 | 平均分 ≥ 4.0 |
| 加载体验 | 1-5 分评分 | 平均分 ≥ 4.0 |
| 交互反馈 | 1-5 分评分 | 平均分 ≥ 4.0 |
| 整体满意度 | 1-5 分评分 | 平均分 ≥ 4.0 |

#### 6.4.2 用户测试问卷

```
Basketball 小程序体验调研

1. 加载页面时，骨架屏是否让你感觉等待时间变短了？
   □ 明显变短  □ 稍微变短  □ 没感觉  □ 反而更长了

2. 分组动画的流畅度如何？
   □ 非常流畅  □ 比较流畅  □ 一般  □ 稍微卡顿  □ 很卡

3. 动画时长是否合适？
   □ 太长了  □ 合适  □ 太短了

4. 按钮点击反馈是否明显？
   □ 非常明显  □ 比较明显  □ 一般  □ 不明显

5. 整体体验满意度（1-5 分）：____ 分

6. 其他建议：________________
```

### 6.5 验收流程

```
1. 开发自测
   ├── 功能完整性自测
   ├── 性能基础测试
   └── 修复明显问题

2. 内部测试
   ├── 测试团队执行功能测试
   ├── 性能测试（高端机/中端机）
   └── 输出测试报告

3. 兼容性测试
   ├── 覆盖设备矩阵
   ├── 覆盖微信版本
   └── 输出兼容性报告

4. 用户体验测试
   ├── 邀请 10-20 位用户
   ├── 执行测试任务
   └── 收集反馈问卷

5. 验收评审
   ├── 检查验收清单
   ├── 审核测试报告
   └── 决定是否发布

6. 灰度发布
   ├── 5% 用户灰度
   ├── 监控性能数据
   └── 逐步扩大范围
```

---

## 七、测试进度安排

### 7.1 测试里程碑

| 阶段 | 时间 | 主要任务 | 交付物 |
|------|------|----------|--------|
| **测试准备** | 第 1 周 | 编写测试用例、准备环境 | 测试用例文档、环境配置 |
| **功能测试** | 第 2 周 | 执行功能测试用例 | 功能测试报告 |
| **性能测试** | 第 3 周 | 性能测试、优化验证 | 性能测试报告 |
| **兼容性测试** | 第 3-4 周 | 设备兼容性测试 | 兼容性测试报告 |
| **用户体验测试** | 第 4 周 | 用户测试、收集反馈 | 用户反馈报告 |
| **验收评审** | 第 5 周 | 验收评审、灰度准备 | 验收报告 |

### 7.2 测试资源需求

| 角色 | 人数 | 工作内容 |
|------|------|----------|
| 测试工程师 | 2 | 功能测试、性能测试、兼容性测试 |
| 用户体验研究员 | 1 | 用户测试组织、问卷分析 |
| 开发工程师 | 1 | Bug 修复、性能优化 |
| 产品经理 | 1 | 验收评审、需求确认 |

---

## 八、风险与应对

### 8.1 测试风险

| 风险 | 可能性 | 影响 | 应对措施 |
|------|--------|------|----------|
| 低端机性能不达标 | 中 | 高 | 提供动画降级方案 |
| 兼容性问题多 | 中 | 中 | 扩大测试覆盖，提前修复 |
| 用户反馈差 | 低 | 高 | 增加内测用户，快速迭代 |
| 测试时间不足 | 中 | 中 | 优先 P0 用例，合理分配资源 |

### 8.2 降级方案

| 场景 | 降级策略 |
|------|----------|
| 低端机动画卡顿 | 简化动画（移除飞舞阶段） |
| FPS < 30 | 禁用动画，直接显示结果 |
| 内存不足 | 移除扫光动画 |
| 微信版本过低 | 提示升级微信 |

---

## 附录

### A. 测试用例检查清单

- [ ] SKEL-001 ~ SKEL-008（骨架屏通用组件）
- [ ] TD-SKEL-001 ~ TD-SKEL-008（team-detail 骨架屏）
- [ ] SL-SKEL-001 ~ SL-SKEL-006（skill-level 骨架屏）
- [ ] RG-SKEL-001 ~ RG-SKEL-004（random-group 骨架屏）
- [ ] GR-SKEL-001 ~ GR-SKEL-004（group-result 骨架屏）
- [ ] GROUP-ANIM-001 ~ GROUP-ANIM-013（分组动画）
- [ ] PAGE-ANIM-001 ~ PAGE-ANIM-005（页面切换动画）
- [ ] MODAL-ANIM-001 ~ MODAL-ANIM-005（弹窗动画）
- [ ] BTN-ANIM-001 ~ BTN-ANIM-005（按钮反馈动画）
- [ ] MICRO-001 ~ MICRO-007（微交互动画）
- [ ] EDGE-001 ~ EDGE-010（边界条件）

### B. 性能测试检查清单

- [ ] PERF-001：骨架屏首次加载
- [ ] PERF-002：分组动画完整流程
- [ ] PERF-003：快速页面切换
- [ ] PERF-004：长时间使用
- [ ] PERF-005：大数据量渲染
- [ ] PERF-006：低端机骨架屏
- [ ] PERF-007：低端机动画
- [ ] PERF-008：弱网加载

### C. 相关文档链接

- [UX 优化开发计划](./ux-enhancement-plan.md)
- [随机分组功能计划](./random-team-feature-plan.md)
- [开发进度跟踪](./dev-progress.md)

---

> 文档维护：测试团队
> 最后更新：2026-02-26
