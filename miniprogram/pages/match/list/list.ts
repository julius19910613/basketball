/// <reference path="../../../../typings/index.d.ts" />

const db = require("../../../utils/db");
const helper = require("../../../utils/match-helper");

interface MatchFilter {
  status?: "draft" | "finalized";
  playerId?: string;
}

interface MatchListItem {
  _id?: string;
  opponent?: string;
  teamNames?: string[];
  matchType?: string;
  status?: "draft" | "finalized" | string;
  result?: "win" | "loss" | "draw" | string;
  scoreUs?: number | string;
  scoreOpponent?: number | string;
  [key: string]: unknown;
}

interface FormattedMatchListItem extends MatchListItem {
  teamsText: string;
  matchTypeText: string;
  typeClass: string;
  scoreClass: string;
  resultClass: string;
  status: string;
  statusText: string;
  statusClass: string;
}

interface ListPageData {
  teamId: string;
  playerId: string;
  matches: FormattedMatchListItem[];
  loading: boolean;
  loadingMore: boolean;
  activeTab: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

interface LoadOptions {
  teamId?: string;
  playerId?: string;
}

interface TabChangeEvent extends WechatMiniprogram.BaseEvent {
  currentTarget: WechatMiniprogram.BaseEvent["currentTarget"] & {
    dataset: {
      tab?: string | number;
    };
  };
}

interface MatchActionEvent extends WechatMiniprogram.BaseEvent {
  currentTarget: WechatMiniprogram.BaseEvent["currentTarget"] & {
    dataset: {
      id?: string;
      locked?: boolean;
    };
  };
}

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
  } as ListPageData,

  onLoad(options: LoadOptions): void {
    this.setData({
      teamId: options.teamId || "",
      playerId: options.playerId || ""
    });
    this.loadMatches(true);
  },

  onPullDownRefresh(): void {
    this.loadMatches(true).finally(() => wx.stopPullDownRefresh());
  },

  onReachBottom(): void {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadMatches(false);
    }
  },

  onTabChange(e: TabChangeEvent): void {
    this.setData({ activeTab: Number(e.currentTarget.dataset.tab) || 0 });
    this.loadMatches(true);
  },

  async loadMatches(reset: boolean): Promise<void> {
    if (reset) {
      this.setData({ loading: true, page: 0, hasMore: true });
    } else {
      this.setData({ loadingMore: true });
    }

    try {
      const filter: MatchFilter = {};
      if (this.data.activeTab === 1) filter.status = "draft";
      if (this.data.activeTab === 2) filter.status = "finalized";
      if (this.data.playerId) filter.playerId = this.data.playerId;

      const page = reset ? 0 : this.data.page;
      const list = (await db.getMatchList(
        this.data.teamId,
        filter,
        page,
        this.data.pageSize
      )) as MatchListItem[];
      const formattedList = list.map(this.formatMatchCard);
      const merged = reset ? formattedList : this.data.matches.concat(formattedList);
      this.setData({
        matches: merged,
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

  formatMatchCard(item: MatchListItem): FormattedMatchListItem {
    const diff = Number(item.scoreUs || 0) - Number(item.scoreOpponent || 0);
    const status = item.status || "finalized";
    const groupingLocked = helper.isGroupingLocked(item);
    return Object.assign({}, item, {
      teamsText: (item.teamNames || []).filter(Boolean).join(" vs ") || item.opponent || "未设置队伍",
      matchTypeText: helper.formatMatchType(item.matchType),
      typeClass: helper.getMatchTypeTagClass(item.matchType),
      scoreClass: diff >= 0 ? "score-win" : "score-loss",
      resultClass: item.result === "win" ? "result-win" : item.result === "loss" ? "result-loss" : "result-draw",
      status,
      statusText: groupingLocked ? "已锁定" : status === "draft" ? "待分组" : "已完成",
      statusClass: status === "draft" ? "status-draft" : "status-finalized"
    });
  },

  goCreate(): void {
    const query = this.data.teamId ? `?teamId=${this.data.teamId}` : "";
    wx.navigateTo({ url: `/pages/match/create/create${query}` });
  },

  goDetail(e: MatchActionEvent): void {
    const id = e.currentTarget.dataset.id;
    const locked = e.currentTarget.dataset.locked;
    if (!locked) {
      wx.navigateTo({ url: `/pages/match/grouping/grouping?id=${id}` });
      return;
    }
    wx.navigateTo({ url: `/pages/match/detail/detail?id=${id}` });
  },

  async onDelete(e: MatchActionEvent): Promise<void> {
    const id = e.currentTarget.dataset.id;
    const confirm = await new Promise<boolean>((resolve) => {
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

export {};
