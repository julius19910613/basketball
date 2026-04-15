const db = require("../../../utils/db");
const helper = require("../../../utils/match-helper");

const matchTypeOptions = ["friendly", "league", "cup"];
const matchTypeDisplay = ["友谊赛", "联赛", "杯赛"];

Page({
  data: {
    teamId: "",
    matchId: "",
    editMode: false,
    tab: 0,
    loading: true,
    saving: false,
    players: [],
    playerTotalPoints: 0,
    form: helper.createEmptyMatch("")
  },

  async onLoad(options) {
    const teamId = options.teamId || "";
    const matchId = options.id || "";
    this.setData({ teamId, matchId, editMode: !!matchId, "form.teamId": teamId });
    await this.loadPlayers();
    if (matchId) await this.loadDetail(matchId);
    this.setData({ loading: false });
  },

  async loadPlayers() {
    try {
      const cloudDb = wx.cloud.database();
      const res = await cloudDb.collection("players").orderBy("createdAt", "desc").get();
      const players = (res.data || []).map((item) => ({
        ...item,
        displayNickname: item.nickname || item.name || "未命名球员",
        displayPosition: item.position || "-"
      }));
      this.setData({ players });
    } catch (err) {
      console.error("load players failed", err);
      wx.showToast({ title: "加载球员失败", icon: "none" });
    }
  },

  async loadDetail(id) {
    try {
      const detail = await db.getMatchDetail(id);
      this.setData({
        form: Object.assign(helper.createEmptyMatch(this.data.teamId), detail, {
          matchTypeIndex: matchTypeOptions.indexOf(detail.matchType)
        })
      });
    } catch (err) {
      console.error("load match detail failed", err);
      wx.showToast({ title: "加载比赛失败", icon: "none" });
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({ [`form.${field}`]: value });
  },

  onTypeChange(e) {
    const index = Number(e.detail.value);
    this.setData({
      "form.matchType": matchTypeOptions[index],
      "form.matchTypeText": matchTypeDisplay[index]
    });
  },

  onDateChange(e) {
    this.setData({ "form.matchDate": e.detail.value });
  },

  onTimeChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onQuarterInput(e) {
    const quarter = Number(e.currentTarget.dataset.quarter);
    const field = e.currentTarget.dataset.field;
    const value = Number(e.detail.value || 0);
    this.setData({ [`form.quarters[${quarter}].${field}`]: value });
  },

  onPlayerStatChange(e) {
    this.setData({
      "form.playerStats": e.detail.value,
      playerTotalPoints: e.detail.totalPoints
    });
  },

  switchTab(e) {
    this.setData({ tab: Number(e.currentTarget.dataset.tab) || 0 });
  },

  nextTab() {
    this.setData({ tab: Math.min(this.data.tab + 1, 2) });
  },

  prevTab() {
    this.setData({ tab: Math.max(this.data.tab - 1, 0) });
  },

  validateForm() {
    const form = this.data.form;
    if (!form.opponent || !form.opponent.trim()) return "请输入对手名称";
    if (!form.matchDate) return "请选择比赛日期";
    if (Number(form.scoreUs) < 0 || Number(form.scoreOpponent) < 0) return "比分不能为负数";
    return "";
  },

  async onSubmit() {
    const errorMessage = this.validateForm();
    if (errorMessage) {
      wx.showToast({ title: errorMessage, icon: "none" });
      return;
    }

    const quarterTotal = helper.calcQuarterTotals(this.data.form.quarters);
    const playerPoints = helper.calcTeamPoints(this.data.form.playerStats);
    const warnMessages = [];
    if (quarterTotal.scoreUs !== Number(this.data.form.scoreUs) || quarterTotal.scoreOpponent !== Number(this.data.form.scoreOpponent)) {
      warnMessages.push("每节合计与总分不一致");
    }
    if (playerPoints !== Number(this.data.form.scoreUs)) {
      warnMessages.push("球员得分合计与总分不一致");
    }

    if (warnMessages.length) {
      const confirm = await new Promise((resolve) => {
        wx.showModal({
          title: "数据提醒",
          content: warnMessages.join("；") + "，是否继续保存？",
          success: (res) => resolve(res.confirm),
          fail: () => resolve(false)
        });
      });
      if (!confirm) return;
    }

    this.setData({ saving: true });
    wx.showLoading({ title: "保存中...", mask: true });
    try {
      const payload = Object.assign({}, this.data.form, { teamId: this.data.teamId || this.data.form.teamId || "" });
      if (this.data.editMode) {
        await db.updateMatch(this.data.matchId, payload);
      } else {
        await db.createMatch(payload);
      }
      wx.hideLoading();
      wx.showToast({ title: "保存成功", icon: "success" });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (err) {
      console.error("save match failed", err);
      wx.hideLoading();
      wx.showToast({ title: "保存失败", icon: "none" });
    } finally {
      this.setData({ saving: false });
    }
  }
});
