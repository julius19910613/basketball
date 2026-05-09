const db = require("../../../utils/db");
const helper = require("../../../utils/match-helper");

Page({
  data: {
    id: "",
    loading: true,
    tab: 1,
    quarterTab: 0,
    match: null,
    playedPlayers: [],
    benchedPlayers: [],
    groupedPlayers: [],
    teamStatPanels: [],
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

      // 回退：无有效分组时，用 playedPlayers 塞成默认分组
      if (!groups.length && played.length) {
        groups = [{ teamName: match.teamNames[0] || "参赛球员", players: played }];
      }

      const teamStatPanels = this.buildTeamStatPanels(groups, match);
      this.setData({
        loading: false,
        match: Object.assign({}, match, {
          teamsText: (match.teamNames || []).filter(Boolean).join(" vs ") || match.opponent || "未设置队伍",
          matchTypeText: helper.formatMatchType(match.matchType),
          diff: Number(match.scoreUs || 0) - Number(match.scoreOpponent || 0)
        }),
        playedPlayers: played,
        benchedPlayers: benched,
        groupedPlayers: groups,
        teamStatPanels,
        canEditGrouping: !helper.isGroupingLocked(match)
      });
    } catch (err) {
      console.error("load match detail failed", err);
      this.setData({ loading: false });
      wx.showToast({ title: "加载失败", icon: "none" });
    }
  },

  formatPct(value) {
    const num = Number(value || 0);
    return `${num % 1 === 0 ? num.toFixed(0) : num.toFixed(1)}%`;
  },

  sumBy(players, key) {
    return (players || []).reduce((sum, item) => sum + Number(item[key] || 0), 0);
  },

  findLeader(players, key) {
    if (!players || !players.length) return null;
    return players.reduce((best, item) => {
      if (!best) return item;
      return Number(item[key] || 0) > Number(best[key] || 0) ? item : best;
    }, null);
  },

  buildTeamStatPanels(groups, match) {
    const teamScores = [Number(match.scoreUs || 0), Number(match.scoreOpponent || 0)];
    return (groups || []).map((group, index) => {
      const players = (group.players || [])
        .slice()
        .sort((a, b) => {
          const pointDiff = Number(b.points || 0) - Number(a.points || 0);
          if (pointDiff !== 0) return pointDiff;
          return Number(b.rebounds || 0) - Number(a.rebounds || 0);
        })
        .map((player, playerIndex) => {
          return Object.assign({}, player, {
            rankNum: playerIndex + 1,
            fgDisplay: `${player.shotsMade || 0}/${player.shotsAttempted || 0}`,
            fgPctDisplay: this.formatPct(player.fgPct)
          });
        });

      const totalPoints = this.sumBy(players, "points");
      const totalRebounds = this.sumBy(players, "rebounds");
      const totalAssists = this.sumBy(players, "assists");
      const totalSteals = this.sumBy(players, "steals");
      const totalBlocks = this.sumBy(players, "blocks");
      const totalShotsMade = this.sumBy(players, "shotsMade");
      const totalShotsAttempted = this.sumBy(players, "shotsAttempted");
      const topScorer = this.findLeader(players, "points");
      const glassCleaner = this.findLeader(players, "rebounds");
      const playmaker = this.findLeader(players, "assists");

      return {
        teamName: group.teamName || `队伍${index + 1}`,
        score: teamScores[index] || 0,
        isWinner: index === 0 ? teamScores[0] > teamScores[1] : teamScores[index] > (teamScores[0] || 0),
        players,
        summary: {
          totalPoints,
          totalRebounds,
          totalAssists,
          totalSteals,
          totalBlocks,
          fgDisplay: `${totalShotsMade}/${totalShotsAttempted}`,
          fgPctDisplay: this.formatPct(totalShotsAttempted ? (totalShotsMade / totalShotsAttempted) * 100 : 0)
        },
        leaders: [
          topScorer ? `${topScorer.nickname} ${topScorer.points}分` : "暂无得分王",
          glassCleaner ? `${glassCleaner.nickname} ${glassCleaner.rebounds}板` : "暂无篮板王",
          playmaker ? `${playmaker.nickname} ${playmaker.assists}助` : "暂无助攻王"
        ]
      };
    });
  },

  onTabChange(e) {
    this.setData({ tab: Number(e.currentTarget.dataset.tab) || 0 });
  },

  onQuarterTabChange(e) {
    this.setData({ quarterTab: Number(e.currentTarget.dataset.idx) || 0 });
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
