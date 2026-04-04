// components/skeleton/skeleton.js
Component({
  properties: {
    // 主题：light / dark
    theme: {
      type: String,
      value: 'light'
    },
    // 显示头部（队徽+标题）
    showHeader: {
      type: Boolean,
      value: false
    },
    // 显示统计卡片
    showStats: {
      type: Boolean,
      value: false
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
    // 显示选择器（分组设置）
    showSelector: {
      type: Boolean,
      value: false
    }
  },

  data: {},

  methods: {}
});
