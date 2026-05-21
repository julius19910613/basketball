/// <reference path="../../../../typings/index.d.ts" />

import db from "../../../utils/db";
import helper from "../../../utils/activity-helper";

type AppInstance = ReturnType<typeof getApp>;
type AppDb = typeof db;
type ActivityHelper = typeof helper;

interface ActivityFormData {
  title: string;
  activityDate: string;
  startTime: string;
  endTime: string;
  location: string;
  ruleType: string;
  formatType: string;
  teamCount: number;
  teamNames: string[];
  status: string;
  registrationDeadline: string;
  groupingSnapshot: {
    version: number;
    teams: Array<{
      teamName: string;
      playerIds: string[];
    }>;
    lockedAt: string | null;
    selectedPlayerIds?: string[];
  };
}

interface CreatePageData {
  saving: boolean;
  form: ActivityFormData;
}

interface SavePayloadExtra {
  status: string;
  createdByOpenid: string;
}

let appInstance: AppInstance | null = null;

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

Page({
  data: {
    saving: false,
    form: getHelper().createEmptyActivity()
  } as CreatePageData,

  onLoad(): void {},

  onInput(e: WechatMiniprogram.BaseEvent): void {
    const { field } = e.currentTarget.dataset as { field?: string };
    if (!field) return;
    this.setData({ [`form.${field}`]: (e as WechatMiniprogram.CustomEvent).detail.value });
  },

  onDateChange(e: WechatMiniprogram.CustomEvent): void {
    this.setData({ "form.activityDate": e.detail.value });
  },

  onStartTimeChange(e: WechatMiniprogram.CustomEvent): void {
    const pageHelper = getHelper();
    const startTime = e.detail.value;
    this.setData({
      "form.startTime": startTime,
      "form.registrationDeadline": pageHelper.getDefaultDeadline(this.data.form.activityDate, startTime)
    });
  },

  onEndTimeChange(e: WechatMiniprogram.CustomEvent): void {
    this.setData({ "form.endTime": e.detail.value });
  },

  onDeadlineInput(e: WechatMiniprogram.CustomEvent): void {
    this.setData({ "form.registrationDeadline": e.detail.value });
  },

  onTeamNameInput(e: WechatMiniprogram.BaseEvent): void {
    const { index } = e.currentTarget.dataset as { index?: string | number };
    const nextIndex = Number(index);
    if (!Number.isFinite(nextIndex)) return;
    this.setData({ [`form.teamNames[${nextIndex}]`]: (e as WechatMiniprogram.CustomEvent).detail.value });
  },

  async save(status: string): Promise<void> {
    const pageHelper = getHelper();
    const errorMessage = pageHelper.validateActivityForm(this.data.form);
    if (errorMessage) {
      wx.showToast({ title: errorMessage, icon: "none" });
      return;
    }

    this.setData({ saving: true });
    wx.showLoading({ title: status === "registration_open" ? "发布中..." : "保存中...", mask: true });
    try {
      const payload = pageHelper.prepareActivityForSave(this.data.form, {
        status: status,
        createdByOpenid: getAppInstance().globalData.openid || ""
      } as any);
      const activityId = await getDb().createActivity(payload);
      wx.hideLoading();
      wx.showToast({ title: status === "registration_open" ? "活动已发布" : "草稿已保存", icon: "success" });
      setTimeout(() => {
        wx.redirectTo({ url: `/pages/activity/detail/detail?id=${activityId}` });
      }, 250);
    } catch (err) {
      console.error("save activity failed", err);
      wx.hideLoading();
      wx.showToast({ title: "保存失败", icon: "none" });
    } finally {
      this.setData({ saving: false });
    }
  },

  onSaveDraft(): void {
    void this.save("draft");
  },

  onPublish(): void {
    void this.save("registration_open");
  }
});

export {};
