// ~/projects/basketball/miniprogram/pages/profile/profile.js
const app = getApp();
const db = wx.cloud.database();

Page({
  data: {
    userProfile: {
      openid: '',
      nickName: '未登录',
      avatarUrl: '/images/default_avatar.png',
      height: null,
      weight: null,
      position: '',
      skills: [], // 存储为数组
    },
    positions: ['PG (控球后卫)', 'SG (得分后卫)', 'SF (小前锋)', 'PF (大前锋)', 'C (中锋)', '其他'],
    positionIndex: -1, // 用于picker的选中索引
    _openid: '', // 存储用户openid
  },

  onLoad: function () {
    this.getOpenIdAndLoadProfile();
  },

  // 获取openid并加载用户资料
  getOpenIdAndLoadProfile: async function () {
    wx.showLoading({
      title: '加载中...',
    });
    try {
      // 从云函数获取openid
      const { result } = await wx.cloud.callFunction({
        name: 'getOpenId',
      });
      const openid = result.openid;
      this.setData({
        _openid: openid,
      });

      // 根据openid加载用户资料
      await this.loadUserProfile(openid);

    } catch (err) {
      console.error('获取openid或加载用户资料失败', err);
      wx.showToast({
        title: '加载失败',
        icon: 'error',
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 加载用户资料
  loadUserProfile: async function (openid) {
    try {
      const res = await db.collection('users').where({
        _openid: openid // 使用_openid查询，匹配数据库中的openid字段
      }).get();

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
      wx.showToast({
        title: '加载失败',
        icon: 'error',
      });
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

  // 表单提交事件
  formSubmit: async function (e) {
    wx.showLoading({
      title: '保存中...',
    });
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
        // 更新现有资料
        await db.collection('users').doc(userProfile._id).update({
          data: dataToSave,
        });
        wx.showToast({
          title: '更新成功',
          icon: 'success',
        });
      } else {
        // 添加新资料
        await db.collection('users').add({
          data: dataToSave,
        });
        wx.showToast({
          title: '保存成功',
          icon: 'success',
        });
        // 重新加载一次，确保_id被更新到data中
        await this.loadUserProfile(_openid);
      }
    } catch (err) {
      console.error('保存用户资料失败', err);
      wx.showToast({
        title: '保存失败',
        icon: 'error',
      });
    } finally {
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

  // 选择头像
  onChooseAvatar: function (e) {
    const { avatarUrl } = e.detail;
    // 上传头像到云存储
    wx.showLoading({ title: '上传中...' });

    const cloudPath = `avatars/${this.data._openid}_${Date.now()}.png`;
    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: avatarUrl,
      success: res => {
        // 获取云存储文件ID
        const fileID = res.fileID;
        this.setData({
          'userProfile.avatarUrl': fileID
        });
        wx.hideLoading();
        wx.showToast({ title: '头像已更新', icon: 'success' });
      },
      fail: err => {
        console.error('上传头像失败:', err);
        wx.hideLoading();
        wx.showToast({ title: '上传失败', icon: 'error' });
      }
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