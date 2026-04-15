const db = require("../../../utils/db");
const helper = require("../../../utils/match-helper");

Page({
  data: {
    id: "",
    loading: true,
    tab: 0,
    match: null,
    playedPlayers: [],
    benchedPlayers: []
  },

  onLoad(options) {
    this.setData({ id: options.id || "" });
    this.loadDetail();
  },

  async loadDetail() {
    if (!this.data.id) {
      this.setData({ loading: false });
      return;
    }
    this.setData({ loading: true });
    try {
      const match = await db.getMatchDetail(this.data.id);
      const played = (match.playerStats || []).filter((item) => item.played).sort((a, b) => (b.points || 0) - (a.points || 0));
      const benched = (match.playerStats || []).filter((item) => !item.played);
      this.setData({
        loading: false,
        match: Object.assign({}, match, {
          matchTypeText: helper.formatMatchType(match.matchType),
          diff: Number(match.scoreUs || 0) - Number(match.scoreOpponent || 0)
        }),
        playedPlayers: played,
        benchedPlayers: benched
      });
    } catch (err) {
      console.error("load match detail failed", err);
      this.setData({ loading: false });
      wx.showToast({ title: "加载失败", icon: "none" });
    }
  },

  onTabChange(e) {
    this.setData({ tab: Number(e.currentTarget.dataset.tab) || 0 });
  },

  onEdit() {
    wx.navigateTo({ url: `/pages/match/create/create?id=${this.data.id}` });
  },

  async onDelete() {
    const confirm = await new Promise((resolve) => {
      wx.showModal({
        title: "删除比赛",
        content: "确认删除这场比赛吗？",
        success: (res) => resolve(res.confirm),
        fail: () => resolve(false)
      });
    });
    if (!confirm) return;
    try {
      await db.deleteMatch(this.data.id);
      wx.showToast({ title: "删除成功", icon: "success" });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (err) {
      console.error("delete match failed", err);
      wx.showToast({ title: "删除失败", icon: "none" });
    }
  }
});
