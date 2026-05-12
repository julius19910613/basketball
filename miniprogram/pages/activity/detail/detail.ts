/// <reference path="../../../../typings/index.d.ts" />

type AppInstance = ReturnType<typeof getApp>;
type AppDb = typeof import("../../../utils/db");
type ActivityHelper = typeof import("../../../utils/activity-helper");
type EnvModule = typeof import("../../../config/env");
type CloudDb = ReturnType<typeof wx.cloud.database>;

interface LoadOptions {
  id?: string;
}

interface ActivityRecord {
  _id?: string | number;
  title?: string;
  status?: string;
  [key: string]: any;
}

interface RegistrationRecord {
  _id?: string | number;
  playerId?: string | number;
  status?: string;
  [key: string]: any;
}

interface MatchRecord {
  _id?: string | number;
  teamNames?: Array<string | null | undefined>;
  homeTeamName?: string;
  awayTeamName?: string;
  versusText?: string;
  [key: string]: any;
}

interface LinkedPlayerRecord {
  _id?: string | number;
  linkedPlayerId?: string | number;
  [key: string]: any;
}

interface UserRecord {
  _id?: string | number;
  linkedPlayerId?: string | number;
  [key: string]: any;
}

interface DetailPageData {
  id: string;
  loading: boolean;
  activity: ActivityRecord | null;
  registrations: RegistrationRecord[];
  matches: MatchRecord[];
  linkedPlayer: LinkedPlayerRecord | null;
  registered: boolean;
  statusText: string;
}

let appInstance: AppInstance | null = null;
let db: AppDb | null = null;
let helper: ActivityHelper | null = null;
let env: EnvModule | null = null;
let cloudDb: CloudDb | null = null;

function getAppInstance(): AppInstance {
  if (!appInstance) {
    appInstance = getApp();
  }
  return appInstance;
}

function getDb(): AppDb {
  if (!db) {
    db = require("../../../utils/db") as AppDb;
  }
  return db;
}

function getHelper(): ActivityHelper {
  if (!helper) {
    helper = require("../../../utils/activity-helper") as ActivityHelper;
  }
  return helper;
}

function getEnv(): EnvModule {
  if (!env) {
    env = require("../../../config/env") as EnvModule;
  }
  return env;
}

function getCloudDb(): CloudDb {
  if (!cloudDb) {
    cloudDb = wx.cloud.database();
  }
  return cloudDb;
}

Page({
  data: {
    id: "",
    loading: true,
    activity: null,
    registrations: [],
    matches: [],
    linkedPlayer: null,
    registered: false,
    statusText: ""
  } as DetailPageData,

  onLoad(options: LoadOptions): void {
    this.setData({ id: options.id || "" });
    void this.loadPageData();
  },

  onShow(): void {
    if (this.data.id) {
      void this.loadPageData();
    }
  },

  async loadLinkedPlayer(): Promise<LinkedPlayerRecord | null> {
    const openid = getAppInstance().globalData.openid || "";
    if (!openid) return null;
    const pageDb = getCloudDb();
    const usersCollection = getEnv().getCollection("users");
    const playersCollection = getEnv().getCollection("players");
    const userRes = await pageDb.collection(usersCollection).where({ _openid: openid }).limit(1).get();
    const user = ((userRes.data || [])[0] || null) as UserRecord | null;
    if (!user || !user.linkedPlayerId) return null;
    const playerRes = await pageDb.collection(playersCollection).doc(String(user.linkedPlayerId)).get();
    return (playerRes.data || null) as LinkedPlayerRecord | null;
  },

  async loadPageData(): Promise<void> {
    if (!this.data.id) {
      this.setData({ loading: false });
      return;
    }
    this.setData({ loading: true });
    try {
      const pageDb = getDb();
      const [activity, registrations, linkedPlayer] = await Promise.all([
        pageDb.getActivityDetail(this.data.id),
        pageDb.getActivityRegistrations(this.data.id),
        this.loadLinkedPlayer().catch(() => null)
      ]);
      const matches = await pageDb.getMatchesByActivity(this.data.id).catch(() => []);
      const playerId = linkedPlayer && linkedPlayer._id;
      const registered = !!(playerId && registrations.some((item: RegistrationRecord) => item.playerId === playerId));
      this.setData({
        loading: false,
        activity: activity as ActivityRecord | null,
        registrations: (registrations || []) as RegistrationRecord[],
        matches: (matches || []).map((item: MatchRecord) => ({
          ...item,
          versusText: ((item.teamNames || []).filter(Boolean).join(" vs ")) || `${item.homeTeamName} vs ${item.awayTeamName}`
        })),
        linkedPlayer: linkedPlayer as LinkedPlayerRecord | null,
        registered,
        statusText: getHelper().formatActivityStatus(activity && activity.status)
      });
    } catch (err) {
      console.error("load activity detail failed", err);
      this.setData({ loading: false });
      wx.showToast({ title: "加载活动失败", icon: "none" });
    }
  },

  onCreateActivity(): void {
    wx.navigateTo({ url: "/pages/activity/create/create" });
  },

  onGoRegister(): void {
    wx.navigateTo({ url: `/pages/activity/register/register?id=${this.data.id}` });
  },

  onGoGrouping(): void {
    wx.navigateTo({ url: `/pages/activity/grouping/grouping?id=${this.data.id}` });
  },

  async onGenerateSchedule(): Promise<void> {
    if (!this.data.activity) return;
    wx.showLoading({ title: "生成赛程...", mask: true });
    try {
      await getDb().generateActivityMatches(this.data.activity);
      wx.hideLoading();
      wx.showToast({ title: "6场赛程已生成", icon: "success" });
      void this.loadPageData();
    } catch (err) {
      console.error("generate schedule failed", err);
      wx.hideLoading();
      wx.showToast({ title: "生成失败", icon: "none" });
    }
  },

  onGoMatchStats(e: WechatMiniprogram.BaseEvent): void {
    const { id } = e.currentTarget.dataset as { id?: string | number };
    if (!id) return;
    wx.navigateTo({ url: `/pages/match/stats/edit?id=${id}` });
  },

  async onCloseRegistration(): Promise<void> {
    if (!this.data.activity || this.data.activity.status !== "registration_open") return;
    wx.showLoading({ title: "处理中...", mask: true });
    try {
      await getDb().closeActivityRegistration(this.data.id);
      wx.hideLoading();
      wx.showToast({ title: "已截止报名", icon: "success" });
      void this.loadPageData();
    } catch (err) {
      console.error("close registration failed", err);
      wx.hideLoading();
      wx.showToast({ title: "操作失败", icon: "none" });
    }
  },

  onShareAppMessage(): { title: string; path: string } {
    const title = (this.data.activity && this.data.activity.title) || "篮球活动报名";
    return {
      title: title,
      path: `/pages/activity/register/register?id=${this.data.id}`
    };
  }
});

export {};
