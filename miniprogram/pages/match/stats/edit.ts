/// <reference path="../../../../typings/index.d.ts" />

import db from "../../../utils/db";
import helper from "../../../utils/match-helper";
import env from "../../../config/env";

type Id = string | number;

interface QuarterScore {
  quarter: number;
  scoreUs: number;
  scoreOpponent: number;
  [key: string]: any;
}

interface MatchPlayer {
  _id?: Id;
  playerId?: Id;
  nickname?: string;
  name?: string;
  position?: string;
  [key: string]: any;
}

interface DisplayPlayer extends MatchPlayer {
  _id: Id;
  playerId: Id;
  displayNickname: string;
  displayPosition: string;
}

interface MatchRecord {
  _id?: Id;
  grouping?: {
    teams?: Array<{
      playerIds?: Id[];
      [key: string]: any;
    }>;
    [key: string]: any;
  } | null;
  selectedPlayerIds?: Id[];
  quarters?: QuarterScore[];
  playerStats?: any[];
  scoreUs?: number;
  scoreOpponent?: number;
  highlights?: string;
  [key: string]: any;
}

interface EditFormData {
  scoreUs: number;
  scoreOpponent: number;
  quarters: QuarterScore[];
  playerStats: any[];
  highlights: string;
}

interface StatsEditPageData {
  id: string;
  loading: boolean;
  saving: boolean;
  match: MatchRecord | null;
  players: DisplayPlayer[];
  form: EditFormData;
}

interface LoadOptions {
  id?: string;
  [key: string]: any;
}

interface InputEvent extends WechatMiniprogram.BaseEvent {
  currentTarget: WechatMiniprogram.BaseEvent["currentTarget"] & {
    dataset: {
      field?: string;
      index?: string | number;
      side?: string;
    };
  };
  detail: {
    value?: any;
    [key: string]: any;
  };
}

let cloudDb: any;

function getDb(): any {
  return db;
}

function getHelper(): any {
  return helper;
}

function getEnv(): any {
  return env;
}

function getCloudDb(): any {
  if (!cloudDb) {
    cloudDb = wx.cloud.database();
  }
  return cloudDb;
}

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
  } as StatsEditPageData,

  onLoad(options: LoadOptions): void {
    this.setData({ id: options.id || "" });
    this.loadData();
  },

  async loadData(): Promise<void> {
    if (!this.data.id) {
      this.setData({ loading: false });
      return;
    }
    this.setData({ loading: true });
    try {
      const db = getDb();
      const getCollection = getEnv().getCollection as (name: string) => string;
      const match = (await db.getMatchDetail(this.data.id)) as MatchRecord;
      const groupedIds = (((match.grouping && match.grouping.teams) || []) as Array<{ playerIds?: Id[] }>).reduce(
        (acc: Id[], team: { playerIds?: Id[] }) => acc.concat(team.playerIds || []),
        []
      );
      const selectedIds = Array.from(new Set(((match.selectedPlayerIds || []) as Id[]).concat(groupedIds)));
      const playersRes = await getCloudDb()
        .collection(getCollection("players"))
        .orderBy("createdAt", "desc")
        .get();
      const players = ((playersRes.data || []) as MatchPlayer[])
        .map((item: MatchPlayer) => ({
          ...item,
          _id: item._id || item.playerId || "",
          playerId: item._id || item.playerId || "",
          displayNickname: item.nickname || item.name || "未命名球员",
          displayPosition: item.position || "-"
        }))
        .filter((item: DisplayPlayer) => selectedIds.includes(item.playerId));

      this.setData({
        loading: false,
        match,
        players,
        form: {
          scoreUs: match.scoreUs || 0,
          scoreOpponent: match.scoreOpponent || 0,
          quarters: (match.quarters && match.quarters.length ? match.quarters : this.data.form.quarters).map(
            (item: QuarterScore, index: number) => ({
              quarter: item.quarter || index + 1,
              scoreUs: Number(item.scoreUs || 0),
              scoreOpponent: Number(item.scoreOpponent || 0)
            })
          ),
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

  onScoreInput(e: InputEvent): void {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: Number(e.detail.value || 0) });
  },

  onQuarterInput(e: InputEvent): void {
    const index = Number(e.currentTarget.dataset.index);
    const side = e.currentTarget.dataset.side;
    this.setData({ [`form.quarters[${index}].${side}`]: Number(e.detail.value || 0) });
  },

  onHighlightsInput(e: InputEvent): void {
    this.setData({ "form.highlights": e.detail.value });
  },

  onPlayerStatsChange(e: InputEvent): void {
    this.setData({ "form.playerStats": e.detail.value || [] });
  },

  buildSubmitPayload(): MatchRecord {
    void getHelper();
    return Object.assign({}, this.data.match, {
      scoreUs: Number(this.data.form.scoreUs || 0),
      scoreOpponent: Number(this.data.form.scoreOpponent || 0),
      quarters: (this.data.form.quarters || []).map((item: QuarterScore, index: number) => ({
        quarter: item.quarter || index + 1,
        scoreUs: Number(item.scoreUs || 0),
        scoreOpponent: Number(item.scoreOpponent || 0)
      })),
      playerStats: this.data.form.playerStats || [],
      highlights: this.data.form.highlights || "",
      matchStatus: "finished"
    });
  },

  async onSave(): Promise<void> {
    this.setData({ saving: true });
    wx.showLoading({ title: "保存中...", mask: true });
    try {
      await getDb().updateMatch(this.data.id, this.buildSubmitPayload());
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

export {};
