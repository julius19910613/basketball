/// <reference path="../../../typings/index.d.ts" />

const app = getApp();
const db = wx.cloud.database();
const env = require("../../config/env");
const { getCollection } = env;

function formatDate(value: any): string {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.getFullYear() + "-" +
    String(date.getMonth() + 1).padStart(2, "0") + "-" +
    String(date.getDate()).padStart(2, "0");
}

interface ProfileData {
  userInfo: any;
  openid: string;
  linkedPlayer: any;
  linkedAtText: string;
  unlinkedPlayers: any[];
  selectedPlayerId: string;
  editNickName: string;
  editAvatarUrl: string;
}

Page({
  data: {
    userInfo: null,
    openid: "",
    linkedPlayer: null,
    linkedAtText: "-",
    unlinkedPlayers: [],
    selectedPlayerId: "",
    editNickName: "",
    editAvatarUrl: ""
  } as ProfileData,

  onLoad: function () {
    const that = this;
    app.checkLogin().then(function (data: any) {
      if (!data || !data.openid) {
        wx.showToast({ title: "登录失败", icon: "none" });
        return;
      }
      that.setData({ openid: data.openid, userInfo: data.userInfo || {} });
      that.loadLinkedPlayer(data.openid);
    });
  },

  onShow: function () {
    if (this.data.openid) {
      this.loadLinkedPlayer(this.data.openid);
    }
  },

  loadLinkedPlayer: function (openid: string) {
    const that = this;
    db.collection(getCollection("users")).where({ _openid: openid }).get().then(function (res: any) {
      if (res.data && res.data.length > 0) {
        const userRecord = res.data[0];
        const userInfo = {
          _id: userRecord._id,
          nickName: userRecord.nickName || "",
          avatarUrl: userRecord.avatarUrl || ""
        };
        that.setData({
          userInfo: userInfo,
          editNickName: userInfo.nickName,
          editAvatarUrl: userInfo.avatarUrl
        });
        app.updateUserInfo(userInfo);

        if (userRecord.linkedPlayerId) {
          db.collection(getCollection("players")).doc(userRecord.linkedPlayerId).get().then(function (pRes: any) {
            that.setData({
              linkedPlayer: pRes.data,
              linkedAtText: formatDate(userRecord.linkedAt)
            });
          }).catch(function () {
            that.clearLink(userRecord._id);
          });
        } else {
          that.setData({ linkedPlayer: null });
          that.loadUnlinkedPlayers();
        }
      }
    });
  },

  loadUnlinkedPlayers: function () {
    const that = this;
    db.collection(getCollection("players")).orderBy("createdAt", "desc").get().then(function (res: any) {
      const unlinked = (res.data || []).filter(function (p: any) {
        return !p.linkedOpenid;
      });
      that.setData({ unlinkedPlayers: unlinked });
    });
  },

  onSelectPlayer: function (e: WechatMiniprogram.BaseEvent) {
    const id = e.currentTarget.dataset.id;
    this.setData({
      selectedPlayerId: this.data.selectedPlayerId === id ? "" : id
    });
  },

  onLinkPlayer: function () {
    const that = this;
    const playerId = that.data.selectedPlayerId;
    const openid = that.data.openid;

    if (!playerId) {
      wx.showToast({ title: "请先选择球员", icon: "none" });
      return;
    }

    wx.showLoading({ title: "关联中...", mask: true });

    db.collection(getCollection("players")).doc(playerId).get().then(function (pRes: any) {
      const player = pRes.data;

      let unlinkPromise: Promise<any>;
      if (player.linkedOpenid && player.linkedOpenid !== openid) {
        unlinkPromise = db.collection(getCollection("users")).where({
          _openid: player.linkedOpenid
        }).get().then(function (uRes: any) {
          if (uRes.data && uRes.data.length > 0) {
            return db.collection(getCollection("users")).doc(uRes.data[0]._id).update({
              data: { linkedPlayerId: null, linkedAt: null, updatedAt: db.serverDate() }
            });
          }
        });
      } else {
        unlinkPromise = Promise.resolve();
      }

      unlinkPromise.then(function () {
        const updatePlayer = db.collection(getCollection("players")).doc(playerId).update({
          data: { linkedOpenid: openid, updatedAt: db.serverDate() }
        });

        const updateUser = db.collection(getCollection("users")).where({ _openid: openid }).get().then(function (uRes: any) {
          if (uRes.data && uRes.data.length > 0) {
            return db.collection(getCollection("users")).doc(uRes.data[0]._id).update({
              data: {
                linkedPlayerId: playerId,
                linkedAt: db.serverDate(),
                updatedAt: db.serverDate()
              }
            });
          }
        });

        return Promise.all([updatePlayer, updateUser]);
      }).then(function () {
        wx.hideLoading();
        wx.showToast({ title: "关联成功", icon: "success" });
        that.setData({ selectedPlayerId: "" });
        that.loadLinkedPlayer(openid);
      }).catch(function (err: any) {
        wx.hideLoading();
        wx.showToast({ title: "关联失败", icon: "none" });
        console.error("关联失败:", err);
      });
    });
  },

  onUnlink: function () {
    const that = this;
    wx.showModal({
      title: "确认解绑",
      content: "解绑后你的微信将不再关联此球员，确定吗？",
      confirmColor: "#dc2626",
      success: function (res: WechatMiniprogram.ShowModalSuccessCallbackResult) {
        if (!res.confirm) return;
        that.doUnlink();
      }
    });
  },

  doUnlink: function () {
    const that = this;
    const openid = that.data.openid;
    const player = that.data.linkedPlayer;

    wx.showLoading({ title: "解绑中...", mask: true });

    const clearPlayer = db.collection(getCollection("players")).doc(player._id).update({
      data: { linkedOpenid: null, updatedAt: db.serverDate() }
    });

    const clearUser = db.collection(getCollection("users")).where({ _openid: openid }).get().then(function (uRes: any) {
      if (uRes.data && uRes.data.length > 0) {
        return db.collection(getCollection("users")).doc(uRes.data[0]._id).update({
          data: { linkedPlayerId: null, linkedAt: null, updatedAt: db.serverDate() }
        });
      }
    });

    Promise.all([clearPlayer, clearUser]).then(function () {
      wx.hideLoading();
      wx.showToast({ title: "已解绑", icon: "success" });
      that.setData({ linkedPlayer: null, linkedAtText: "-" });
      that.loadUnlinkedPlayers();
    }).catch(function (err: any) {
      wx.hideLoading();
      wx.showToast({ title: "解绑失败", icon: "none" });
      console.error("解绑失败:", err);
    });
  },

  goCreatePlayer: function () {
    wx.navigateTo({
      url: "/pages/players/create/create?fromProfile=1&openid=" + this.data.openid
    });
  },

  onChooseAvatar: function (e: WechatMiniprogram.CustomEvent) {
    const tempUrl = e.detail.avatarUrl;
    this.setData({ editAvatarUrl: tempUrl });
  },

  onNickNameInput: function (e: WechatMiniprogram.CustomEvent) {
    this.setData({ editNickName: e.detail.value });
  },

  saveProfile: function () {
    const that = this;
    const openid = that.data.openid;
    const nickName = that.data.editNickName.trim();
    let avatarUrl = that.data.editAvatarUrl;

    if (!nickName) {
      wx.showToast({ title: "请输入昵称", icon: "none" });
      return;
    }

    wx.showLoading({ title: "保存中...", mask: true });

    const saveOps: Promise<any>[] = [];

    if (avatarUrl && avatarUrl.indexOf("cloud://") !== 0 && avatarUrl.indexOf("http") !== 0) {
      const uploadPromise = new Promise(function (resolve: any, reject: any) {
        const timestamp = Date.now();
        const cloudPath = "users/avatars/" + openid + "_" + timestamp + ".jpg";
        wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: avatarUrl,
          success: function (uploadRes: any) {
            avatarUrl = uploadRes.fileID;
            resolve(undefined);
          },
          fail: reject
        });
      });
      saveOps.push(uploadPromise);
    }

    Promise.all(saveOps).then(function () {
      return db.collection(getCollection("users")).where({ _openid: openid }).get();
    }).then(function (uRes: any) {
      if (uRes.data && uRes.data.length > 0) {
        return db.collection(getCollection("users")).doc(uRes.data[0]._id).update({
          data: {
            nickName: nickName,
            avatarUrl: avatarUrl,
            updatedAt: db.serverDate()
          }
        });
      }
    }).then(function () {
      wx.hideLoading();
      wx.showToast({ title: "保存成功", icon: "success" });
      that.setData({
        "userInfo.nickName": nickName,
        "userInfo.avatarUrl": avatarUrl
      });
      app.updateUserInfo(that.data.userInfo);
    }).catch(function (err: any) {
      wx.hideLoading();
      wx.showToast({ title: "保存失败", icon: "none" });
      console.error("保存资料失败:", err);
    });
  },

  clearLink: function (userId: string) {
    db.collection(getCollection("users")).doc(userId).update({
      data: { linkedPlayerId: null, linkedAt: null, updatedAt: db.serverDate() }
    });
    this.setData({ linkedPlayer: null });
    this.loadUnlinkedPlayers();
  }
});

export {};
