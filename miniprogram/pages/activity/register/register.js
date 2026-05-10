const app = getApp();
const db = require("../../../utils/db");
const helper = require("../../../utils/activity-helper");
const { getCollection } = require("../../../config/env");

Page({
  data: {
    id: "",
    loading: true,
    submitting: false,
    activity: null,
    linkedPlayer: null,
    registered: false,
    statusText: ""
  },

  onLoad(options) {
    this.setData({ id: options.id || "" });
    this.loadData();
  },

  async loadLinkedPlayer() {
    const openid = app.globalData.openid || "";
    if (!openid) return null;
    const cloudDb = wx.cloud.database();
    const userRes = await cloudDb.collection(getCollection("users")).where({ _openid: openid }).limit(1).get();
    const user = (userRes.data || [])[0];
    if (!user || !user.linkedPlayerId) return null;
    const playerRes = await cloudDb.collection(getCollection("players")).doc(user.linkedPlayerId).get();
    return playerRes.data || null;
  },

  async loadData() {
    if (!this.data.id) {
      this.setData({ loading: false });
      return;
    }
    this.setData({ loading: true });
    try {
      const [activity, registrations, linkedPlayer] = await Promise.all([
        db.getActivityDetail(this.data.id),
        db.getActivityRegistrations(this.data.id),
        this.loadLinkedPlayer().catch(() => null)
      ]);
      const registered = !!(linkedPlayer && registrations.some((item) => item.playerId === linkedPlayer._id));
      this.setData({
        loading: false,
        activity,
        linkedPlayer,
        registered,
        statusText: helper.formatActivityStatus(activity && activity.status)
      });
    } catch (err) {
      console.error("load register page failed", err);
      this.setData({ loading: false });
      wx.showToast({ title: "加载失败", icon: "none" });
    }
  },

  async onRegister() {
    if (!this.data.linkedPlayer) {
      wx.showToast({ title: "请先在个人中心绑定球员", icon: "none" });
      return;
    }
    this.setData({ submitting: true });
    wx.showLoading({ title: "报名中...", mask: true });
    try {
      await db.registerForActivity(this.data.id, this.data.linkedPlayer);
      wx.hideLoading();
      wx.showToast({ title: "报名成功", icon: "success" });
      this.loadData();
    } catch (err) {
      console.error("register activity failed", err);
      wx.hideLoading();
      wx.showToast({ title: "报名失败", icon: "none" });
    } finally {
      this.setData({ submitting: false });
    }
  },

  async onCancelRegistration() {
    if (!this.data.linkedPlayer) return;
    this.setData({ submitting: true });
    wx.showLoading({ title: "处理中...", mask: true });
    try {
      await db.cancelActivityRegistration(this.data.id, this.data.linkedPlayer._id);
      wx.hideLoading();
      wx.showToast({ title: "已取消报名", icon: "success" });
      this.loadData();
    } catch (err) {
      console.error("cancel registration failed", err);
      wx.hideLoading();
      wx.showToast({ title: "取消失败", icon: "none" });
    } finally {
      this.setData({ submitting: false });
    }
  },

  goProfile() {
    wx.switchTab({ url: "/pages/profile/profile" });
  }
});
