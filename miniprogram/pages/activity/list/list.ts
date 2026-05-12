/// <reference path="../../../../typings/index.d.ts" />

const db: typeof import("../../../utils/db") = require("../../../utils/db");
const helper: typeof import("../../../utils/activity-helper") = require("../../../utils/activity-helper");

interface ActivityListItem {
  _id?: string;
  status?: string;
  statusText?: string;
  [key: string]: any;
}

interface ListPageData {
  loading: boolean;
  activities: ActivityListItem[];
}

Page({
  data: {
    loading: true,
    activities: []
  } as ListPageData,

  onShow(): void {
    this.loadActivities();
  },

  async loadActivities(): Promise<void> {
    this.setData({ loading: true });
    try {
      const activities = await db.getActivityList(0, 20);
      this.setData({
        loading: false,
        activities: (activities || []).map((item: ActivityListItem) => Object.assign({}, item, {
          statusText: helper.formatActivityStatus(item.status)
        }))
      });
    } catch (err) {
      console.error("load activities failed", err);
      this.setData({ loading: false });
      wx.showToast({ title: "加载活动失败", icon: "none" });
    }
  },

  goCreate(): void {
    wx.navigateTo({ url: "/pages/activity/create/create" });
  },

  goDetail(e: WechatMiniprogram.BaseEvent): void {
    const { id } = e.currentTarget.dataset as { id?: string };
    if (!id) return;
    wx.navigateTo({ url: `/pages/activity/detail/detail?id=${id}` });
  }
});

export {};
