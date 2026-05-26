/// <reference path="../../../../typings/index.d.ts" />
import db from "../../../utils/db";
import helper from "../../../utils/match-helper";

interface PlayerRow {
  playerId: string;
  nickname: string;
  position: string;
  rankNum: number;
  fgDisplay: string;
  fgPctDisplay: string;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  [key: string]: unknown;
}

interface RatingSummary {
  playerId: string;
  ratingCount: number;
  averageScore: number;
  averageStar: number;
  tagSummary?: Array<{ tag: string; count: number }>;
  compatMode?: boolean;
}

interface RatingRow extends PlayerRow {
  summary: RatingSummary;
  myRating: {
    score: number;
    starValue: number;
    tags: string[];
    comment: string;
  };
  ratingComment: string;
  ratingTags: string[];
  submitting: boolean;
}

interface TeamStatSummary {
  totalPoints: number;
  totalRebounds: number;
  totalAssists: number;
  totalSteals: number;
  totalBlocks: number;
  fgDisplay: string;
  fgPctDisplay: string;
}

interface TeamStatPanel {
  teamName: string;
  score: number;
  isWinner: boolean;
  players: PlayerRow[];
  summary: TeamStatSummary;
  leaders: string[];
}

interface GroupedTeam {
  teamName: string;
  players: Array<Record<string, unknown> & { nickname?: string; position?: string }>;
}

interface DetailPageData {
  id: string;
  loading: boolean;
  tab: number;
  quarterTab: number;
  match: Record<string, unknown> & {
    teamNames?: string[];
    opponent?: string;
    matchTypeText?: string;
    scoreUs?: number | string;
    scoreOpponent?: number | string;
    diff?: number;
    isGroupingLocked?: boolean;
    highlights?: string;
    quarters?: Array<{ quarter: number; scoreUs: number; scoreOpponent: number }>;
    grouping?: {
      teams?: Array<{ teamName: string; playerIds: string[] }>;
      teamAPlayerIds?: string[];
      teamBPlayerIds?: string[];
    };
    playerStats?: Array<Record<string, unknown> & { played?: boolean; playerId?: string }>;
    [key: string]: unknown;
  } | null;
  playedPlayers: Array<Record<string, unknown>>;
  benchedPlayers: Array<Record<string, unknown> & { nickname?: string; position?: string }>;
  groupedPlayers: GroupedTeam[];
  teamStatPanels: TeamStatPanel[];
  canEditGrouping: boolean;
  currentOpenid: string;
  ratingRows: RatingRow[];
  ratingLoading: boolean;
  ratingError: string;
  ratingReady: boolean;
  ratingTagOptions: string[];
  ratingEnabled: boolean;
  ratingDisabledReason: string;
}

interface TabChangeEvent extends WechatMiniprogram.BaseEvent {
  currentTarget: WechatMiniprogram.BaseEvent["currentTarget"] & {
    dataset: {
      tab?: string | number;
      idx?: string | number;
    };
  };
}

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
    canEditGrouping: false,
    currentOpenid: "",
    ratingRows: [],
    ratingLoading: false,
    ratingError: "",
    ratingReady: false,
    ratingTagOptions: ["得分稳定", "篮板积极", "组织清晰", "防守在线", "关键先生", "团队配合", "拼抢积极", "投篮手感", "节奏掌控", "进步明显"],
    ratingEnabled: false,
    ratingDisabledReason: ""
  } as DetailPageData,

  onLoad(options: { id?: string }): void {
    this.setData({ id: options.id || "" });
    this.loadDetail();
  },

  async loadDetail(): Promise<void> {
    if (!this.data.id) {
      this.setData({ loading: false });
      return;
    }
    this.setData({ loading: true });
    try {
      const match = await db.getMatchDetail(this.data.id);
      const played = (match.playerStats || [])
        .filter((item: { played?: boolean }) => item.played)
        .sort((a: { points?: number }, b: { points?: number }) => (b.points || 0) - (a.points || 0));
      const benched = (match.playerStats || []).filter((item: { played?: boolean }) => !item.played);
      const statsMap: Record<string, Record<string, unknown>> = {};
      (match.playerStats || []).forEach((item: Record<string, unknown>) => {
        if (item.playerId) statsMap[item.playerId as string] = item;
      });

      let groups: GroupedTeam[] = ((match.grouping && match.grouping.teams) || []).map((group: { teamName: string; playerIds: string[] }) => ({
        teamName: group.teamName,
        players: (group.playerIds || []).map((id: string) => statsMap[id]).filter(Boolean)
      }));

      if (!groups.length && match.grouping) {
        const teamNames = (match.teamNames && match.teamNames.length >= 2) ? match.teamNames : ["A队", "B队"];
        groups = [
          { teamName: teamNames[0], players: (match.grouping.teamAPlayerIds || []).map((id: string) => statsMap[id]).filter(Boolean) },
          { teamName: teamNames[1], players: (match.grouping.teamBPlayerIds || []).map((id: string) => statsMap[id]).filter(Boolean) }
        ];
      }

      if (!groups.length && played.length) {
        groups = [{ teamName: (match.teamNames && match.teamNames[0]) || "参赛球员", players: played }];
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
        canEditGrouping: !helper.isGroupingLocked(match),
        ratingEnabled: this.isRatingOpen(match),
        ratingDisabledReason: this.getRatingDisabledReason(match)
      });
      this.initRatingData();
    } catch (err) {
      console.error("load match detail failed", err);
      this.setData({ loading: false });
      wx.showToast({ title: "加载失败", icon: "none" });
    }
  },

  isRatingOpen(match: Record<string, unknown>): boolean {
    const session = match.ratingSession as { status?: string } | undefined;
    return match.matchStatus === "finished" && (!session || !session.status || session.status === "open");
  },

  getRatingDisabledReason(match: Record<string, unknown>): string {
    const session = match.ratingSession as { status?: string } | undefined;
    if (match.matchStatus !== "finished") return "比赛结束后开放评分";
    if (session && session.status && session.status !== "open") return "本场评分已关闭";
    return "";
  },

  async initRatingData(): Promise<void> {
    const currentOpenid = await this.resolveOpenid();
    this.setData({ currentOpenid });
    await this.loadRatingData();
  },

  async resolveOpenid(): Promise<string> {
    try {
      const app = getApp() as unknown as { globalData?: { openid?: string | null }; getOpenId?: () => Promise<string> };
      if (app.globalData && app.globalData.openid) return app.globalData.openid;
      if (app.getOpenId) {
        const openid = await app.getOpenId();
        return openid || "";
      }
    } catch (err) {
      console.warn("resolve openid failed", err);
    }
    return "";
  },

  async loadRatingData(): Promise<void> {
    if (!this.data.match) return;
    this.setData({ ratingLoading: true, ratingError: "" });
    try {
      const summaries = await db.getMatchPlayerRatingSummaries(this.data.id);
      const myRatings = this.data.currentOpenid
        ? await db.getMyMatchRatings(this.data.id, this.data.currentOpenid)
        : [];
      this.setData({
        ratingRows: this.buildRatingRows(summaries || [], myRatings || []),
        ratingLoading: false,
        ratingReady: true
      });
    } catch (err) {
      console.error("load rating data failed", err);
      this.setData({
        ratingRows: this.buildRatingRows([], []),
        ratingLoading: false,
        ratingReady: true,
        ratingError: "评分数据暂不可用"
      });
    }
  },

  buildRatingRows(summaries: RatingSummary[], myRatings: Array<Record<string, unknown>>): RatingRow[] {
    const summaryMap: Record<string, RatingSummary> = {};
    (summaries || []).forEach((item) => {
      if (item && item.playerId) summaryMap[item.playerId] = item;
    });

    const ratingMap: Record<string, Record<string, unknown>> = {};
    (myRatings || []).forEach((item) => {
      const playerId = String(item.playerId || "");
      if (playerId) ratingMap[playerId] = item;
    });

    return (this.data.playedPlayers as PlayerRow[]).map((player) => {
      const playerId = String(player.playerId || "");
      const own = ratingMap[playerId] || {};
      const score = Number(own.score || 0);
      const tags = Array.isArray(own.tags) ? (own.tags as string[]) : [];
      return Object.assign({}, player, {
        summary: Object.assign({
          playerId,
          ratingCount: 0,
          averageScore: 0,
          averageStar: 0,
          tagSummary: []
        }, summaryMap[playerId] || {}),
        myRating: {
          score,
          starValue: score ? score / 2 : 0,
          tags,
          comment: String(own.comment || "")
        },
        ratingComment: String(own.comment || ""),
        ratingTags: tags,
        submitting: false
      });
    });
  },

  formatPct(value: number | string | null | undefined): string {
    const num = Number(value || 0);
    return `${num % 1 === 0 ? num.toFixed(0) : num.toFixed(1)}%`;
  },

  sumBy(players: Array<Record<string, unknown>>, key: string): number {
    return (players || []).reduce((sum: number, item: Record<string, unknown>) => sum + Number(item[key] || 0), 0);
  },

  findLeader(players: Array<Record<string, unknown>>, key: string): Record<string, unknown> | null {
    if (!players || !players.length) return null;
    return players.reduce((best: Record<string, unknown> | null, item: Record<string, unknown>) => {
      if (!best) return item;
      return Number(item[key] || 0) > Number(best[key] || 0) ? item : best;
    }, null);
  },

  buildTeamStatPanels(groups: GroupedTeam[], match: Record<string, unknown>): TeamStatPanel[] {
    const teamScores = [Number(match.scoreUs || 0), Number(match.scoreOpponent || 0)];
    return (groups || []).map((group, index) => {
      const players: PlayerRow[] = (group.players || [])
        .slice()
        .sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
          const pointDiff = Number(b.points || 0) - Number(a.points || 0);
          if (pointDiff !== 0) return pointDiff;
          return Number(b.rebounds || 0) - Number(a.rebounds || 0);
        })
        .map((player: Record<string, unknown>, playerIndex: number) => {
          return Object.assign({}, player, {
            playerId: String(player.playerId || ""),
            nickname: String(player.nickname || "未命名球员"),
            position: String(player.position || "-"),
            rankNum: playerIndex + 1,
            fgDisplay: `${player.shotsMade || 0}/${player.shotsAttempted || 0}`,
            fgPctDisplay: this.formatPct(player.fgPct as string | number | null | undefined),
            points: Number(player.points || 0),
            rebounds: Number(player.rebounds || 0),
            assists: Number(player.assists || 0),
            steals: Number(player.steals || 0)
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

  onTabChange(e: TabChangeEvent): void {
    this.setData({ tab: Number(e.currentTarget.dataset.tab) || 0 });
  },

  onQuarterTabChange(e: TabChangeEvent): void {
    this.setData({ quarterTab: Number(e.currentTarget.dataset.idx) || 0 });
  },

  onRatingChange(e: WechatMiniprogram.CustomEvent): void {
    const index = Number(e.currentTarget.dataset.index);
    const starValue = Number(e.detail || 0);
    if (!Number.isFinite(index) || index < 0) return;
    this.setData({
      [`ratingRows.${index}.myRating.starValue`]: starValue,
      [`ratingRows.${index}.myRating.score`]: Math.round(starValue * 2)
    });
  },

  onRatingCommentInput(e: WechatMiniprogram.CustomEvent): void {
    const index = Number(e.currentTarget.dataset.index);
    if (!Number.isFinite(index) || index < 0) return;
    const value = String((e.detail && e.detail.value) || "").slice(0, 80);
    this.setData({
      [`ratingRows.${index}.ratingComment`]: value,
      [`ratingRows.${index}.myRating.comment`]: value
    });
  },

  onRatingTagToggle(e: WechatMiniprogram.BaseEvent): void {
    const index = Number(e.currentTarget.dataset.index);
    const tag = String(e.currentTarget.dataset.tag || "");
    if (!Number.isFinite(index) || index < 0 || !tag) return;
    const row = this.data.ratingRows[index];
    const current = row.ratingTags || [];
    const exists = current.indexOf(tag) !== -1;
    const next = exists ? current.filter((item) => item !== tag) : current.concat(tag).slice(0, 3);
    this.setData({
      [`ratingRows.${index}.ratingTags`]: next,
      [`ratingRows.${index}.myRating.tags`]: next
    });
  },

  async onSubmitRating(e: WechatMiniprogram.BaseEvent): Promise<void> {
    const index = Number(e.currentTarget.dataset.index);
    const row = this.data.ratingRows[index];
    if (!row) return;
    if (!this.data.ratingEnabled) {
      wx.showToast({ title: this.data.ratingDisabledReason || "当前不可评分", icon: "none" });
      return;
    }
    if (!this.data.currentOpenid) {
      wx.showToast({ title: "无法获取用户身份", icon: "none" });
      return;
    }
    const score = Number(row.myRating.score || 0);
    const starValue = Number(row.myRating.starValue || score / 2);
    if (!score) {
      wx.showToast({ title: "请选择评分", icon: "none" });
      return;
    }

    this.setData({ [`ratingRows.${index}.submitting`]: true });
    try {
      await db.submitPlayerRating({
        matchId: this.data.id,
        playerId: row.playerId,
        score,
        starValue,
        tags: row.ratingTags || [],
        comment: row.ratingComment || ""
      });
      wx.showToast({ title: "评分已提交", icon: "success" });
      await this.loadRatingData();
    } catch (err) {
      wx.showToast({ title: err instanceof Error ? err.message : "提交失败", icon: "none" });
      this.setData({ [`ratingRows.${index}.submitting`]: false });
    }
  },

  onEdit(): void {
    if (!this.data.canEditGrouping) return;
    wx.navigateTo({ url: `/pages/match/grouping/grouping?id=${this.data.id}` });
  },

  async onDelete(): Promise<void> {
    const confirm = await new Promise<boolean>((resolve) => {
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

export {};
