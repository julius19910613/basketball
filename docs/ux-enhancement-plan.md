# Basketball 小程序 - 用户体验优化开发计划

> 版本：v1.0
> 日期：2026-02-26
> 状态：待评审

---

## 一、项目背景

Basketball 小程序目前已实现核心功能（球队管理、球员管理、分组功能），但在用户体验方面仍有提升空间。本次优化聚焦两个方向：

1. **优化加载体验** - 通过骨架屏减少用户等待焦虑
2. **添加动画效果** - 通过丰富的动画提升交互愉悦感

---

## 二、功能设计

### 2.1 骨架屏设计

#### 2.1.1 页面优先级

| 页面 | 路径 | 优先级 | 理由 |
|------|------|--------|------|
| 球队详情 | `/pages/team-detail/team-detail` | P0 | 用户访问最频繁，加载内容包括球队信息+成员列表 |
| 能力档位设置 | `/pages/team/skill-level/skill-level` | P0 | 数据量大（所有球员），需要展示统计卡片 |
| 分组设置 | `/pages/team/random-group/random-group` | P1 | 包含复杂的选择器状态，用户停留时间长 |
| 分组结果 | `/pages/team/group-result/group-result` | P1 | 展示数据量最大，包含多个队伍卡片 |
| 球队列表 | `/pages/teams/teams` | P2 | 列表页，可考虑使用通用骨架屏 |
| 成员管理 | `/pages/member-manage/member-manage` | P2 | 管理页面，操作频繁 |

#### 2.1.2 骨架屏设计规范

**通用原则：**
- 灰色调：使用 `#F2F2F2` 作为骨架背景，`#E6E6E6` 作为占位块
- 圆角统一：16rpx（与现有卡片风格一致）
- 动画效果：微弱的左右渐变扫光动画（1.5s 循环）

**各页面骨架屏布局：**

##### team-detail（球队详情）

```
┌─────────────────────────────────┐
│ ┌─────────────────────────────┐ │  ← 球队信息卡片骨架
│ │  ┌────┐                     │ │
│ │  │ ○  │  ████████████       │ │  ← 队徽圆形占位 + 名称
│ │  └────┘  ██████             │ │  ← 地区、颜色标签
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │  ← 快捷入口骨架
│ │  ┌──┐  ██████████       ›  │ │
│ │  └──┘                      │ │
│ │  ┌──┐  ██████████       ›  │ │
│ │  └──┘                      │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │  ← 成员列表骨架
│ │  ████████████████████████   │ │
│ │  ┌──┐  ████████  ████       │ │
│ │  └──┘                        │ │
│ │  ┌──┐  ████████  ████       │ │  ← 3-5 个成员占位
│ │  └──┘                        │ │
│ │  ┌──┐  ████████  ████       │ │
│ │  └──┘                        │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

##### skill-level（能力档位设置）

```
┌─────────────────────────────────┐
│ ┌─────────────────────────────┐ │  ← 统计卡片骨架
│ │  ████████████     ██████    │ │
│ │  ┌────┐ ┌────┐ ┌────┐ ┌───┐│ │  ← 档位分布（4个圆点+标签）
│ │  │ ●  │ │ ●  │ │ ●  │ │ ● ││ │
│ │  └────┘ └────┘ └────┘ └───┘│ │
│ │  ██████████████████████     │ │  ← 平均档位
│ └─────────────────────────────┘ │
│                                 │
│ ┌────┐  ┌────┐                  │  ← 快捷操作骨架
│ └────┘  └────┘                  │
│                                 │
│ ┌─────────────────────────────┐ │  ← 球员列表骨架
│ │  ┌──┐  ████████  ████   ›  │ │
│ │  └──┘                        │ │
│ │  ┌──┐  ████████  ████   ›  │ │  ← 5-8 个球员占位
│ │  └──┘                        │ │
│ │  ┌──┐  ████████  ████   ›  │ │
│ │  └──┘                        │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

##### random-group（分组设置）

```
┌─────────────────────────────────┐
│ ┌─────────────────────────────┐ │  ← 已选统计骨架
│ │  ████████          ██████   │ │
│ │  ┌────┐ ┌────┐ ┌────┐ ┌───┐│ │
│ │  └────┘ └────┘ └────┘ └───┘│ │
│ └─────────────────────────────┘ │
│                                 │
│ ████████████                    │  ← 队伍数量选择器
│                                 │
│ ┌─────────────────────────────┐ │  ← 球员选择区骨架
│ │  ████████████████████       │ │
│ │  ┌───┐ ┌───┐ ┌───┐ ┌───┐   │ │
│ │  │   │ │   │ │   │ │   │   │ │  ← 球员标签占位（4档各6个）
│ │  └───┘ └───┘ └───┘ └───┘   │ │
│ │  ┌───┐ ┌───┐ ┌───┐ ┌───┐   │ │
│ │  │   │ │   │ │   │ │   │   │ │
│ │  └───┘ └───┘ └───┘ └───┘   │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

##### group-result（分组结果）

```
┌─────────────────────────────────┐
│ ┌─────────────────────────────┐ │  ← 顶部统计骨架
│ │  ██████████                 │ │
│ │  ████████████████████       │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │  ← 队伍卡片1骨架
│ │  ████████████  ██████       │ │
│ │  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ │ │  ← 队伍头像占位
│ │  └──┘ └──┘ └──┘ └──┘ └──┘ │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │  ← 队伍卡片2骨架
│ │  ████████████  ██████       │ │
│ │  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ │ │
│ │  └──┘ └──┘ └──┘ └──┘ └──┘ │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │  ← 队伍卡片3/4骨架（可滚动）
│ │  ████████████  ██████       │ │
│ │  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ │ │
│ │  └──┘ └──┘ └──┘ └──┘ └──┘ │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

#### 2.1.3 加载状态切换逻辑

```
页面生命周期：
onLoad → setData({loading: true}) → 显示骨架屏
    ↓
请求数据（并发）
    ↓
Promise.all([
  fetchTeamInfo(),
  fetchMembers(),
  ...
])
    ↓
setData({
  loading: false,
  ...data
})
    ↓
显示真实内容 + 淡入动画
```

**防抖策略：**
- 数据请求 < 500ms：直接显示内容（避免骨架屏闪烁）
- 数据请求 > 500ms：显示骨架屏
- 数据请求 > 3s：显示加载进度或错误提示

---

### 2.2 动画效果设计

#### 2.2.1 分组动画（重点）

**场景：** 用户点击"开始分组"后，展示分组过程和结果

**动画流程：**

```
1. 准备阶段（0-500ms）
   ┌─────────────────────────────────┐
   │   已选球员卡片从各档位区域飞出    │
   │   → 聚合到屏幕中心               │
   │   → 卡片缩略图，堆叠在一起        │
   └─────────────────────────────────┘
   
2. 随机飞舞阶段（500-2000ms）
   ┌─────────────────────────────────┐
   │   卡片在中心旋转、飞舞            │
   │   → 营造"随机"的视觉效果         │
   │   → 配合音效（可选）              │
   └─────────────────────────────────┘
   
3. 分组落地阶段（2000-3500ms）
   ┌─────────────────────────────────┐
   │   卡片按队伍依次飞向目标区域      │
   │   → 每队卡片依次落地              │
   │   → 落地时有轻微弹跳效果          │
   │   → 队伍卡片展开                  │
   └─────────────────────────────────┘
   
4. 结果展示阶段（3500-4000ms）
   ┌─────────────────────────────────┐
   │   所有队伍卡片完全展示            │
   │   → 统计数据淡入                  │
   │   → 平衡指示器动画                │
   └─────────────────────────────────┘
```

**技术实现关键点：**
- 使用 CSS transform + transition 实现位置移动
- 使用 CSS animation 实现旋转、弹跳
- 使用 wx.createSelectorQuery 获取元素位置
- 使用 Promise 链式调用控制时序

#### 2.2.2 页面切换动画

**支持的切换场景：**

| 场景 | 动画效果 | 时长 |
|------|----------|------|
| 列表 → 详情 | 从右向左滑入 | 300ms |
| 详情 → 列表 | 从左向右滑出 | 300ms |
| 弹窗打开 | 从底部弹起 + 背景淡入 | 250ms |
| 弹窗关闭 | 向下滑落 + 背景淡出 | 250ms |
| Tab 切换 | 内容淡入淡出 | 200ms |

**实现方式：**
```css
/* 页面进入动画 */
.page-enter {
  transform: translateX(100%);
  opacity: 0;
}
.page-enter-active {
  transform: translateX(0);
  opacity: 1;
  transition: all 300ms ease-out;
}

/* 弹窗动画 */
.popup-enter {
  transform: translateY(100%);
}
.popup-enter-active {
  transform: translateY(0);
  transition: transform 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* 背景遮罩 */
.mask-enter {
  opacity: 0;
}
.mask-enter-active {
  opacity: 1;
  transition: opacity 250ms;
}
```

#### 2.2.3 按钮交互动画

**1. 点击反馈（所有按钮）**
```css
.btn:active {
  transform: scale(0.95);
  opacity: 0.8;
  transition: all 100ms;
}
```

**2. 加载状态**
```
┌─────────────────────────────────┐
│  保存中  ●○○                    │  ← 三个点依次跳动
│  保存中  ○●○                    │
│  保存中  ○○●                    │
└─────────────────────────────────┘
```

**3. 禁用状态**
```css
.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  /* 无动画，保持静止 */
}
```

**4. 成功状态**
```
┌─────────────────────────────────┐
│  按钮背景变绿 ✓                  │
│  → 图标放大弹出                  │
│  → 500ms 后恢复正常              │
└─────────────────────────────────┘
```

#### 2.2.4 成功/失败反馈动画

**成功反馈：**

1. **Toast 轻提示**
   ```
   ┌─────────────────────────────────┐
   │         ✓ 操作成功              │  ← 从顶部滑入，停留 1.5s，滑出
   └─────────────────────────────────┘
   ```

2. **成功弹窗**（重要操作）
   ```
   ┌─────────────────────────────────┐
   │         ┌────┐                  │
   │         │ ✓  │  ← 绿色圆圈放大   │
   │         └────┘     + 打勾动画   │
   │      分组保存成功！              │
   │      [ 确定 ]                   │
   └─────────────────────────────────┘
   ```

3. **Lottie 动画**（可选，高优先级场景）
   - 使用简单的成功动画（如打勾、庆祝彩带）
   - 动画时长：1-2s

**失败反馈：**

1. **Toast 错误提示**
   ```
   ┌─────────────────────────────────┐
   │         ✗ 网络请求失败          │  ← 红色背景，抖动效果
   └─────────────────────────────────┘
   ```

2. **错误页面**
   ```
   ┌─────────────────────────────────┐
   │         ┌────┐                  │
   │         │ 😢 │  ← 抖动动画       │
   │         └────┘                  │
   │      加载失败                    │
   │      [ 重新加载 ]               │
   └─────────────────────────────────┘
   ```

3. **抖动动画实现**
   ```css
   @keyframes shake {
     0%, 100% { transform: translateX(0); }
     10%, 30%, 50%, 70%, 90% { transform: translateX(-5rpx); }
     20%, 40%, 60%, 80% { transform: translateX(5rpx); }
   }
   .shake {
     animation: shake 0.5s ease-in-out;
   }
   ```

#### 2.2.5 其他微交互

**1. 球员卡片选中**
```
未选中:  ┌─────────┐
        │ 张三    │  白色背景，无边框
        └─────────┘

选中:    ┌─────────┐
        │✓ 张三   │  主题色边框，背景色变化
        └─────────┘
        
动画:    边框逐渐加粗 + 缩放弹跳
```

**2. 档位标签切换**
```
点击时:  标签放大到 1.1 倍 → 弹回 1.0
切换:    旧档位淡出 → 新档位淡入
```

**3. 列表项进入动画**
```css
/* 依次进入，每个间隔 50ms */
.member-item:nth-child(1) { animation-delay: 0ms; }
.member-item:nth-child(2) { animation-delay: 50ms; }
.member-item:nth-child(3) { animation-delay: 100ms; }
/* ... */

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**4. 下拉刷新**
```
┌─────────────────────────────────┐
│         ⟳ 正在刷新...           │  ← 圆圈旋转动画
└─────────────────────────────────┘
```

---

## 三、技术方案

### 3.1 骨架屏实现方案

#### 方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **方案1：自定义组件** | 灵活可控，样式统一 | 需手动维护 | ⭐⭐⭐⭐⭐ |
| 方案2：WeUI 扩展 | 官方支持，快速集成 | 样式定制受限 | ⭐⭐⭐⭐ |
| 方案3：miniprogram-skeleton | 第三方库，开箱即用 | 需要额外依赖 | ⭐⭐⭐ |
| 方案4：纯 CSS | 无 JS 依赖 | 难以复用 | ⭐⭐ |

**推荐方案：自定义组件 + CSS 动画**

**组件结构：**
```
/components/skeleton/
├── skeleton.js
├── skeleton.json
├── skeleton.wxml
├── skeleton.wxss
└── README.md
```

**设计思路：**
1. 创建通用 `skeleton` 组件，支持多种布局模式
2. 每个页面创建专属的骨架屏布局组件（如 `team-detail-skeleton`）
3. 在页面中使用 `wx:if` 控制骨架屏与真实内容的切换

### 3.2 动画实现方案

#### 技术选型

| 动画类型 | 技术方案 | 理由 |
|----------|----------|------|
| 简单过渡动画 | CSS transition | 性能好，代码简洁 |
| 复杂关键帧动画 | CSS animation | 可定义复杂动画序列 |
| 分组飞舞动画 | CSS transform + setTimeout | 需要精确控制时序 |
| 成功/失败反馈 | Lottie（可选） | 视觉效果好，但需引入库 |
| 列表动画 | CSS animation + animation-delay | 实现简单，性能好 |

**关键技术点：**

1. **启用 GPU 加速**
   ```css
   .animated-element {
     transform: translateZ(0);
     will-change: transform, opacity;
   }
   ```

2. **使用 CSS 变量控制动画**
   ```css
   page {
     --animation-duration: 300ms;
     --animation-timing: cubic-bezier(0.25, 0.46, 0.45, 0.94);
   }
   
   .animate {
     animation-duration: var(--animation-duration);
     animation-timing-function: var(--animation-timing);
   }
   ```

3. **小程序动画 API（备选）**
   ```javascript
   // 对于复杂动画，可使用 wx.createAnimation
   const animation = wx.createAnimation({
     duration: 400,
     timingFunction: 'ease-out',
   });
   ```

### 3.3 性能考虑

#### 骨架屏性能

1. **避免骨架屏闪烁**
   ```javascript
   // 方案：设置最小显示时间
   const MIN_SKELETON_TIME = 500;
   const startTime = Date.now();
   
   fetchData().then(data => {
     const elapsed = Date.now() - startTime;
     const delay = Math.max(0, MIN_SKELETON_TIME - elapsed);
     
     setTimeout(() => {
       this.setData({ loading: false, ...data });
     }, delay);
   });
   ```

2. **骨架屏组件懒加载**
   ```json
   {
     "usingComponents": {
       "skeleton": "/components/skeleton/skeleton"
     }
   }
   ```

#### 动画性能

1. **仅动画 transform 和 opacity**
   - ✅ `transform: translate/scale/rotate`
   - ✅ `opacity`
   - ❌ `width/height/top/left`（触发重排）
   - ❌ `margin/padding`（触发重排）

2. **控制同时播放的动画数量**
   - 分组动画：最多同时动画 20 个元素
   - 列表动画：使用虚拟列表，仅动画可见项

3. **动画结束后清理**
   ```javascript
   // 动画结束后移除 animation 类
   onAnimationEnd(e) {
     const { index } = e.currentTarget.dataset;
     this.setData({
       [`animations[${index}]`]: ''
     });
   }
   ```

4. **低端机降级方案**
   ```javascript
   // 检测设备性能
   const systemInfo = wx.getSystemInfoSync();
   const isLowEnd = systemInfo.platform === 'android' && 
                    systemInfo.SDKVersion < '2.10.0';
   
   // 降级策略
   if (isLowEnd) {
     // 禁用复杂动画
     // 简化为淡入淡出
   }
   ```

---

## 四、开发任务拆分

### 4.1 任务列表

#### 阶段一：骨架屏（预估 5 人日）

| 任务ID | 任务描述 | 负责人 | 预估工时 | 优先级 | 依赖 |
|--------|----------|--------|----------|--------|------|
| S-01 | 创建通用骨架屏组件 `skeleton` | - | 0.5人日 | P0 | - |
| S-02 | 实现骨架屏扫光动画 | - | 0.5人日 | P0 | S-01 |
| S-03 | team-detail 页面骨架屏 | - | 0.5人日 | P0 | S-01 |
| S-04 | skill-level 页面骨架屏 | - | 0.5人日 | P0 | S-01 |
| S-05 | random-group 页面骨架屏 | - | 0.5人日 | P1 | S-01 |
| S-06 | group-result 页面骨架屏 | - | 0.5人日 | P1 | S-01 |
| S-07 | teams 列表页骨架屏 | - | 0.5人日 | P2 | S-01 |
| S-08 | 加载状态优化（防抖、最小显示时间） | - | 0.5人日 | P0 | S-03~S-07 |
| S-09 | 骨架屏样式调优与测试 | - | 0.5人日 | P0 | S-03~S-07 |
| S-10 | 文档编写 | - | 0.5人日 | P1 | S-08 |

#### 阶段二：基础动画（预估 3 人日）

| 任务ID | 任务描述 | 负责人 | 预估工时 | 优先级 | 依赖 |
|--------|----------|--------|----------|--------|------|
| A-01 | 创建动画样式库 `animations.wxss` | - | 0.5人日 | P0 | - |
| A-02 | 页面切换动画（左右滑动） | - | 0.5人日 | P0 | A-01 |
| A-03 | 弹窗打开/关闭动画 | - | 0.5人日 | P0 | A-01 |
| A-04 | 按钮点击反馈动画 | - | 0.5人日 | P0 | A-01 |
| A-05 | Toast 提示动画（成功/失败） | - | 0.5人日 | P0 | A-01 |
| A-06 | 列表项进入动画 | - | 0.5人日 | P1 | A-01 |

#### 阶段三：分组动画（预估 4 人日）

| 任务ID | 任务描述 | 负责人 | 预估工时 | 优先级 | 依赖 |
|--------|----------|--------|----------|--------|------|
| G-01 | 分组动画 - 准备阶段（卡片聚合） | - | 1人日 | P0 | A-01 |
| G-02 | 分组动画 - 飞舞阶段（旋转、随机） | - | 1人日 | P0 | G-01 |
| G-03 | 分组动画 - 落地阶段（分队、弹跳） | - | 1人日 | P0 | G-02 |
| G-04 | 分组动画 - 结果展示（淡入、统计） | - | 0.5人日 | P0 | G-03 |
| G-05 | 分组动画 - 低端机降级方案 | - | 0.5人日 | P1 | G-03 |

#### 阶段四：反馈动画与优化（预估 2 人日）

| 任务ID | 任务描述 | 负责人 | 预估工时 | 优先级 | 依赖 |
|--------|----------|--------|----------|--------|------|
| F-01 | 球员卡片选中动画 | - | 0.5人日 | P1 | A-01 |
| F-02 | 档位标签切换动画 | - | 0.5人日 | P1 | A-01 |
| F-03 | 成功弹窗动画（打勾效果） | - | 0.5人日 | P1 | A-01 |
| F-04 | 整体性能优化与测试 | - | 0.5人日 | P0 | 所有 |

### 4.2 甘特图（简化版）

```
Week 1:
  [S-01][S-02]                    ← 骨架屏组件开发
       [S-03][S-04]               ← P0 页面骨架屏
            [S-05][S-06]          ← P1 页面骨架屏
                 [S-08][S-09]     ← 加载优化 + 调试

Week 2:
  [A-01][A-02][A-03]              ← 劺画基础库 + 页面切换
                 [A-04][A-05]     ← 按钮反馈 + Toast
                      [A-06]      ← 列表动画

Week 3:
  [G-01][G-02][G-03][G-04]        ← 分组动画（核心）
                          [G-05]  ← 降级方案

Week 4:
  [F-01][F-02][F-03]              ← 微交互动画
                 [F-04]           ← 性能优化 + 测试
```

### 4.3 总工时估算

| 阶段 | 工时 | 说明 |
|------|------|------|
| 阶段一：骨架屏 | 5 人日 | 核心体验优化 |
| 阶段二：基础动画 | 3 人日 | 通用动画库 |
| 阶段三：分组动画 | 4 人日 | 重点功能，需要精细调试 |
| 阶段四：反馈动画 | 2 人日 | 锦上添花 |
| **总计** | **14 人日** | 约 3 周（单人开发） |

---

## 五、代码示例

### 5.1 骨架屏组件代码示例

#### `/components/skeleton/skeleton.wxml`

```xml
<view class="skeleton-container {{theme}} ">
  <!-- 头部骨架（队徽 + 标题） -->
  <view class="skeleton-header" wx:if="{{showHeader}}">
    <view class="skeleton-avatar skeleton-shimmer"></view>
    <view class="skeleton-title-group">
      <view class="skeleton-title skeleton-shimmer"></view>
      <view class="skeleton-subtitle skeleton-shimmer"></view>
    </view>
  </view>

  <!-- 统计卡片骨架 -->
  <view class="skeleton-stats" wx:if="{{showStats}}">
    <view class="skeleton-stats-header skeleton-shimmer"></view>
    <view class="skeleton-stats-dots">
      <view class="skeleton-dot-group" wx:for="{{[1,2,3,4]}}" wx:key="index">
        <view class="skeleton-dot skeleton-shimmer"></view>
        <view class="skeleton-dot-label skeleton-shimmer"></view>
      </view>
    </view>
    <view class="skeleton-stats-footer skeleton-shimmer"></view>
  </view>

  <!-- 列表骨架 -->
  <view class="skeleton-list" wx:if="{{showList}}">
    <view class="skeleton-list-header skeleton-shimmer" wx:if="{{listTitle}}"></view>
    <view class="skeleton-list-items">
      <view class="skeleton-list-item" wx:for="{{listCount}}" wx:key="index">
        <view class="skeleton-item-avatar skeleton-shimmer"></view>
        <view class="skeleton-item-content">
          <view class="skeleton-item-title skeleton-shimmer"></view>
          <view class="skeleton-item-desc skeleton-shimmer"></view>
        </view>
        <view class="skeleton-item-tag skeleton-shimmer" wx:if="{{showTags}}"></view>
        <view class="skeleton-item-arrow skeleton-shimmer" wx:if="{{showArrows}}"></view>
      </view>
    </view>
  </view>

  <!-- 卡片骨架（用于分组结果） -->
  <view class="skeleton-cards" wx:if="{{showCards}}">
    <view class="skeleton-card" wx:for="{{cardCount}}" wx:key="index">
      <view class="skeleton-card-header skeleton-shimmer"></view>
      <view class="skeleton-card-avatars">
        <view class="skeleton-card-avatar skeleton-shimmer" wx:for="{{5}}" wx:for-item="avatar" wx:key="index"></view>
      </view>
    </view>
  </view>

  <!-- 快捷操作骨架 -->
  <view class="skeleton-actions" wx:if="{{showActions}}">
    <view class="skeleton-action-item" wx:for="{{actionCount || 2}}" wx:key="index">
      <view class="skeleton-action-icon skeleton-shimmer"></view>
      <view class="skeleton-action-text skeleton-shimmer"></view>
      <view class="skeleton-action-arrow skeleton-shimmer"></view>
    </view>
  </view>

  <!-- 槽位：自定义内容 -->
  <slot></slot>
</view>
```

#### `/components/skeleton/skeleton.wxss`

```css
/* 骨架屏容器 */
.skeleton-container {
  padding: 30rpx;
  box-sizing: border-box;
}

/* 通用占位块样式 */
.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    #F2F2F2 25%,
    #E6E6E6 37%,
    #F2F2F2 63%
  );
  background-size: 400% 100%;
  animation: shimmer 1.5s ease infinite;
  border-radius: 8rpx;
}

/* 扫光动画 */
@keyframes shimmer {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}

/* 头部骨架 */
.skeleton-header {
  display: flex;
  align-items: center;
  padding: 30rpx;
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
}

.skeleton-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.skeleton-title-group {
  flex: 1;
  margin-left: 24rpx;
}

.skeleton-title {
  height: 36rpx;
  width: 200rpx;
  margin-bottom: 16rpx;
}

.skeleton-subtitle {
  height: 24rpx;
  width: 300rpx;
}

/* 统计卡片骨架 */
.skeleton-stats {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.skeleton-stats-header {
  height: 32rpx;
  width: 150rpx;
  margin-bottom: 30rpx;
}

.skeleton-stats-dots {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.skeleton-dot-group {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.skeleton-dot {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  margin-bottom: 10rpx;
}

.skeleton-dot-label {
  width: 60rpx;
  height: 24rpx;
}

.skeleton-stats-footer {
  height: 28rpx;
  width: 200rpx;
  margin-top: 20rpx;
}

/* 列表骨架 */
.skeleton-list {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
}

.skeleton-list-header {
  height: 32rpx;
  width: 200rpx;
  margin-bottom: 24rpx;
}

.skeleton-list-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #F2F2F2;
}

.skeleton-list-item:last-child {
  border-bottom: none;
}

.skeleton-item-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.skeleton-item-content {
  flex: 1;
  margin-left: 20rpx;
}

.skeleton-item-title {
  height: 28rpx;
  width: 150rpx;
  margin-bottom: 12rpx;
}

.skeleton-item-desc {
  height: 20rpx;
  width: 100rpx;
}

.skeleton-item-tag {
  width: 60rpx;
  height: 40rpx;
  border-radius: 20rpx;
  flex-shrink: 0;
}

.skeleton-item-arrow {
  width: 20rpx;
  height: 20rpx;
  margin-left: 10rpx;
  flex-shrink: 0;
}

/* 卡片骨架 */
.skeleton-cards {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.skeleton-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
}

.skeleton-card-header {
  height: 32rpx;
  width: 150rpx;
  margin-bottom: 20rpx;
}

.skeleton-card-avatars {
  display: flex;
  gap: 10rpx;
}

.skeleton-card-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
}

/* 快捷操作骨架 */
.skeleton-actions {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.skeleton-action-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  background: #fff;
  border-radius: 16rpx;
}

.skeleton-action-icon {
  width: 48rpx;
  height: 48rpx;
  border-radius: 12rpx;
  flex-shrink: 0;
}

.skeleton-action-text {
  flex: 1;
  height: 28rpx;
  margin-left: 20rpx;
}

.skeleton-action-arrow {
  width: 20rpx;
  height: 20rpx;
  flex-shrink: 0;
}
```

#### `/components/skeleton/skeleton.js`

```javascript
Component({
  properties: {
    // 主题：light / dark
    theme: {
      type: String,
      value: 'light'
    },
    // 显示头部
    showHeader: {
      type: Boolean,
      value: false
    },
    // 显示统计卡片
    showStats: {
      type: Boolean,
      value: false
    },
    // 显示列表
    showList: {
      type: Boolean,
      value: false
    },
    // 列表项数量
    listCount: {
      type: Number,
      value: 5
    },
    // 列表标题
    listTitle: {
      type: Boolean,
      value: true
    },
    // 显示标签
    showTags: {
      type: Boolean,
      value: false
    },
    // 显示箭头
    showArrows: {
      type: Boolean,
      value: false
    },
    // 显示卡片（分组结果）
    showCards: {
      type: Boolean,
      value: false
    },
    // 卡片数量
    cardCount: {
      type: Number,
      value: 3
    },
    // 显示快捷操作
    showActions: {
      type: Boolean,
      value: false
    },
    // 快捷操作数量
    actionCount: {
      type: Number,
      value: 2
    }
  },

  data: {},

  methods: {}
});
```

#### `/components/skeleton/skeleton.json`

```json
{
  "component": true,
  "usingComponents": {}
}
```

### 5.2 页面骨架屏使用示例

#### `/pages/team-detail/team-detail.wxml`

```xml
<view class="container">
  <!-- 骨架屏 -->
  <skeleton 
    wx:if="{{loading}}"
    show-header="{{true}}"
    show-list="{{true}}"
    list-count="{{5}}"
    show-tags="{{true}}"
    show-actions="{{true}}"
    action-count="{{2}}"
  ></skeleton>

  <!-- 真实内容（带淡入动画） -->
  <view class="content {{loading ? '' : 'fade-in'}}" wx:if="{{!loading}}">
    <!-- 球队信息 -->
    <view class="team-info">
      <!-- ... 原有内容 ... -->
    </view>

    <!-- 其他内容 -->
    <!-- ... -->
  </view>
</view>
```

#### `/pages/team-detail/team-detail.wxss`

```css
/* 引入动画库 */
@import '/styles/animations.wxss';

/* 内容淡入动画 */
.content {
  opacity: 0;
  transition: opacity 300ms ease-out;
}

.content.fade-in {
  opacity: 1;
}
```

#### `/pages/team-detail/team-detail.json`

```json
{
  "navigationBarTitleText": "球队详情",
  "usingComponents": {
    "skeleton": "/components/skeleton/skeleton"
  }
}
```

### 5.3 动画样式库代码示例

#### `/styles/animations.wxss`

```css
/* ============================================
   Basketball 小程序 - 动画样式库
   ============================================ */

/* ----------------
   CSS 变量
   ---------------- */
page {
  --animation-fast: 200ms;
  --animation-normal: 300ms;
  --animation-slow: 500ms;
  --ease-out: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-in-out: cubic-bezier(0.645, 0.045, 0.355, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* ----------------
   基础动画类
   ---------------- */

/* 淡入 */
.fade-in {
  animation: fadeIn var(--animation-normal) var(--ease-out) forwards;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 淡出 */
.fade-out {
  animation: fadeOut var(--animation-normal) var(--ease-out) forwards;
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

/* 从上滑入 */
.slide-in-up {
  animation: slideInUp var(--animation-normal) var(--ease-out) forwards;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(40rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 从右滑入 */
.slide-in-right {
  animation: slideInRight var(--animation-normal) var(--ease-out) forwards;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 从左滑入 */
.slide-in-left {
  animation: slideInLeft var(--animation-normal) var(--ease-out) forwards;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 从底部弹起 */
.bounce-in-up {
  animation: bounceInUp var(--animation-slow) var(--ease-bounce) forwards;
}

@keyframes bounceInUp {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 放大弹入 */
.zoom-in {
  animation: zoomIn var(--animation-normal) var(--ease-bounce) forwards;
}

@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 抖动 */
.shake {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-10rpx); }
  20%, 40%, 60%, 80% { transform: translateX(10rpx); }
}

/* 旋转 */
.rotate {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 脉冲 */
.pulse {
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* 弹跳 */
.bounce {
  animation: bounce 0.6s ease-in-out;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20rpx); }
}

/* ----------------
   交互反馈动画
   ---------------- */

/* 按钮点击 */
.btn-press {
  transition: all 100ms ease-out;
}

.btn-press:active {
  transform: scale(0.95);
  opacity: 0.8;
}

/* 卡片选中 */
.card-selected {
  transition: all var(--animation-fast) var(--ease-bounce);
  border: 4rpx solid var(--primary-color);
  transform: scale(1.05);
}

/* 标签切换 */
.tag-switch {
  transition: all var(--animation-fast) var(--ease-out);
}

/* ----------------
   列表动画（依次进入）
   ---------------- */

.list-item-enter {
  animation: slideInUp var(--animation-normal) var(--ease-out) forwards;
  opacity: 0;
}

/* 动画延迟类 */
.delay-50 { animation-delay: 50ms; }
.delay-100 { animation-delay: 100ms; }
.delay-150 { animation-delay: 150ms; }
.delay-200 { animation-delay: 200ms; }
.delay-250 { animation-delay: 250ms; }
.delay-300 { animation-delay: 300ms; }

/* ----------------
   遮罩层动画
   ---------------- */

.mask-enter {
  animation: maskFadeIn var(--animation-normal) var(--ease-out) forwards;
}

@keyframes maskFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.mask-leave {
  animation: maskFadeOut var(--animation-normal) var(--ease-out) forwards;
}

@keyframes maskFadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

/* ----------------
   弹窗动画
   ---------------- */

.popup-enter {
  animation: popupSlideUp var(--animation-normal) var(--ease-out) forwards;
}

@keyframes popupSlideUp {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.popup-leave {
  animation: popupSlideDown var(--animation-fast) var(--ease-out) forwards;
}

@keyframes popupSlideDown {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(100%);
  }
}

/* ----------------
   成功/失败动画
   ---------------- */

/* 成功打勾 */
.success-check {
  animation: successCheck 0.5s var(--ease-bounce) forwards;
}

@keyframes successCheck {
  0% {
    transform: scale(0) rotate(-45deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(-45deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

/* 失败叉号 */
.error-cross {
  animation: errorCross 0.3s var(--ease-out) forwards;
}

@keyframes errorCross {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* ----------------
   分组动画专用
   ---------------- */

/* 卡片聚合 */
.group-collect {
  animation: groupCollect 0.5s var(--ease-out) forwards;
}

@keyframes groupCollect {
  from {
    transform: translate(var(--start-x), var(--start-y)) scale(1);
    opacity: 1;
  }
  to {
    transform: translate(var(--end-x), var(--end-y)) scale(0.5);
    opacity: 0.8;
  }
}

/* 卡片飞舞 */
.group-fly {
  animation: groupFly 1.5s ease-in-out infinite;
}

@keyframes groupFly {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  25% {
    transform: translate(20rpx, -30rpx) rotate(10deg);
  }
  50% {
    transform: translate(-15rpx, 20rpx) rotate(-5deg);
  }
  75% {
    transform: translate(25rpx, 15rpx) rotate(8deg);
  }
}

/* 卡片落地（弹跳） */
.group-land {
  animation: groupLand 0.6s var(--ease-bounce) forwards;
}

@keyframes groupLand {
  0% {
    transform: translate(var(--from-x), var(--from-y)) scale(0.5);
    opacity: 0;
  }
  60% {
    transform: translate(var(--to-x), var(--to-y)) scale(1.1);
    opacity: 1;
  }
  100% {
    transform: translate(var(--to-x), var(--to-y)) scale(1);
    opacity: 1;
  }
}

/* GPU 加速优化 */
.animated {
  transform: translateZ(0);
  will-change: transform, opacity;
  backface-visibility: hidden;
}
```

### 5.4 分组动画核心代码示例

#### `/pages/team/random-group/random-group.js`

```javascript
Page({
  data: {
    // 动画相关
    animationPhase: 'idle', // idle | collecting | flying | landing | done
    playerAnimations: [],
    groupAnimation: null,
  },

  /**
   * 开始分组（带动画）
   */
  async startGrouping() {
    // 1. 验证
    if (!this.data.validationResult.valid) {
      this.shakeValidationErrors();
      return;
    }

    // 2. 准备分组数据
    const selectedPlayers = this.data.allPlayers.filter(p => p.selected);
    const teamCount = this.data.teamCount;

    // 3. 执行分组算法
    const groups = this.performGrouping(selectedPlayers, teamCount);

    // 4. 播放动画
    await this.playGroupAnimation(selectedPlayers, groups);

    // 5. 跳转到结果页
    this.navigateToResult(groups);
  },

  /**
   * 播放分组动画
   */
  async playGroupAnimation(players, groups) {
    const windowWidth = wx.getSystemInfoSync().windowWidth;
    const windowHeight = wx.getSystemInfoSync().windowHeight;
    const centerX = windowWidth / 2;
    const centerY = windowHeight / 2;

    // 阶段1：卡片聚合（500ms）
    this.setData({ animationPhase: 'collecting' });
    
    const collectAnimations = players.map((player, index) => {
      // 获取球员卡片当前位置（需要通过 selectorQuery）
      return this.getPlayerPosition(player._id).then(pos => {
        return {
          id: player._id,
          startX: pos.left - centerX,
          startY: pos.top - centerY,
          endX: (index % 5 - 2) * 30, // 堆叠偏移
          endY: Math.floor(index / 5) * 20,
        };
      });
    });

    const positions = await Promise.all(collectAnimations);
    
    // 设置 CSS 变量驱动动画
    const playerAnimations = positions.map(p => ({
      id: p.id,
      style: `--start-x: ${p.startX}px; --start-y: ${p.startY}px; --end-x: ${p.endX}px; --end-y: ${p.endY}px;`,
    }));

    this.setData({ playerAnimations });

    await this.delay(500);

    // 阶段2：卡片飞舞（1500ms）
    this.setData({ animationPhase: 'flying' });
    await this.delay(1500);

    // 阶段3：卡片落地（按队伍依次）
    this.setData({ animationPhase: 'landing' });

    for (let teamIndex = 0; teamIndex < groups.length; teamIndex++) {
      const team = groups[teamIndex];
      
      // 计算队伍目标位置
      const teamY = 300 + teamIndex * 200; // 每队间距 200rpx
      
      for (let playerIndex = 0; playerIndex < team.players.length; playerIndex++) {
        const player = team.players[playerIndex];
        
        // 更新动画
        const animIndex = this.data.playerAnimations.findIndex(a => a.id === player._id);
        const anim = this.data.playerAnimations[animIndex];
        
        anim.style = `--from-x: ${anim.endX}px; --from-y: ${anim.endY}px; --to-x: ${(playerIndex % 5 - 2) * 50}px; --to-y: ${teamY}px;`;
        anim.phase = 'landing';
        anim.teamIndex = teamIndex;
        
        this.setData({
          [`playerAnimations[${animIndex}]`]: anim
        });
        
        // 错开时间
        await this.delay(50);
      }
      
      // 每队之间停顿
      await this.delay(200);
    }

    // 阶段4：完成
    this.setData({ animationPhase: 'done' });
    await this.delay(500);
  },

  /**
   * 获取元素位置
   */
  getPlayerPosition(id) {
    return new Promise((resolve) => {
      this.createSelectorQuery()
        .select(`#player-${id}`)
        .boundingClientRect((rect) => {
          resolve({
            left: rect.left + rect.width / 2,
            top: rect.top + rect.height / 2,
          });
        })
        .exec();
    });
  },

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * 震动提示错误
   */
  shakeValidationErrors() {
    // 震动反馈
    wx.vibrateShort({
      type: 'medium'
    });

    // 添加抖动动画类
    this.setData({ showErrorShake: true });
    
    setTimeout(() => {
      this.setData({ showErrorShake: false });
    }, 500);
  },

  /**
   * 执行分组算法（简化版）
   */
  performGrouping(players, teamCount) {
    // 按能力档位排序
    const sorted = [...players].sort((a, b) => b.skillLevel - a.skillLevel);
    
    // 蛇形分配
    const teams = Array.from({ length: teamCount }, (_, i) => ({
      name: `${i + 1}队`,
      players: [],
      avgLevel: 0,
    }));

    let direction = 1;
    let teamIndex = 0;

    sorted.forEach(player => {
      teams[teamIndex].players.push(player);
      
      teamIndex += direction;
      
      if (teamIndex === teamCount || teamIndex === -1) {
        direction *= -1;
        teamIndex += direction;
      }
    });

    // 计算平均档位
    teams.forEach(team => {
      const sum = team.players.reduce((acc, p) => acc + p.skillLevel, 0);
      team.avgLevel = (sum / team.players.length).toFixed(1);
    });

    return teams;
  },

  /**
   * 跳转到结果页
   */
  navigateToResult(groups) {
    // 保存分组数据到全局或缓存
    const app = getApp();
    app.globalData.currentGroupResult = {
      teams: groups,
      createTime: new Date().toISOString(),
    };

    wx.navigateTo({
      url: '/pages/team/group-result/group-result',
    });
  },
});
```

#### `/pages/team/random-group/random-group.wxml`（动画部分）

```xml
<!-- 分组动画容器 -->
<view class="animation-container" wx:if="{{animationPhase !== 'idle'}}">
  <!-- 遮罩层 -->
  <view class="animation-mask"></view>

  <!-- 球员卡片动画 -->
  <view 
    class="player-card-animated {{animationPhase}}"
    wx:for="{{playerAnimations}}"
    wx:key="id"
    style="{{item.style}}"
  >
    <image class="card-avatar" src="{{item.avatar}}" mode="aspectFill"></image>
    <text class="card-name">{{item.name}}</text>
  </view>

  <!-- 队伍目标区域 -->
  <view class="team-targets" wx:if="{{animationPhase === 'landing' || animationPhase === 'done'}}">
    <view class="team-target" wx:for="{{teamCount}}" wx:key="index">
      <text class="team-label">{{index + 1}}队</text>
    </view>
  </view>
</view>

<!-- 原有内容 -->
<view class="container">
  <!-- ... -->
</view>
```

#### `/pages/team/random-group/random-group.wxss`（动画部分）

```css
/* 动画容器 */
.animation-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1000;
  pointer-events: none;
}

.animation-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  animation: fadeIn 300ms ease-out;
}

/* 球员卡片（动画中） */
.player-card-animated {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100rpx;
  height: 120rpx;
  background: #fff;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.2);
  transform: translateZ(0);
  will-change: transform, opacity;
}

/* 聚合阶段 */
.player-card-animated.collecting {
  animation: groupCollect 500ms ease-out forwards;
}

/* 飞舞阶段 */
.player-card-animated.flying {
  animation: groupFly 1.5s ease-in-out infinite;
}

/* 落地阶段 */
.player-card-animated.landing {
  animation: groupLand 600ms cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
}

.card-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  margin-bottom: 8rpx;
}

.card-name {
  font-size: 20rpx;
  color: #333;
}

/* 队伍目标区域 */
.team-targets {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  padding: 200rpx 0;
}

.team-target {
  width: 80%;
  height: 150rpx;
  border: 4rpx dashed rgba(255, 255, 255, 0.5);
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 300ms ease-out;
}

.team-label {
  font-size: 32rpx;
  color: #fff;
  font-weight: bold;
}

/* 动画定义 */
@keyframes groupCollect {
  from {
    transform: translate(var(--start-x), var(--start-y)) scale(1);
    opacity: 1;
  }
  to {
    transform: translate(var(--end-x), var(--end-y)) scale(0.6);
    opacity: 0.8;
  }
}

@keyframes groupFly {
  0%, 100% {
    transform: translate(var(--end-x), var(--end-y)) rotate(0deg) scale(0.6);
  }
  25% {
    transform: translate(calc(var(--end-x) + 30rpx), calc(var(--end-y) - 40rpx)) rotate(15deg) scale(0.6);
  }
  50% {
    transform: translate(calc(var(--end-x) - 20rpx), calc(var(--end-y) + 30rpx)) rotate(-10deg) scale(0.6);
  }
  75% {
    transform: translate(calc(var(--end-x) + 35rpx), calc(var(--end-y) + 20rpx)) rotate(12deg) scale(0.6);
  }
}

@keyframes groupLand {
  0% {
    transform: translate(var(--from-x), var(--from-y)) scale(0.6);
    opacity: 0.8;
  }
  60% {
    transform: translate(var(--to-x), calc(var(--to-y) - 20rpx)) scale(1.1);
    opacity: 1;
  }
  100% {
    transform: translate(var(--to-x), var(--to-y)) scale(1);
    opacity: 1;
  }
}
```

### 5.5 Toast 反馈组件代码示例

#### `/components/toast/toast.wxml`

```xml
<view class="toast-container {{visible ? 'show' : ''}} {{type}}" wx:if="{{visible}}">
  <view class="toast-icon">
    <text wx:if="{{type === 'success'}}">✓</text>
    <text wx:elif="{{type === 'error'}}">✗</text>
    <text wx:elif="{{type === 'warning'}}">⚠</text>
    <text wx:else>ℹ</text>
  </view>
  <view class="toast-message">{{message}}</view>
</view>
```

#### `/components/toast/toast.wxss`

```css
.toast-container {
  position: fixed;
  top: 100rpx;
  left: 50%;
  transform: translateX(-50%) translateY(-40rpx);
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 24rpx 40rpx;
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  opacity: 0;
  transition: all 300ms ease-out;
  z-index: 9999;
}

.toast-container.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.toast-container.success {
  background: rgba(82, 196, 26, 0.9);
}

.toast-container.error {
  background: rgba(255, 77, 79, 0.9);
  animation: shake 0.5s ease-in-out;
}

.toast-container.warning {
  background: rgba(250, 140, 22, 0.9);
}

.toast-icon {
  font-size: 32rpx;
  font-weight: bold;
}

.toast-message {
  font-size: 28rpx;
}

@keyframes shake {
  0%, 100% { transform: translateX(-50%) translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-50%) translateX(-10rpx); }
  20%, 40%, 60%, 80% { transform: translateX(-50%) translateX(10rpx); }
}
```

#### `/components/toast/toast.js`

```javascript
Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    message: {
      type: String,
      value: ''
    },
    type: {
      type: String,
      value: 'info' // success | error | warning | info
    },
    duration: {
      type: Number,
      value: 1500
    }
  },

  observers: {
    'visible'(val) {
      if (val) {
        this.startTimer();
      } else {
        this.clearTimer();
      }
    }
  },

  methods: {
    startTimer() {
      this.clearTimer();
      this.timer = setTimeout(() => {
        this.triggerEvent('hide');
      }, this.data.duration);
    },

    clearTimer() {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
    }
  },

  detached() {
    this.clearTimer();
  }
});
```

---

## 六、测试要点

### 6.1 骨架屏测试

- [ ] 骨架屏在数据加载时正确显示
- [ ] 骨架屏样式与真实内容布局一致
- [ ] 加载完成时骨架屏平滑消失
- [ ] 快速加载（<500ms）不显示骨架屏
- [ ] 扫光动画流畅，无卡顿
- [ ] 不同页面骨架屏布局正确

### 6.2 动画测试

- [ ] 页面切换动画流畅
- [ ] 按钮点击反馈明显
- [ ] 弹窗打开/关闭动画正常
- [ ] 列表项依次进入动画流畅
- [ ] 分组动画各阶段衔接自然
- [ ] 动画结束后状态正确

### 6.3 性能测试

- [ ] 低端机（iPhone 6/红米等）动画流畅
- [ ] 动画帧率 ≥ 30fps
- [ ] 无明显内存泄漏
- [ ] CPU 占用合理

### 6.4 兼容性测试

- [ ] iOS 系统测试
- [ ] Android 系统测试
- [ ] 不同微信版本测试
- [ ] 不同屏幕尺寸适配

---

## 七、风险与应对

| 风险 | 影响 | 应对方案 |
|------|------|----------|
| 动画性能问题 | 用户体验差 | 低端机降级方案，减少动画复杂度 |
| 开发时间超期 | 影响整体进度 | 优先完成 P0 任务，P2 任务可延期 |
| 设计稿不完善 | 实现困难 | 与设计师沟通，提供多个方案选择 |
| 兼容性问题 | 部分用户无法使用 | 充分测试，提供降级方案 |

---

## 八、后续优化方向

1. **Lottie 动画集成**
   - 为重要操作添加 Lottie 动画
   - 提升视觉表现力

2. **手势交互优化**
   - 添加下拉刷新动画
   - 滑动删除动画

3. **音效配合**
   - 分组动画添加音效
   - 成功/失败音效反馈

4. **个性化主题**
   - 支持深色模式
   - 动画风格可配置

---

> 文档完成日期：2026-02-26
> 文档版本：v1.0
> 下一步：评审 → 开发排期
