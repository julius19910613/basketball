// ~/projects/basketball/miniprogram/pages/profile/profile.js
const app = getApp();
const db = wx.cloud.database();

// 超时工具函数
function timeoutPromise(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('请求超时，请检查网络')), ms)
    )
  ]);
}

Page({
  data: {
    userProfile: {
      openid: '',
      nickName: '未登录',
      avatarUrl: '/images/default_avatar.svg',
      height: null,
      weight: null,
      position: '',
      skills: [], // 存储为数组
    },
    positions: ['PG (控球后卫)', 'SG (得分后卫)', 'SF (小前锋)', 'PF (大前锋)', 'C (中锋)', '其他'],
    positionIndex: -1, // 用于picker的选中索引
    _openid: '', // 存储用户openid
    loading: false,
    retryCount: 0,
  },

  onLoad: function () {
    this.getOpenIdAndLoadProfile();
  },

  // 获取openid并加载用户资料（添加超时和重试）
  getOpenIdAndLoadProfile: async function () {
    // 防止重复加载
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    wx.showLoading({ title: '加载中...', mask: true });

    try {
      // 获取 openid（带超时，10秒）
      const openid = await this.getOpenIdWithTimeout(10000);
      
      this.setData({ _openid: openid });
      
      // 加载用户资料（带超时，10秒）
      await this.loadUserProfile(openid);
      
    } catch (err) {
      console.error('获取openid或加载用户资料失败', err);
      
      // 显示错误提示
      wx.showModal({
        title: '加载失败',
        content: err.message || '网络请求超时，是否重试？',
        confirmText: '重试',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            // 用户点击重试
            const retryCount = this.data.retryCount + 1;
            this.setData({ retryCount });
            if (retryCount < 3) {
              this.getOpenIdAndLoadProfile();
            } else {
              wx.showToast({ title: '请检查网络后重试', icon: 'none', duration: 2000 });
            }
          }
        }
      });
    } finally {
      this.setData({ loading: false });
      wx.hideLoading();
    }
  },

  // 获取 openid（带超时和降级方案）
  getOpenIdWithTimeout: async function (timeout) {
    try {
      // 尝试从云函数获取 openid
      const { result } = await timeoutPromise(
        wx.cloud.callFunction({ name: 'getOpenId' }),
        timeout
      );
      return result.openid;
    } catch (err) {
      console.error('云函数获取 openid 失败', err);
      
      // 降级方案：尝试从本地存储获取
      let openid = wx.getStorageSync('_openid');
      
      if (!openid) {
        // 如果本地也没有，生成临时 openid
        openid = 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        wx.setStorageSync('_openid', openid);
        console.warn('使用临时 openid:', openid);
      }
      
      return openid;
    }
  },

  // 加载用户资料（添加超时）
  loadUserProfile: async function (openid) {
    try {
      const res = await timeoutPromise(
        db.collection('users').where({
          _openid: openid // 使用_openid查询，匹配数据库中的openid字段
        }).get(),
        10000 // 10秒超时
      );

      if (res.data && res.data.length > 0) {
        const profile = res.data[0];
        // 确保skills是数组
        profile.skills = profile.skills || [];
        const positionIndex = this.data.positions.indexOf(profile.position);
        this.setData({
          userProfile: profile,
          positionIndex: positionIndex !== -1 ? positionIndex : this.data.positions.length - 1, // 默认'其他'
        });
      } else {
        // 用户第一次访问，数据库中没有记录
        this.setData({
          userProfile: {
            ...this.data.userProfile,
            _openid: openid, // 确保新用户也有openid
          }
        });
      }
    } catch (err) {
      console.error('加载用户资料失败', err);
      throw new Error('加载用户资料失败，请检查网络连接');
    }
  },

  // Picker选择器改变事件
  bindPositionChange: function (e) {
    const positionIndex = e.detail.value;
    this.setData({
      positionIndex: positionIndex,
      ['userProfile.position']: this.data.positions[positionIndex],
    });
  },

  // 表单提交事件（添加超时）
  formSubmit: async function (e) {
    if (this.data.loading) {
      wx.showToast({ title: '正在处理，请稍候', icon: 'none' });
      return;
    }
    
    wx.showLoading({ title: '保存中...', mask: true });
    this.setData({ loading: true });
    
    const formData = e.detail.value;
    const { _openid, userProfile } = this.data;

    // 处理技能字符串为数组
    let skillsArray = [];
    if (formData.skills) {
      skillsArray = formData.skills.split(/[,，\s]+/).filter(s => s.trim() !== '');
    }

    const dataToSave = {
      nickName: userProfile.nickName, // 昵称和头像从userProfile中获取
      avatarUrl: userProfile.avatarUrl,
      height: parseInt(formData.height) || null,
      weight: parseInt(formData.weight) || null,
      position: userProfile.position || '', // 从data中获取picker选择后的值
      skills: skillsArray,
      create_time: userProfile.create_time || new Date(), // 如果是新用户，设置创建时间
      _openid: _openid,
    };

    try {
      if (userProfile._id) {
        // 更新现有资料（带超时）
        await timeoutPromise(
          db.collection('users').doc(userProfile._id).update({ data: dataToSave }),
          10000
        );
        wx.showToast({ title: '更新成功', icon: 'success' });
      } else {
        // 添加新资料（带超时）
        await timeoutPromise(
          db.collection('users').add({ data: dataToSave }),
          10000
        );
        wx.showToast({ title: '保存成功', icon: 'success' });
        // 重新加载一次，确保_id被更新到data中
        await this.loadUserProfile(_openid);
      }
    } catch (err) {
      console.error('保存用户资料失败', err);
      wx.showModal({
        title: '保存失败',
        content: '网络请求超时，请检查网络连接后重试',
        showCancel: false
      });
    } finally {
      this.setData({ loading: false });
      wx.hideLoading();
    }
  },

  // 跳转到球员卡页面
  goToPlayerCard: function () {
    // TODO: 实现跳转逻辑
    wx.showToast({
      title: '球员卡功能待开发',
      icon: 'none',
    });
    console.log('跳转到球员卡页面');
  },

  // 选择头像（添加超时）
  onChooseAvatar: function (e) {
    const { avatarUrl } = e.detail;
    
    if (this.data.loading) {
      wx.showToast({ title: '正在处理，请稍候', icon: 'none' });
      return;
    }
    
    // 上传头像到云存储
    wx.showLoading({ title: '上传中...', mask: true });
    this.setData({ loading: true });

    const cloudPath = `avatars/${this.data._openid}_${Date.now()}.png`;
    
    timeoutPromise(
      wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: avatarUrl,
      }),
      20000 // 上传文件超时时间设置为 20 秒
    ).then(res => {
      // 获取云存储文件ID
      const fileID = res.fileID;
      this.setData({
        'userProfile.avatarUrl': fileID
      });
      wx.showToast({ title: '头像已更新', icon: 'success' });
    }).catch(err => {
      console.error('上传头像失败:', err);
      wx.showModal({
        title: '上传失败',
        content: '网络请求超时，请检查网络连接',
        showCancel: false
      });
    }).finally(() => {
      this.setData({ loading: false });
      wx.hideLoading();
    });
  },

  // 昵称修改
  onNicknameChange: function (e) {
    const nickName = e.detail.value;
    if (nickName && nickName.trim()) {
      this.setData({
        'userProfile.nickName': nickName.trim()
      });
    }
  }
});
