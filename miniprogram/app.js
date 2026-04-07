// app.js
App({
  globalData: {
    userInfo: null,
    openid: null,
    unionid: null,
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

    // 异步执行静默登录
    this.checkLogin();
  },

  // 统一登录检查入口
  checkLogin: async function () {
    // 1. 尝试从内存获取
    if (this.globalData.isLoggedIn && this.globalData.openid) {
      return this.globalData;
    }

    // 2. 尝试从本地缓存获取
    const cachedOpenid = wx.getStorageSync('openid');
    const cachedUserInfo = wx.getStorageSync('userInfo');
    if (cachedOpenid && cachedUserInfo) {
      this.globalData.openid = cachedOpenid;
      this.globalData.userInfo = cachedUserInfo;
      this.globalData.isLoggedIn = true;
      return this.globalData;
    }

    // 3. 执行云函数登录
    try {
      const res = await this.getOpenIdWithRetry();
      const openid = res.result.openid;
      const unionid = res.result.unionid;

      this.globalData.openid = openid;
      this.globalData.unionid = unionid;
      wx.setStorageSync('openid', openid);

      // 加载用户资料
      await this.loadUserProfile(openid);

      return this.globalData;
    } catch (err) {
      console.error('登录失败:', err);
      return null;
    }
  },

  // 获取用户 OpenID（带重试）
  getOpenIdWithRetry: function (retries = 3) {
    return new Promise((resolve, reject) => {
      const attempt = (n) => {
        wx.cloud.callFunction({
          name: 'getOpenId', // 统一使用 getOpenId
          success: resolve,
          fail: (err) => {
            if (n > 1) {
              console.warn(`登录重试中... 剩余次数: ${n - 1}`);
              attempt(n - 1);
            } else {
              reject(err);
            }
          }
        });
      };
      attempt(retries);
    });
  },

  // 加载用户资料
  loadUserProfile: async function (openid) {
    if (!openid) return;

    try {
      const db = wx.cloud.database();
      const res = await db.collection('users').where({
        _openid: openid
      }).get();

      if (res.data && res.data.length > 0) {
        const userInfo = res.data[0];
        this.globalData.userInfo = userInfo;
        this.globalData.isLoggedIn = true;
        wx.setStorageSync('userInfo', userInfo);

        // 触发回调，通知页面用户信息已加载
        if (this.userInfoReadyCallback) {
          this.userInfoReadyCallback(userInfo);
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
    wx.setStorageSync('userInfo', userInfo);
  },

  // 兼容旧版本的 getOpenId 方法
  getOpenId: function () {
    return new Promise((resolve, reject) => {
      this.checkLogin()
        .then(data => {
          if (data && data.openid) {
            resolve(data.openid);
          } else {
            reject(new Error('登录失败'));
          }
        })
        .catch(reject);
    });
  }
});
