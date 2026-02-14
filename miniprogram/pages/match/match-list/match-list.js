// pages/match/match-list/match-list.js
Page({
  data: {
    currentTab: 0, // 0: 即将开始, 1: 已结束
    matchList: [],
    statusText: {
      'scheduled': '未开始',
      'ongoing': '进行中',
      'finished': '已结束'
    },
    loading: false
  },

  onLoad() {
    this.loadMatches();
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.loadMatches();
  },

  onPullDownRefresh() {
    this.loadMatches().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 切换 Tab
  switchTab(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    if (index !== this.data.currentTab) {
      this.setData({ currentTab: index });
      this.loadMatches();
    }
  },

  // 加载比赛列表
  async loadMatches() {
    this.setData({ loading: true });
    
    try {
      const db = wx.cloud.database();
      const _ = db.command;
      const now = new Date();
      
      let query = {};
      if (this.data.currentTab === 0) {
        // 即将开始的比赛
        query = {
          status: _.in(['scheduled', 'ongoing'])
        };
      } else {
        // 已结束的比赛
        query = {
          status: 'finished'
        };
      }
      
      const res = await db.collection('matches')
        .where(query)
        .orderBy('startTime', this.data.currentTab === 0 ? 'asc' : 'desc')
        .limit(20)
        .get();
      
      // 格式化时间
      const matchList = res.data.map(match => {
        const startTime = new Date(match.startTime);
        match.startTimeFormatted = this.formatDate(startTime);
        return match;
      });
      
      this.setData({
        matchList: matchList,
        loading: false
      });
    } catch (err) {
      console.error('加载比赛列表失败:', err);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 格式化日期
  formatDate(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}月${day}日 ${hours}:${minutes}`;
  },

  // 跳转到比赛详情
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/match/match-detail/match-detail?id=${id}`
    });
  },

  // 创建比赛
  createMatch() {
    wx.navigateTo({
      url: '/pages/match/create-match/create-match'
    });
  }
});
