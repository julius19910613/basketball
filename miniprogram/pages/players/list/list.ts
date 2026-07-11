/// <reference path="../../../../typings/index.d.ts" />

const db = wx.cloud.database();
import env from "../../../config/env";
import { previewAvatar } from "../../../utils/avatar-preview";
import { fetchAllRecords } from "../../../utils/cloud-pagination";
const { getCollection } = env;

const COLLECTION_MISSING_CODE = -502005;

function isCollectionMissing(error: any): boolean {
  if (!error) return false;
  const message = String(error.message || error.errMsg || "");
  return Number(error.errCode) === COLLECTION_MISSING_CODE || message.includes("DATABASE_COLLECTION_NOT_EXIST");
}

interface ListData {
  loading: boolean;
  players: any[];
  collectionMissingNotified: boolean;
  userAvatar: string;
}

Page({
  data: {
    loading: true,
    players: [],
    collectionMissingNotified: false,
    userAvatar: ""
  } as ListData,

  onShow() {
    this.loadPlayers();
    this.loadUserAvatar();
  },

  onPullDownRefresh() {
    this.loadPlayers(true);
  },

  async loadPlayers(fromPullDown = false) {
    this.setData({ loading: true });
    try {
      const records = await fetchAllRecords<any>(() => db.collection(getCollection("players")).orderBy("createdAt", "desc"));
      const players = records.map((item: any) => ({
        ...item,
        displayNickname: item.nickname || item.name || "未命名球员",
        displayRealName: item.realName || "-",
        displayPosition: item.position || "-",
        avatar: item.avatar || "",
        isMvp: item.isMvp || false
      }));
      this.setData({ players, loading: false });
    } catch (error) {
      this.setData({ loading: false });
      if (isCollectionMissing(error)) {
        if (!this.data.collectionMissingNotified) {
          this.setData({ collectionMissingNotified: true });
          wx.showModal({
            title: "请先初始化数据库",
            content: "当前环境缺少 players 集合。请到 CloudBase 控制台创建 players 集合后重试。",
            showCancel: false
          });
        }
      } else {
        wx.showToast({ title: "加载球员失败", icon: "none" });
      }
      console.error("load players failed:", error);
    } finally {
      if (fromPullDown) {
        wx.stopPullDownRefresh();
      }
    }
  },

  goToCreate() {
    wx.navigateTo({
      url: "/pages/players/create/create"
    });
  },

  goToDetail(e: WechatMiniprogram.BaseEvent) {
    const { id } = e.currentTarget.dataset;
    if (!id) return;
    wx.navigateTo({
      url: `/pages/players/detail/detail?id=${id}`
    });
  },

  async onPreviewAvatar(e: WechatMiniprogram.BaseEvent) {
    const avatar = String(e.currentTarget.dataset.avatar || "");
    if (!avatar) {
      wx.showToast({ title: "该球员暂无头像", icon: "none" });
      return;
    }
    try {
      await previewAvatar(avatar);
    } catch (error) {
      console.error("preview player avatar failed:", error);
      wx.showToast({ title: "头像预览失败", icon: "none" });
    }
  },

  loadUserAvatar() {
    const app = getApp();
    if (app.globalData.userInfo && app.globalData.userInfo.avatarUrl) {
      this.setData({ userAvatar: app.globalData.userInfo.avatarUrl });
    }
  },

  goToProfile() {
    wx.navigateTo({
      url: "/pages/profile/profile"
    });
  }
});

export {};
