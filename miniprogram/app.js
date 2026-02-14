// app.js
App({
  globalData: {
    userInfo: null,
    openid: null,
    isLoggedIn: false
  },

  onLaunch: function () {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'fanchen-2gkerrmcf3aee832',
        traceUser: true,
      });
    }

    // 获取用户 OpenID
    this.getOpenId();
  },

  // 获取用户 OpenID
  getOpenId: function () {
    return new Promise((resolve, reject) => {
      if (this.globalData.openid) {
        resolve(this.globalData.openid);
        return;
      }

      wx.cloud.callFunction({
        name: 'getOpenId',
        success: res => {
          this.globalData.openid = res.result.openid;
          resolve(res.result.openid);
          // 获取 openid 后加载用户信息
          this.loadUserProfile();
        },
        fail: err => {
          console.error('获取 OpenID 失败:', err);
          reject(err);
        }
      });
    });
  },

  // 加载用户资料
  loadUserProfile: async function () {
    if (!this.globalData.openid) return;

    try {
      const db = wx.cloud.database();
      const res = await db.collection('users').where({
        _openid: this.globalData.openid
      }).get();

      if (res.data && res.data.length > 0) {
        this.globalData.userInfo = res.data[0];
        this.globalData.isLoggedIn = true;
        // 触发回调，通知页面用户信息已加载
        if (this.userInfoReadyCallback) {
          this.userInfoReadyCallback(res.data[0]);
        }
      }
    } catch (err) {
      console.error('加载用户资料失败:', err);
    }
  },

  // 更新全局用户信息
  updateUserInfo: function (userInfo) {
    this.globalData.userInfo = userInfo;
    this.globalData.isLoggedIn = true;
  }
});
