const db = require("../../../utils/db");
const helper = require("../../../utils/activity-helper");

Page({
  data: {
    loading: true,
    activities: []
  },

  onShow() {
    this.loadActivities();
  },

  async loadActivities() {
    this.setData({ loading: true });
    try {
      const activities = await db.getActivityList(0, 20);
      this.setData({
        loading: false,
        activities: (activities || []).map((item) => Object.assign({}, item, {
          statusText: helper.formatActivityStatus(item.status)
        }))
      });
    } catch (err) {
      console.error("load activities failed", err);
      this.setData({ loading: false });
      wx.showToast({ title: "加载活动失败", icon: "none" });
    }
  },

  goCreate() {
    wx.navigateTo({ url: "/pages/activity/create/create" });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: `/pages/activity/detail/detail?id=${id}` });
  }
});
