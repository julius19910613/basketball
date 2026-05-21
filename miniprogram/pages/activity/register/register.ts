/// <reference path="../../../../typings/index.d.ts" />

import db from "../../../utils/db";
import helper from "../../../utils/activity-helper";
import env from "../../../config/env";

type AppInstance = ReturnType<typeof getApp>;
type AppDb = typeof db;
type ActivityHelper = typeof helper;
type EnvModule = typeof env;
type CloudDb = ReturnType<typeof wx.cloud.database>;

interface LoadOptions {
  id?: string;
}

interface ActivityRecord {
  _id?: string;
  status?: string;
  [key: string]: unknown;
}

interface LinkedPlayerRecord {
  _id?: string;
  linkedOpenid?: string;
  nickname?: string;
  name?: string;
  avatar?: string;
  position?: string;
  [key: string]: unknown;
}

interface UserRecord {
  linkedPlayerId?: string;
  [key: string]: unknown;
}

interface RegistrationRecord {
  playerId?: string;
  [key: string]: unknown;
}

interface RegisterPageData {
  id: string;
  loading: boolean;
  submitting: boolean;
  activity: ActivityRecord | null;
  linkedPlayer: LinkedPlayerRecord | null;
  registered: boolean;
  statusText: string;
}

let appInstance: AppInstance | null = null;
let cloudDb: CloudDb | null = null;

function getAppInstance(): AppInstance {
  if (!appInstance) {
    appInstance = getApp();
  }
  return appInstance;
}

function getDb(): AppDb {
  return db;
}

function getHelper(): ActivityHelper {
  return helper;
}

function getEnv(): EnvModule {
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
    submitting: false,
    activity: null,
    linkedPlayer: null,
    registered: false,
    statusText: ""
  } as RegisterPageData,

  onLoad(options: LoadOptions): void {
    this.setData({ id: options.id || "" });
    void this.loadData();
  },

  async loadLinkedPlayer(): Promise<LinkedPlayerRecord | null> {
    const openid = getAppInstance().globalData.openid || "";
    if (!openid) return null;
    const pageDb = getCloudDb();
    const userRes = await pageDb.collection(getEnv().getCollection("users")).where({ _openid: openid }).limit(1).get();
    const user = ((userRes.data || [])[0] || null) as UserRecord | null;
    if (!user || !user.linkedPlayerId) return null;
    const playerRes = await pageDb.collection(getEnv().getCollection("players")).doc(user.linkedPlayerId).get();
    return (playerRes.data || null) as LinkedPlayerRecord | null;
  },

  async loadData(): Promise<void> {
    if (!this.data.id) {
      this.setData({ loading: false });
      return;
    }
    this.setData({ loading: true });
    try {
      const [activity, registrations, linkedPlayer] = await Promise.all([
        getDb().getActivityDetail(this.data.id),
        getDb().getActivityRegistrations(this.data.id),
        this.loadLinkedPlayer().catch(() => null)
      ]);
      const registered = !!(
        linkedPlayer &&
        (registrations || []).some((item: RegistrationRecord) => item.playerId === linkedPlayer._id)
      );
      this.setData({
        loading: false,
        activity: (activity || null) as ActivityRecord | null,
        linkedPlayer: linkedPlayer as LinkedPlayerRecord | null,
        registered,
        statusText: getHelper().formatActivityStatus(activity && activity.status)
      });
    } catch (err) {
      console.error("load register page failed", err);
      this.setData({ loading: false });
      wx.showToast({ title: "加载失败", icon: "none" });
    }
  },

  async onRegister(): Promise<void> {
    if (!this.data.linkedPlayer) {
      wx.showToast({ title: "请先在个人中心绑定球员", icon: "none" });
      return;
    }
    this.setData({ submitting: true });
    wx.showLoading({ title: "报名中...", mask: true });
    try {
      await getDb().registerForActivity(this.data.id, this.data.linkedPlayer);
      wx.hideLoading();
      wx.showToast({ title: "报名成功", icon: "success" });
      void this.loadData();
    } catch (err) {
      console.error("register activity failed", err);
      wx.hideLoading();
      wx.showToast({ title: "报名失败", icon: "none" });
    } finally {
      this.setData({ submitting: false });
    }
  },

  async onCancelRegistration(): Promise<void> {
    if (!this.data.linkedPlayer) return;
    this.setData({ submitting: true });
    wx.showLoading({ title: "处理中...", mask: true });
    try {
      await getDb().cancelActivityRegistration(this.data.id, this.data.linkedPlayer._id || "");
      wx.hideLoading();
      wx.showToast({ title: "已取消报名", icon: "success" });
      void this.loadData();
    } catch (err) {
      console.error("cancel registration failed", err);
      wx.hideLoading();
      wx.showToast({ title: "取消失败", icon: "none" });
    } finally {
      this.setData({ submitting: false });
    }
  },

  goProfile(): void {
    wx.switchTab({ url: "/pages/profile/profile" });
  }
});

export {};
