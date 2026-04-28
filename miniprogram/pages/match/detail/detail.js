const db = require("../../../utils/db");
const helper = require("../../../utils/match-helper");

Page({
  data: {
    id: "",
    loading: true,
    tab: 0,
    match: null,
    playedPlayers: [],
    benchedPlayers: [],
    teamAPlayers: [],
    teamBPlayers: [],
    groupedPlayers: [],
    canEditGrouping: false
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
      const statsMap = {};
      (match.playerStats || []).forEach((item) => {
        statsMap[item.playerId] = item;
      });
      const teamAPlayers = ((match.grouping && match.grouping.teamAPlayerIds) || []).map((id) => statsMap[id]).filter(Boolean);
      const teamBPlayers = ((match.grouping && match.grouping.teamBPlayerIds) || []).map((id) => statsMap[id]).filter(Boolean);
      let groups = ((match.grouping && match.grouping.teams) || []).map((group) => ({
        teamName: group.teamName,
        players: (group.playerIds || []).map((id) => statsMap[id]).filter(Boolean)
      }));
      if (!groups.length && match.grouping) {
        const teamNames = (match.teamNames && match.teamNames.length >= 2) ? match.teamNames : ["A队", "B队"];
        groups = [
          { teamName: teamNames[0], players: (match.grouping.teamAPlayerIds || []).map((id) => statsMap[id]).filter(Boolean) },
          { teamName: teamNames[1], players: (match.grouping.teamBPlayerIds || []).map((id) => statsMap[id]).filter(Boolean) }
        ];
      }
      this.setData({
        loading: false,
        match: Object.assign({}, match, {
          teamsText: (match.teamNames || []).filter(Boolean).join(" vs ") || match.opponent || "未设置队伍",
          matchTypeText: helper.formatMatchType(match.matchType),
          diff: Number(match.scoreUs || 0) - Number(match.scoreOpponent || 0)
        }),
        playedPlayers: played,
        benchedPlayers: benched,
        teamAPlayers,
        teamBPlayers,
        groupedPlayers: groups,
        canEditGrouping: !helper.isGroupingLocked(match)
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
    if (!this.data.canEditGrouping) return;
    wx.navigateTo({ url: `/pages/match/grouping/grouping?id=${this.data.id}` });
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
