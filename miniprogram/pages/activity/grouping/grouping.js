const db = require("../../../utils/db");
const helper = require("../../../utils/activity-helper");
const matchHelper = require("../../../utils/match-helper");
const { getCollection } = require("../../../config/env");

Page({
  data: {
    loading: true,
    saving: false,
    activityId: "",
    activity: null,
    players: [],
    selectedPlayerIds: [],
    teamGroups: [],
    groupedPlayers: [],
    unassignedPlayers: []
  },

  onLoad(options) {
    const activityId = options.id || "";
    if (!activityId) {
      wx.showToast({ title: "缺少活动ID", icon: "none" });
      wx.navigateBack();
      return;
    }
    this.setData({ activityId });
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const cloudDb = wx.cloud.database();
      const [activity, registrations, playersRes] = await Promise.all([
        db.getActivityDetail(this.data.activityId),
        db.getActivityRegistrations(this.data.activityId),
        cloudDb.collection(getCollection("players")).orderBy("createdAt", "desc").get()
      ]);

      const players = (playersRes.data || [])
        .map((item) => ({
          ...item,
          playerId: item._id || item.id || item.playerId || "",
          displayNickname: item.nickname || item.name || "未命名球员",
          displayPosition: item.position || "-"
        }))
        .filter((item) => !!item.playerId);

      const selectedPlayerIds = helper.getRegisteredPlayerIds(registrations);
      const snapshot = activity.groupingSnapshot || {};
      const teamNames = (activity.teamNames || []).slice(0, 3);
      const savedTeams = snapshot.teams || [];
      const teamGroups = teamNames.map((teamName, index) => {
        const found = savedTeams[index] || {};
        return {
          teamName,
          playerIds: (found.playerIds || []).filter((id) => selectedPlayerIds.includes(id))
        };
      });

      this.setData({
        loading: false,
        activity,
        players,
        selectedPlayerIds,
        teamGroups
      });
      this.syncDisplayPlayers();
    } catch (err) {
      console.error("load activity grouping failed", err);
      this.setData({ loading: false });
      wx.showToast({ title: "加载分组失败", icon: "none" });
    }
  },

  getPlayerById(id) {
    return this.data.players.find((item) => item.playerId === id) || null;
  },

  getTeamPlayers(ids) {
    return (ids || []).map((id) => this.getPlayerById(id)).filter(Boolean);
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
    this.setData({
      groupedPlayers: (this.data.teamGroups || []).map((group) => ({
        teamName: group.teamName,
        playerIds: group.playerIds || [],
        players: this.getTeamPlayers(group.playerIds || [])
      })),
      unassignedPlayers: this.getTeamPlayers(this.getUnassignedPlayerIds())
    });
  },

  onMovePlayer(e) {
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
    if (this.data.selectedPlayerIds.length < 6) {
      wx.showToast({ title: "至少6名报名球员才能三队分组", icon: "none" });
      return;
    }
    const grouped = matchHelper.buildSnakeGrouping(this.data.players, this.data.selectedPlayerIds, 3);
    const teamGroups = (this.data.teamGroups || []).map((group, index) => ({
      ...group,
      playerIds: (grouped.groups && grouped.groups[index]) || []
    }));
    this.setData({ teamGroups });
    this.syncDisplayPlayers();
  },

  buildGroupingSnapshot() {
    return helper.buildActivityGroupingPayload(
      (this.data.activity && this.data.activity.teamNames) || [],
      this.data.selectedPlayerIds,
      (this.data.teamGroups || []).map((group) => group.playerIds || []),
      (this.data.activity && this.data.activity.groupingSnapshot && this.data.activity.groupingSnapshot.version) || 1
    );
  },

  async onSaveGrouping() {
    const snapshot = this.buildGroupingSnapshot();
    const check = helper.validateActivityGrouping(this.data.selectedPlayerIds, snapshot);
    if (!check.ok) {
      wx.showToast({ title: check.message, icon: "none" });
      return;
    }

    this.setData({ saving: true });
    wx.showLoading({ title: "保存分组...", mask: true });
    try {
      await db.saveActivityGrouping(this.data.activityId, snapshot);
      wx.hideLoading();
      wx.showToast({ title: "分组已保存", icon: "success" });
      setTimeout(() => {
        wx.redirectTo({ url: `/pages/activity/detail/detail?id=${this.data.activityId}` });
      }, 250);
    } catch (err) {
      console.error("save activity grouping failed", err);
      wx.hideLoading();
      wx.showToast({ title: "保存失败", icon: "none" });
    } finally {
      this.setData({ saving: false });
    }
  }
});
