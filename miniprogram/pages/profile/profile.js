var app = getApp();
var db = wx.cloud.database();

function formatDate(value) {
  if (!value) return "-";
  var date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.getFullYear() + "-" +
    String(date.getMonth() + 1).padStart(2, "0") + "-" +
    String(date.getDate()).padStart(2, "0");
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
  },

  onLoad: function () {
    var that = this;
    app.checkLogin().then(function (data) {
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

  // 加载已关联的球员信息
  loadLinkedPlayer: function (openid) {
    var that = this;
    db.collection("users").where({ _openid: openid }).get().then(function (res) {
      if (res.data && res.data.length > 0) {
        var userRecord = res.data[0];
        var userInfo = {
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
          // 加载关联的球员
          db.collection("players").doc(userRecord.linkedPlayerId).get().then(function (pRes) {
            that.setData({
              linkedPlayer: pRes.data,
              linkedAtText: formatDate(userRecord.linkedAt)
            });
          }).catch(function () {
            // 球员可能已删除，清除关联
            that.clearLink(userRecord._id);
          });
        } else {
          // 未关联，加载可关联的球员列表
          that.setData({ linkedPlayer: null });
          that.loadUnlinkedPlayers();
        }
      }
    });
  },

  // 加载未绑定 openid 的球员
  loadUnlinkedPlayers: function () {
    var that = this;
    db.collection("players").orderBy("createdAt", "desc").get().then(function (res) {
      // 过滤：只显示没有 linkedOpenid 的球员
      var unlinked = (res.data || []).filter(function (p) {
        return !p.linkedOpenid;
      });
      that.setData({ unlinkedPlayers: unlinked });
    });
  },

  // 选择球员
  onSelectPlayer: function (e) {
    var id = e.currentTarget.dataset.id;
    this.setData({
      selectedPlayerId: this.data.selectedPlayerId === id ? "" : id
    });
  },

  // 关联球员
  onLinkPlayer: function () {
    var that = this;
    var playerId = that.data.selectedPlayerId;
    var openid = that.data.openid;

    if (!playerId) {
      wx.showToast({ title: "请先选择球员", icon: "none" });
      return;
    }

    wx.showLoading({ title: "关联中...", mask: true });

    // 1. 先检查该球员是否已被其他人绑定
    db.collection("players").doc(playerId).get().then(function (pRes) {
      var player = pRes.data;

      // 2. 如果球员已绑定了其他 openid，先解绑
      var unlinkPromise;
      if (player.linkedOpenid && player.linkedOpenid !== openid) {
        // 解绑旧用户：清除旧用户的 linkedPlayerId
        unlinkPromise = db.collection("users").where({
          _openid: player.linkedOpenid
        }).get().then(function (uRes) {
          if (uRes.data && uRes.data.length > 0) {
            return db.collection("users").doc(uRes.data[0]._id).update({
              data: { linkedPlayerId: null, linkedAt: null, updatedAt: db.serverDate() }
            });
          }
        });
      } else {
        unlinkPromise = Promise.resolve();
      }

      // 3. 绑定新用户
      unlinkPromise.then(function () {
        // 更新 players 表：设置 linkedOpenid
        var updatePlayer = db.collection("players").doc(playerId).update({
          data: { linkedOpenid: openid, updatedAt: db.serverDate() }
        });

        // 更新 users 表：设置 linkedPlayerId
        var updateUser = db.collection("users").where({ _openid: openid }).get().then(function (uRes) {
          if (uRes.data && uRes.data.length > 0) {
            return db.collection("users").doc(uRes.data[0]._id).update({
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
        // 刷新页面
        that.setData({ selectedPlayerId: "" });
        that.loadLinkedPlayer(openid);
      }).catch(function (err) {
        wx.hideLoading();
        wx.showToast({ title: "关联失败", icon: "none" });
        console.error("关联失败:", err);
      });
    });
  },

  // 解绑
  onUnlink: function () {
    var that = this;
    wx.showModal({
      title: "确认解绑",
      content: "解绑后你的微信将不再关联此球员，确定吗？",
      confirmColor: "#dc2626",
      success: function (res) {
        if (!res.confirm) return;
        that.doUnlink();
      }
    });
  },

  doUnlink: function () {
    var that = this;
    var openid = that.data.openid;
    var player = that.data.linkedPlayer;

    wx.showLoading({ title: "解绑中...", mask: true });

    // 清除 players 表的 linkedOpenid
    var clearPlayer = db.collection("players").doc(player._id).update({
      data: { linkedOpenid: null, updatedAt: db.serverDate() }
    });

    // 清除 users 表的 linkedPlayerId
    var clearUser = db.collection("users").where({ _openid: openid }).get().then(function (uRes) {
      if (uRes.data && uRes.data.length > 0) {
        return db.collection("users").doc(uRes.data[0]._id).update({
          data: { linkedPlayerId: null, linkedAt: null, updatedAt: db.serverDate() }
        });
      }
    });

    Promise.all([clearPlayer, clearUser]).then(function () {
      wx.hideLoading();
      wx.showToast({ title: "已解绑", icon: "success" });
      that.setData({ linkedPlayer: null, linkedAtText: "-" });
      that.loadUnlinkedPlayers();
    }).catch(function (err) {
      wx.hideLoading();
      wx.showToast({ title: "解绑失败", icon: "none" });
      console.error("解绑失败:", err);
    });
  },

  // 创建新球员（跳转创建页，带上 fromProfile 参数）
  goCreatePlayer: function () {
    wx.navigateTo({
      url: "/pages/players/create/create?fromProfile=1&openid=" + this.data.openid
    });
  },

  // 选择头像
  onChooseAvatar: function (e) {
    var tempUrl = e.detail.avatarUrl;
    this.setData({ editAvatarUrl: tempUrl });
  },

  // 输入昵称
  onNickNameInput: function (e) {
    this.setData({ editNickName: e.detail.value });
  },

  // 保存个人资料（头像+昵称）
  saveProfile: function () {
    var that = this;
    var openid = that.data.openid;
    var nickName = that.data.editNickName.trim();
    var avatarUrl = that.data.editAvatarUrl;

    if (!nickName) {
      wx.showToast({ title: "请输入昵称", icon: "none" });
      return;
    }

    wx.showLoading({ title: "保存中...", mask: true });

    var saveOps = [];

    // 如果头像是临时文件，先上传到云存储
    if (avatarUrl && avatarUrl.indexOf("cloud://") !== 0 && avatarUrl.indexOf("http") !== 0) {
      var uploadPromise = new Promise(function (resolve, reject) {
        var timestamp = Date.now();
        var cloudPath = "users/avatars/" + openid + "_" + timestamp + ".jpg";
        wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: avatarUrl,
          success: function (uploadRes) {
            avatarUrl = uploadRes.fileID;
            resolve();
          },
          fail: reject
        });
      });
      saveOps.push(uploadPromise);
    }

    Promise.all(saveOps).then(function () {
      return db.collection("users").where({ _openid: openid }).get();
    }).then(function (uRes) {
      if (uRes.data && uRes.data.length > 0) {
        return db.collection("users").doc(uRes.data[0]._id).update({
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
    }).catch(function (err) {
      wx.hideLoading();
      wx.showToast({ title: "保存失败", icon: "none" });
      console.error("保存资料失败:", err);
    });
  },

  clearLink: function (userId) {
    db.collection("users").doc(userId).update({
      data: { linkedPlayerId: null, linkedAt: null, updatedAt: db.serverDate() }
    });
    this.setData({ linkedPlayer: null });
    this.loadUnlinkedPlayers();
  }
});
