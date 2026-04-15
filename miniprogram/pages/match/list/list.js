const db = require("../../../utils/db");
const helper = require("../../../utils/match-helper");

Page({
  data: {
    teamId: "",
    playerId: "",
    matches: [],
    loading: true,
    loadingMore: false,
    activeTab: 0,
    page: 0,
    pageSize: 20,
    hasMore: true
  },

  onLoad(options) {
    this.setData({
      teamId: options.teamId || "",
      playerId: options.playerId || ""
    });
    this.loadMatches(true);
  },

  onPullDownRefresh() {
    this.loadMatches(true).finally(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadMatches(false);
    }
  },

  onTabChange(e) {
    this.setData({ activeTab: Number(e.currentTarget.dataset.tab) || 0 });
    this.loadMatches(true);
  },

  async loadMatches(reset) {
    if (reset) {
      this.setData({ loading: true, page: 0, hasMore: true });
    } else {
      this.setData({ loadingMore: true });
    }

    try {
      const filter = {};
      if (this.data.activeTab === 1) filter.result = "win";
      if (this.data.activeTab === 2) filter.result = "loss";
      if (this.data.playerId) filter.playerId = this.data.playerId;

      const page = reset ? 0 : this.data.page;
      const list = await db.getMatchList(this.data.teamId, filter, page, this.data.pageSize);
      const merged = reset ? list : this.data.matches.concat(list);
      this.setData({
        matches: merged.map(this.formatMatchCard),
        page: page + 1,
        hasMore: list.length === this.data.pageSize,
        loading: false,
        loadingMore: false
      });
    } catch (err) {
      console.error("load matches failed", err);
      this.setData({ loading: false, loadingMore: false });
      wx.showToast({ title: "加载比赛失败", icon: "none" });
    }
  },

  formatMatchCard(item) {
    const diff = Number(item.scoreUs || 0) - Number(item.scoreOpponent || 0);
    return Object.assign({}, item, {
      matchTypeText: helper.formatMatchType(item.matchType),
      typeClass: helper.getMatchTypeTagClass(item.matchType),
      scoreClass: diff >= 0 ? "score-win" : "score-loss",
      resultClass: item.result === "win" ? "result-win" : item.result === "loss" ? "result-loss" : "result-draw"
    });
  },

  goCreate() {
    const query = this.data.teamId ? `?teamId=${this.data.teamId}` : "";
    wx.navigateTo({ url: `/pages/match/create/create${query}` });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/match/detail/detail?id=${id}` });
  },

  async onDelete(e) {
    const id = e.currentTarget.dataset.id;
    const confirm = await new Promise((resolve) => {
      wx.showModal({
        title: "删除比赛",
        content: "删除后不可恢复，确认删除吗？",
        success: (res) => resolve(res.confirm),
        fail: () => resolve(false)
      });
    });
    if (!confirm) return;

    try {
      await db.deleteMatch(id);
      wx.showToast({ title: "删除成功", icon: "success" });
      this.loadMatches(true);
    } catch (err) {
      console.error("delete match failed", err);
      wx.showToast({ title: "删除失败", icon: "none" });
    }
  }
});
