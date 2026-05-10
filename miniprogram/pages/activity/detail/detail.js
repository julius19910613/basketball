const app = getApp();
const db = require("../../../utils/db");
const helper = require("../../../utils/activity-helper");
const { getCollection } = require("../../../config/env");

Page({
  data: {
    id: "",
    loading: true,
    activity: null,
    registrations: [],
    matches: [],
    linkedPlayer: null,
    registered: false,
    statusText: ""
  },

  onLoad(options) {
    this.setData({ id: options.id || "" });
    this.loadPageData();
  },

  onShow() {
    if (this.data.id) this.loadPageData();
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

  async loadPageData() {
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
      const matches = await db.getMatchesByActivity(this.data.id).catch(() => []);
      const playerId = linkedPlayer && linkedPlayer._id;
      const registered = !!(playerId && registrations.some((item) => item.playerId === playerId));
      this.setData({
        loading: false,
        activity,
        registrations,
        matches: (matches || []).map((item) => ({
          ...item,
          versusText: ((item.teamNames || []).filter(Boolean).join(" vs ")) || `${item.homeTeamName} vs ${item.awayTeamName}`
        })),
        linkedPlayer,
        registered,
        statusText: helper.formatActivityStatus(activity && activity.status)
      });
    } catch (err) {
      console.error("load activity detail failed", err);
      this.setData({ loading: false });
      wx.showToast({ title: "加载活动失败", icon: "none" });
    }
  },

  onCreateActivity() {
    wx.navigateTo({ url: "/pages/activity/create/create" });
  },

  onGoRegister() {
    wx.navigateTo({ url: `/pages/activity/register/register?id=${this.data.id}` });
  },

  onGoGrouping() {
    wx.navigateTo({ url: `/pages/activity/grouping/grouping?id=${this.data.id}` });
  },

  async onGenerateSchedule() {
    if (!this.data.activity) return;
    wx.showLoading({ title: "生成赛程...", mask: true });
    try {
      await db.generateActivityMatches(this.data.activity);
      wx.hideLoading();
      wx.showToast({ title: "6场赛程已生成", icon: "success" });
      this.loadPageData();
    } catch (err) {
      console.error("generate schedule failed", err);
      wx.hideLoading();
      wx.showToast({ title: "生成失败", icon: "none" });
    }
  },

  onGoMatchStats(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: `/pages/match/stats/edit?id=${id}` });
  },

  async onCloseRegistration() {
    if (!this.data.activity || this.data.activity.status !== "registration_open") return;
    wx.showLoading({ title: "处理中...", mask: true });
    try {
      await db.closeActivityRegistration(this.data.id);
      wx.hideLoading();
      wx.showToast({ title: "已截止报名", icon: "success" });
      this.loadPageData();
    } catch (err) {
      console.error("close registration failed", err);
      wx.hideLoading();
      wx.showToast({ title: "操作失败", icon: "none" });
    }
  },

  onShareAppMessage() {
    const title = (this.data.activity && this.data.activity.title) || "篮球活动报名";
    return {
      title: title,
      path: `/pages/activity/register/register?id=${this.data.id}`
    };
  }
});
