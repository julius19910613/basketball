// pages/index/index.js
const app = getApp();
const { getCollection } = require('../../config/env');

Page({
  data: {
    teamCount: 0,
    matchCount: 0,
    userInfo: null
  },

  onLoad: function() {
    this.checkLogin();
  },

  onShow: function() {
    if (app.globalData.isLoggedIn) {
      this.fetchSummary();
    }
  },

  checkLogin: async function() {
    const loginRes = await app.checkLogin();
    if (loginRes) {
      this.setData({ userInfo: loginRes.userInfo });
      this.fetchSummary();
    }
  },

  fetchSummary: async function() {
    const db = wx.cloud.database();
    try {
      // 获取球队数量
      const teamRes = await db.collection(getCollection('teams')).where({
        _openid: app.globalData.openid
      }).count();
      
      // 获取比赛数量
      const matchRes = await db.collection(getCollection('matches')).count();

      this.setData({
        teamCount: teamRes.total,
        matchCount: matchRes.total
      });
    } catch (err) {
      console.error('获取概览数据失败:', err);
    }
  },

  navToPlayers: function() {
    wx.switchTab({ url: '/pages/players/list/list' });
  },

  navToMatches: function() {
    wx.switchTab({ url: '/pages/match/list/list' });
  },

  navToProfile: function() {
    wx.switchTab({ url: '/pages/profile/profile' });
  },

  navToCreateMatch: function() {
    wx.navigateTo({ url: '/pages/match/create/create' });
  }
});
