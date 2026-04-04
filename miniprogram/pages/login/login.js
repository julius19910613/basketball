// pages/login/login.js
const app = getApp();
const db = wx.cloud.database();
const _ = db.command;

Page({
  data: {
    avatarUrl: '',
    nickName: '',
    canSubmit: false,
    isLoggingIn: false,
    redirectUrl: '' // 登录成功后跳转的页面
  },

  onLoad: function (options) {
    // 获取跳转前的页面路径
    if (options.redirect) {
      this.setData({
        redirectUrl: decodeURIComponent(options.redirect)
      });
    }
  },

  // 选择头像
  onChooseAvatar: function (e) {
    const { avatarUrl } = e.detail;
    this.setData({
      avatarUrl: avatarUrl
    });
    this.checkCanSubmit();
  },

  // 获取昵称（支持 bindinput 和 bindnickname）
  onNicknameInput: function (e) {
    // bindnickname 事件返回的是 e.detail.nickName
    // bindinput 事件返回的是 e.detail.value
    const nickName = e.detail.nickName || (e.detail.value && e.detail.value.trim()) || '';
    if (nickName) {
      this.setData({
        nickName: nickName
      });
      this.checkCanSubmit();
    }
  },

  // 检查是否可以提交
  checkCanSubmit: function () {
    const { avatarUrl, nickName } = this.data;
    this.setData({
      canSubmit: avatarUrl && nickName.length >= 2
    });
  },

  // 登录
  handleLogin: async function () {
    const { avatarUrl, nickName, canSubmit, isLoggingIn, redirectUrl } = this.data;

    if (!canSubmit || isLoggingIn) return;

    this.setData({ isLoggingIn: true });
    wx.showLoading({ title: '登录中...', mask: true });

    try {
      console.log('开始登录流程...');
      
      // 1. 获取 openid
      const openid = await app.getOpenId();
      console.log('获取 openid 成功:', openid);

      // 2. 上传头像到云存储
      let avatarFileId = avatarUrl;
      if (avatarUrl && !avatarUrl.startsWith('cloud://')) {
        console.log('上传头像...');
        const cloudPath = `avatars/${openid}_${Date.now()}.png`;
        const uploadRes = await wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: avatarUrl
        });
        avatarFileId = uploadRes.fileID;
        console.log('头像上传成功:', avatarFileId);
      }

      // 3. 检查用户是否已存在
      // 注意：使用 _.eq(openid) 来查询 _openid 字段
      console.log('查询用户...');
      const userRes = await db.collection('users').where({
        _openid: _.eq(openid)
      }).get();
      console.log('查询结果:', userRes);

      let userInfo;
      const now = new Date();

      if (userRes.data && userRes.data.length > 0) {
        // 更新现有用户
        console.log('用户已存在，更新信息...');
        userInfo = userRes.data[0];
        await db.collection('users').doc(userInfo._id).update({
          data: {
            nickName: nickName,
            avatarUrl: avatarFileId,
            update_time: now
          }
        });
        userInfo.nickName = nickName;
        userInfo.avatarUrl = avatarFileId;
      } else {
        // 创建新用户
        console.log('创建新用户...');
        const createRes = await db.collection('users').add({
          data: {
            nickName: nickName,
            avatarUrl: avatarFileId,
            height: null,
            weight: null,
            position: '',
            skills: [],
            create_time: now,
            update_time: now
            // 注意：不要手动设置 _openid，云开发会自动添加
          }
        });
        console.log('创建用户成功:', createRes);
        userInfo = {
          _id: createRes._id,
          nickName: nickName,
          avatarUrl: avatarFileId,
          _openid: openid
        };
      }

      // 4. 更新全局状态
      app.updateUserInfo(userInfo);
      console.log('登录成功，用户信息:', userInfo);

      wx.hideLoading();
      wx.showToast({ title: '登录成功', icon: 'success' });

      // 5. 跳转
      setTimeout(() => {
        if (redirectUrl) {
          // 如果是 tabbar 页面，使用 switchTab
          const tabbarPages = ['pages/index/index', 'pages/teams/teams', 'pages/match/match-list/match-list', 'pages/discovery/discovery', 'pages/profile/profile'];
          if (tabbarPages.some(p => redirectUrl.includes(p))) {
            const pagePath = redirectUrl.split('?')[0];
            wx.switchTab({ url: `/${pagePath}` });
          } else {
            wx.redirectTo({ url: redirectUrl });
          }
        } else {
          // 默认跳转到首页
          wx.switchTab({ url: '/pages/index/index' });
        }
      }, 1000);

    } catch (err) {
      console.error('登录失败:', err);
      console.error('错误详情:', JSON.stringify(err));
      wx.hideLoading();
      
      // 更详细的错误提示
      let errorMsg = '登录失败';
      if (err.errMsg) {
        if (err.errMsg.includes('getOpenId') || err.errMsg.includes('cloud.callFunction')) {
          errorMsg = '获取用户信息失败';
        } else if (err.errMsg.includes('uploadFile')) {
          errorMsg = '头像上传失败';
        } else if (err.errMsg.includes('database') || err.errMsg.includes('collection')) {
          errorMsg = '数据库操作失败';
        }
      }
      
      wx.showModal({
        title: '登录失败',
        content: `${errorMsg}\n${err.errMsg || err.message || JSON.stringify(err)}`,
        showCancel: false
      });
      this.setData({ isLoggingIn: false });
    }
  },

  // 跳过登录（可选功能）
  handleSkip: function () {
    wx.switchTab({ url: '/pages/index/index' });
  }
});
