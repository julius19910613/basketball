const db = require("../../../utils/db");
const helper = require("../../../utils/match-helper");

const matchTypeOptions = ["friendly", "league", "cup", "fiba", "ncaa"];
const matchTypeDisplay = ["友谊赛", "联赛", "杯赛", "全场球赛 (FIBA)", "全场球赛 (NCAA)"];

Page({
  data: {
    teamId: "",
    matchId: "",
    editMode: false,
    loading: true,
    saving: false,
    players: [],
    selectedPlayerIds: [],
    tempSelectedPlayerIds: [],
    showPlayerPicker: false,
    isAllPlayersSelected: false,
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
      const players = (res.data || [])
        .map((item) => ({
          ...item,
          playerId: item._id || item.id || item.playerId || "",
          displayNickname: item.nickname || item.name || "未命名球员",
          displayPosition: item.position || "-"
        }))
        .filter((item) => !!item.playerId);
      this.setData({ players });
    } catch (err) {
      console.error("load players failed", err);
      wx.showToast({ title: "加载球员失败", icon: "none" });
    }
  },

  async loadDetail(id) {
    try {
      const detail = await db.getMatchDetail(id);
      const selectedPlayerIds = (detail.selectedPlayerIds || [])
        .concat((detail.playerStats || []).filter((p) => p.played).map((p) => p.playerId));
      this.setData({
        selectedPlayerIds: [...new Set(selectedPlayerIds)],
        form: Object.assign(helper.createEmptyMatch(this.data.teamId), detail, {
          matchTypeIndex: Math.max(0, matchTypeOptions.indexOf(detail.matchType))
        })
      });
    } catch (err) {
      console.error("load match detail failed", err);
      wx.showToast({ title: "加载比赛失败", icon: "none" });
    }
  },

  onShowPlayerPicker() {
    const tempSelectedPlayerIds = [...this.data.selectedPlayerIds];
    const allIds = this.data.players.map((player) => player.playerId);
    this.setData({
      showPlayerPicker: true,
      tempSelectedPlayerIds,
      isAllPlayersSelected: allIds.length > 0 && allIds.every((id) => tempSelectedPlayerIds.includes(id))
    });
  },

  onHidePlayerPicker() {
    this.setData({ showPlayerPicker: false });
  },

  onPlayerSelectionChange(e) {
    const tempSelectedPlayerIds = Array.isArray(e.detail)
      ? e.detail
      : (e.detail && Array.isArray(e.detail.value) ? e.detail.value : []);
    const allIds = this.data.players.map((player) => player.playerId);
    this.setData({
      tempSelectedPlayerIds,
      isAllPlayersSelected: allIds.length > 0 && allIds.every((id) => tempSelectedPlayerIds.includes(id))
    });
  },

  onConfirmPlayers() {
    const { tempSelectedPlayerIds, players, form } = this.data;
    const newPlayerStats = helper.buildPlayerStatsForSelection(players, form.playerStats || [], tempSelectedPlayerIds);
    this.setData({
      "form.playerStats": newPlayerStats,
      selectedPlayerIds: [...tempSelectedPlayerIds],
      showPlayerPicker: false
    });
  },

  onTogglePlayerSelection(e) {
    const { id } = e.currentTarget.dataset;
    const { tempSelectedPlayerIds } = this.data;
    const index = tempSelectedPlayerIds.indexOf(id);
    const newSelected = [...tempSelectedPlayerIds];
    if (index > -1) {
      newSelected.splice(index, 1);
    } else {
      newSelected.push(id);
    }
    const allIds = this.data.players.map((player) => player.playerId);
    this.setData({
      tempSelectedPlayerIds: newSelected,
      isAllPlayersSelected: allIds.length > 0 && allIds.every((itemId) => newSelected.includes(itemId))
    });
  },

  onToggleSelectAllPlayers() {
    const allIds = this.data.players.map((player) => player.playerId);
    if (!allIds.length) {
      this.setData({
        tempSelectedPlayerIds: [],
        isAllPlayersSelected: false
      });
      return;
    }

    const isAllPlayersSelected = allIds.every((id) => this.data.tempSelectedPlayerIds.includes(id));
    const nextSelectedIds = isAllPlayersSelected ? [] : allIds;
    this.setData({
      tempSelectedPlayerIds: nextSelectedIds,
      isAllPlayersSelected: !isAllPlayersSelected
    });
  },

  noop() {},

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

  onTeamNameInput(e) {
    const index = Number(e.currentTarget.dataset.index);
    const value = e.detail.value;
    this.setData({ [`form.teamNames[${index}]`]: value });
  },

  onAddTeam() {
    const names = (this.data.form.teamNames || []).slice();
    names.push(`队伍${names.length + 1}`);
    this.setData({ "form.teamNames": names });
  },

  onRemoveTeam(e) {
    const index = Number(e.currentTarget.dataset.index);
    const names = (this.data.form.teamNames || []).slice();
    if (names.length <= 2) {
      wx.showToast({ title: "至少保留2支队伍", icon: "none" });
      return;
    }
    names.splice(index, 1);
    this.setData({ "form.teamNames": names });
  },

  validateForm() {
    const form = this.data.form;
    const teamNames = (form.teamNames || []).map((name) => String(name || "").trim()).filter(Boolean);
    if (teamNames.length < 2) return "至少录入2支球队";
    const uniq = new Set(teamNames);
    if (uniq.size !== teamNames.length) return "球队名称不能重复";
    if (!form.matchDate) return "请选择比赛日期";
    if (this.data.selectedPlayerIds.length < 4) return "至少选择4名球员";
    return "";
  },

  async onGoGrouping() {
    const errorMessage = this.validateForm();
    if (errorMessage) {
      wx.showToast({ title: errorMessage, icon: "none" });
      return;
    }

    this.setData({ saving: true });
    wx.showLoading({ title: "处理中...", mask: true });
    try {
      const payload = Object.assign({}, this.data.form, {
        _id: this.data.matchId || undefined,
        teamId: this.data.teamId || this.data.form.teamId || "",
        status: "draft",
        isGroupingLocked: false,
        selectedPlayerIds: this.data.selectedPlayerIds,
        teamNames: this.data.form.teamNames.map((name) => String(name || "").trim()).filter(Boolean),
        grouping: this.data.form.grouping || {
          teams: this.data.form.teamNames.map((name) => ({ teamName: String(name || "").trim(), playerIds: [] })),
          lockedAt: null
        },
        playerStats: (this.data.form.playerStats || []).map((item) => ({
          ...item,
          played: this.data.selectedPlayerIds.includes(item.playerId)
        }))
      });
      const matchId = await db.saveMatchDraft(payload);
      wx.hideLoading();
      wx.navigateTo({ url: `/pages/match/grouping/grouping?id=${matchId}` });
    } catch (err) {
      console.error("go grouping failed", err);
      wx.hideLoading();
      wx.showToast({ title: "操作失败", icon: "none" });
    } finally {
      this.setData({ saving: false });
    }
  }
});
