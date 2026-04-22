const db = require("../../../utils/db");
const helper = require("../../../utils/match-helper");

Page({
  data: {
    loading: true,
    saving: false,
    matchId: "",
    match: null,
    players: [],
    selectedPlayerIds: [],
    teamGroups: [],
    showPlayerPicker: false,
    tempSelectedPlayerIds: [],
    groupedPlayers: [],
    unassignedPlayers: []
    ,
    matchTeamsText: "",
    statusText: ""
  },

  async onLoad(options) {
    const matchId = options.id || "";
    if (!matchId) {
      wx.showToast({ title: "缺少比赛ID", icon: "none" });
      wx.navigateBack();
      return;
    }
    this.setData({ matchId });
    await this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const cloudDb = wx.cloud.database();
      const [match, playersRes] = await Promise.all([
        db.getMatchDetail(this.data.matchId),
        cloudDb.collection("players").orderBy("createdAt", "desc").get()
      ]);

      const players = (playersRes.data || [])
        .map((item) => ({
          ...item,
          playerId: item._id || item.id || item.playerId || "",
          displayNickname: item.nickname || item.name || "未命名球员",
          displayPosition: item.position || "-"
        }))
        .filter((item) => !!item.playerId);

      const selectedPlayerIds = (match.selectedPlayerIds || [])
        .concat((match.playerStats || []).filter((p) => p.played).map((p) => p.playerId))
        .filter(Boolean);
      const uniqSelected = Array.from(new Set(selectedPlayerIds));
      const teamNames = (match.teamNames || []).filter(Boolean);
      const defaultTeams = teamNames.length >= 2 ? teamNames : ["A队", "B队"];
      let groupsFromDoc = (match.grouping && match.grouping.teams) || [];
      if (!groupsFromDoc.length && match.grouping) {
        groupsFromDoc = [
          { teamName: defaultTeams[0], playerIds: match.grouping.teamAPlayerIds || [] },
          { teamName: defaultTeams[1], playerIds: match.grouping.teamBPlayerIds || [] }
        ];
      }
      const teamGroups = defaultTeams.map((name, index) => {
        const found = groupsFromDoc[index] || {};
        const ids = (found.playerIds || []).filter((id) => uniqSelected.includes(id));
        return { teamName: name, playerIds: ids };
      });

      this.setData({
        loading: false,
        match,
        matchTeamsText: ((match.teamNames || []).filter(Boolean).join(" vs ")) || "未设置队伍",
        statusText: match.status === "finalized" ? "已完成（不可修改）" : "草稿",
        players,
        selectedPlayerIds: uniqSelected,
        teamGroups,
        tempSelectedPlayerIds: uniqSelected
      });
      this.syncDisplayPlayers();
    } catch (err) {
      console.error("load grouping data failed", err);
      this.setData({ loading: false });
      wx.showToast({ title: "加载分组失败", icon: "none" });
    }
  },

  getPlayerById(id) {
    return this.data.players.find((item) => item.playerId === id) || null;
  },

  getTeamPlayers(ids) {
    return (ids || [])
      .map((id) => this.getPlayerById(id))
      .filter(Boolean);
  },

  getUnassignedPlayerIds() {
    const assignedIds = [];
    (this.data.teamGroups || []).forEach((group) => {
      assignedIds.push(...(group.playerIds || []));
    });
    const assigned = new Set(assignedIds);
    return this.data.selectedPlayerIds.filter((id) => !assigned.has(id));
  },

  syncDisplayPlayers() {
    const groupedPlayers = (this.data.teamGroups || []).map((group) => ({
      teamName: group.teamName,
      playerIds: group.playerIds || [],
      players: this.getTeamPlayers(group.playerIds || [])
    }));
    this.setData({
      groupedPlayers,
      unassignedPlayers: this.getTeamPlayers(this.getUnassignedPlayerIds())
    });
  },

  onShowPlayerPicker() {
    if (this.data.match && this.data.match.status === "finalized") return;
    this.setData({
      showPlayerPicker: true,
      tempSelectedPlayerIds: [...this.data.selectedPlayerIds]
    });
  },

  onHidePlayerPicker() {
    this.setData({ showPlayerPicker: false });
  },

  onPlayerSelectionChange(e) {
    const next = (e.detail && e.detail.value) || [];
    this.setData({ tempSelectedPlayerIds: next });
  },

  onConfirmPlayerPicker() {
    const selectedPlayerIds = [...new Set(this.data.tempSelectedPlayerIds)];
    const selectedSet = new Set(selectedPlayerIds);
    this.setData({
      selectedPlayerIds,
      teamGroups: (this.data.teamGroups || []).map((group) => ({
        ...group,
        playerIds: (group.playerIds || []).filter((id) => selectedSet.has(id))
      })),
      showPlayerPicker: false
    });
    this.syncDisplayPlayers();
  },

  onMovePlayer(e) {
    if (this.data.match && this.data.match.status === "finalized") return;
    const { id, targetIndex } = e.currentTarget.dataset;
    const index = Number(targetIndex);
    if (!id || Number.isNaN(index)) return;

    const teamGroups = (this.data.teamGroups || []).map((group, groupIndex) => {
      const filtered = (group.playerIds || []).filter((item) => item !== id);
      if (groupIndex === index) return { ...group, playerIds: [...new Set(filtered.concat(id))] };
      return { ...group, playerIds: filtered };
    });
    this.setData({ teamGroups });
    this.syncDisplayPlayers();
  },

  onAutoBalance() {
    if (this.data.match && this.data.match.status === "finalized") return;
    if (this.data.selectedPlayerIds.length < 2) {
      wx.showToast({ title: "至少选择2名球员", icon: "none" });
      return;
    }
    const grouped =
      (this.data.teamGroups || []).length === 2
        ? helper.buildBalancedTwoTeamGrouping(this.data.players, this.data.selectedPlayerIds)
        : helper.buildSnakeGrouping(this.data.players, this.data.selectedPlayerIds, this.data.teamGroups.length);
    const teamGroups = (this.data.teamGroups || []).map((group, index) => ({
      ...group,
      playerIds: (grouped.groups && grouped.groups[index]) || []
    }));
    this.setData({ teamGroups });
    this.syncDisplayPlayers();
  },

  buildGroupingPayload() {
    return {
      selectedPlayerIds: this.data.selectedPlayerIds,
      grouping: {
        teams: (this.data.teamGroups || []).map((group) => ({
          teamName: group.teamName,
          playerIds: group.playerIds || []
        }))
      }
    };
  },

  async onSaveDraft() {
    if (this.data.match && this.data.match.status === "finalized") return;
    this.setData({ saving: true });
    wx.showLoading({ title: "保存草稿..." });
    try {
      await db.updateDraftGrouping(this.data.matchId, this.buildGroupingPayload());
      wx.hideLoading();
      wx.showToast({ title: "草稿已保存", icon: "success" });
      const latest = await db.getMatchDetail(this.data.matchId);
      this.setData({ match: latest });
    } catch (err) {
      console.error("save draft failed", err);
      wx.hideLoading();
      wx.showToast({ title: "保存失败", icon: "none" });
    } finally {
      this.setData({ saving: false });
    }
  },

  async onFinalize() {
    if (this.data.match && this.data.match.status === "finalized") return;
    const check = helper.validateGrouping(this.data.selectedPlayerIds, {
      teams: (this.data.teamGroups || []).map((group) => ({
        teamName: group.teamName,
        playerIds: group.playerIds || []
      }))
    });
    if (!check.ok) {
      wx.showToast({ title: check.message, icon: "none" });
      return;
    }

    const confirm = await new Promise((resolve) => {
      wx.showModal({
        title: "完成分组",
        content: "保存后分组将不可修改，是否继续？",
        success: (res) => resolve(!!res.confirm),
        fail: () => resolve(false)
      });
    });
    if (!confirm) return;

    this.setData({ saving: true });
    wx.showLoading({ title: "正在完成..." });
    try {
      await db.finalizeMatchGrouping(this.data.matchId, this.buildGroupingPayload());
      wx.hideLoading();
      wx.showToast({ title: "分组已完成", icon: "success" });
      setTimeout(() => {
        wx.redirectTo({ url: `/pages/match/detail/detail?id=${this.data.matchId}` });
      }, 400);
    } catch (err) {
      console.error("finalize grouping failed", err);
      wx.hideLoading();
      wx.showToast({ title: "保存失败", icon: "none" });
    } finally {
      this.setData({ saving: false });
    }
  }
});
