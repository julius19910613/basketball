// ~/projects/basketball/miniprogram/components/player-card/player-card.js
Component({
  properties: {
    userProfile: {
      type: Object,
      value: {
        nickName: '匿名球员',
        avatarUrl: '/images/default_avatar.png',
        height: null,
        weight: null,
        position: '',
        skills: [],
      },
      observer: function(newVal, oldVal) {
        // 确保skills是数组
        if (newVal && !Array.isArray(newVal.skills)) {
          newVal.skills = [];
        }
      }
    }
    // 更多属性如：场均得分、篮板等，待后续扩展
  },

  data: {
    // 这里可以放置组件内部的状态数据，目前userProfile直接从properties获取
  },

  methods: {
    // 可以在这里添加组件内部的方法，例如点击头像放大等
  },

  lifetimes: {
    attached: function() {
      // 在组件实例进入页面节点树时执行
      // console.log('PlayerCard Component attached:', this.properties.userProfile);
    },
    detached: function() {
      // 在组件实例被从页面节点树移除时执行
    },
  },

  pageLifetimes: {
    // 组件所在页面的生命周期函数
    show: function() {
      // console.log('PlayerCard Page show');
    },
    hide: function() {
      // console.log('PlayerCard Page hide');
    },
    resize: function() {
      // console.log('PlayerCard Page resize');
    },
  }
})
