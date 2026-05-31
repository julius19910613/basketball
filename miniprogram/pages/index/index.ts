/// <reference path="../../../typings/index.d.ts" />
import env from "../../config/env";

const app = getApp();
const { getCollection } = env;

interface IndexData {
  playerCount: number;
  matchCount: number;
  userInfo: any;
}

Page({
  data: {
    playerCount: 0,
    matchCount: 0,
    userInfo: null
  } as IndexData,

  onLoad: function () {
    this.checkLogin();
  },

  onShow: function () {
    if (app.globalData.isLoggedIn) {
      this.fetchSummary();
    }
  },

  checkLogin: async function () {
    const loginRes = await app.checkLogin();
    if (loginRes) {
      this.setData({ userInfo: loginRes.userInfo });
      this.fetchSummary();
    }
  },

  fetchSummary: async function () {
    const db = wx.cloud.database();
    try {
      const playerRes = await db.collection(getCollection('players')).count();

      const matchRes = await db.collection(getCollection('matches')).count();

      this.setData({
        playerCount: playerRes.total,
        matchCount: matchRes.total
      });
    } catch (err) {
      console.error('获取概览数据失败:', err);
    }
  },

  navToPlayers: function () {
    wx.switchTab({ url: '/pages/players/list/list' });
  },

  navToMatches: function () {
    wx.switchTab({ url: '/pages/match/list/list' });
  },

  navToActivities: function () {
    wx.navigateTo({ url: '/pages/activity/list/list' });
  },

  navToProfile: function () {
    wx.switchTab({ url: '/pages/profile/profile' });
  },

  navToCreateMatch: function () {
    wx.navigateTo({ url: '/pages/match/create/create' });
  }
});

export {};
