// pages/index/index.js
const db = wx.cloud.database()

Page({
  data: {
    openid: '',
    userInfo: null,
    myTeams: [],
    teamCount: 0
  },

  onLoad() {
    this.getOpenId()
  },

  onShow() {
    if (this.data.openid) {
      this.loadMyTeams()
    }
  },

  // 获取用户 openid
  getOpenId() {
    wx.cloud.callFunction({
      name: 'getOpenId'
    }).then(res => {
      this.setData({
        openid: res.result.openid
      })
      this.loadMyTeams()
    }).catch(err => {
      console.error('获取 openid 失败', err)
    })
  },

  // 加载我的球队
  loadMyTeams() {
    db.collection('team_members').where({
      openid: this.data.openid
    }).get().then(res => {
      this.setData({
        teamCount: res.data.length
      })
    }).catch(err => {
      console.error('获取球队列表失败', err)
    })
  },

  // 获取用户信息
  getUserInfo() {
    wx.getUserProfile({
      desc: '用于完善用户资料'
    }).then(res => {
      this.setData({
        userInfo: res.userInfo
      })
      // 保存用户信息到数据库
      this.saveUserInfo(res.userInfo)
    }).catch(err => {
      console.log('用户取消授权')
    })
  },

  // 保存用户信息
  saveUserInfo(userInfo) {
    db.collection('users').where({
      openid: this.data.openid
    }).get().then(res => {
      if (res.data.length === 0) {
        // 新用户，创建记录
        return db.collection('users').add({
          data: {
            openid: this.data.openid,
            nickName: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl,
            create_time: db.serverDate()
          }
        })
      }
    }).catch(err => {
      console.error('保存用户信息失败', err)
    })
  },

  // 创建球队
  createTeam() {
    wx.switchTab({
      url: '/pages/teams/teams'
    })
    setTimeout(() => {
      wx.navigateTo({
        url: '/pages/create-team/create-team'
      })
    }, 300)
  },

  // 发现球队
  joinTeam() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 查看数据统计
  viewStats() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  }
})