const db = require("../../../utils/db");
const helper = require("../../../utils/match-helper");
const { getCollection } = require("../../../config/env");

Page({
  data: {
    id: "",
    loading: true,
    saving: false,
    match: null,
    players: [],
    form: {
      scoreUs: 0,
      scoreOpponent: 0,
      quarters: [
        { quarter: 1, scoreUs: 0, scoreOpponent: 0 },
        { quarter: 2, scoreUs: 0, scoreOpponent: 0 },
        { quarter: 3, scoreUs: 0, scoreOpponent: 0 },
        { quarter: 4, scoreUs: 0, scoreOpponent: 0 }
      ],
      playerStats: [],
      highlights: ""
    }
  },

  onLoad(options) {
    this.setData({ id: options.id || "" });
    this.loadData();
  },

  async loadData() {
    if (!this.data.id) {
      this.setData({ loading: false });
      return;
    }
    this.setData({ loading: true });
    try {
      const cloudDb = wx.cloud.database();
      const match = await db.getMatchDetail(this.data.id);
      const groupedIds = ((match.grouping && match.grouping.teams) || []).reduce((acc, team) => acc.concat(team.playerIds || []), []);
      const selectedIds = Array.from(new Set((match.selectedPlayerIds || []).concat(groupedIds)));
      const playersRes = await cloudDb.collection(getCollection("players")).orderBy("createdAt", "desc").get();
      const players = (playersRes.data || [])
        .map((item) => ({
          ...item,
          _id: item._id || item.playerId || "",
          playerId: item._id || item.playerId || "",
          displayNickname: item.nickname || item.name || "未命名球员",
          displayPosition: item.position || "-"
        }))
        .filter((item) => selectedIds.includes(item.playerId));

      this.setData({
        loading: false,
        match,
        players,
        form: {
          scoreUs: match.scoreUs || 0,
          scoreOpponent: match.scoreOpponent || 0,
          quarters: (match.quarters && match.quarters.length ? match.quarters : this.data.form.quarters).map((item, index) => ({
            quarter: item.quarter || index + 1,
            scoreUs: Number(item.scoreUs || 0),
            scoreOpponent: Number(item.scoreOpponent || 0)
          })),
          playerStats: match.playerStats || [],
          highlights: match.highlights || ""
        }
      });
    } catch (err) {
      console.error("load stats edit failed", err);
      this.setData({ loading: false });
      wx.showToast({ title: "加载比赛失败", icon: "none" });
    }
  },

  onScoreInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: Number(e.detail.value || 0) });
  },

  onQuarterInput(e) {
    const index = Number(e.currentTarget.dataset.index);
    const side = e.currentTarget.dataset.side;
    this.setData({ [`form.quarters[${index}].${side}`]: Number(e.detail.value || 0) });
  },

  onHighlightsInput(e) {
    this.setData({ "form.highlights": e.detail.value });
  },

  onPlayerStatsChange(e) {
    this.setData({ "form.playerStats": e.detail.value || [] });
  },

  buildSubmitPayload() {
    return Object.assign({}, this.data.match, {
      scoreUs: Number(this.data.form.scoreUs || 0),
      scoreOpponent: Number(this.data.form.scoreOpponent || 0),
      quarters: (this.data.form.quarters || []).map((item, index) => ({
        quarter: item.quarter || index + 1,
        scoreUs: Number(item.scoreUs || 0),
        scoreOpponent: Number(item.scoreOpponent || 0)
      })),
      playerStats: this.data.form.playerStats || [],
      highlights: this.data.form.highlights || "",
      matchStatus: "finished"
    });
  },

  async onSave() {
    this.setData({ saving: true });
    wx.showLoading({ title: "保存中...", mask: true });
    try {
      await db.updateMatch(this.data.id, this.buildSubmitPayload());
      wx.hideLoading();
      wx.showToast({ title: "技术统计已保存", icon: "success" });
      setTimeout(() => {
        wx.redirectTo({ url: `/pages/match/detail/detail?id=${this.data.id}` });
      }, 250);
    } catch (err) {
      console.error("save match stats failed", err);
      wx.hideLoading();
      wx.showToast({ title: "保存失败", icon: "none" });
    } finally {
      this.setData({ saving: false });
    }
  }
});
