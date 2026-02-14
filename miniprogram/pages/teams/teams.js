// pages/teams/teams.js
const db = wx.cloud.database()

Page({
  data: {
    teamList: [],
    loading: false,
    openid: ''
  },

  onLoad: function (options) {
    this.getOpenId()
  },

  onShow: function () {
    // 页面显示时刷新列表
    if (this.data.openid) {
      this.loadTeams()
    }
  },

  onPullDownRefresh: function () {
    this.loadTeams().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 获取用户 openid
  getOpenId: async function () {
    try {
      const app = getApp()
      if (app.globalData.openid) {
        this.setData({ openid: app.globalData.openid })
        this.loadTeams()
        return
      }

      const res = await wx.cloud.callFunction({ name: 'getOpenId' })
      this.setData({ openid: res.result.openid })
      this.loadTeams()
    } catch (err) {
      console.error('获取 openid 失败', err)
      wx.showToast({ title: '获取用户信息失败', icon: 'none' })
    }
  },

  // 加载球队列表 - 使用新的 schema (members 数组嵌入 teams 集合)
  loadTeams: async function () {
    this.setData({ loading: true })

    try {
      const _ = db.command
      // 查询用户所在的球队 (作为队长或成员)
      const res = await db.collection('teams').where(
        _.or([
          { captainId: this.data.openid },
          { 'members.userId': this.data.openid }
        ])
      ).orderBy('createdAt', 'desc').get()

      const teamList = res.data.map(team => {
        // 确定用户在该球队的角色
        let myRole = 'member'
        if (team.captainId === this.data.openid) {
          myRole = 'captain'
        } else {
          const member = team.members?.find(m => m.userId === this.data.openid)
          if (member) myRole = member.role || 'member'
        }
        return { ...team, myRole }
      })

      this.setData({ teamList, loading: false })
    } catch (err) {
      console.error('获取球队列表失败', err)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  // 跳转到创建球队页面
  createTeam: function () {
    wx.navigateTo({ url: '/pages/create-team/create-team' })
  },

  // 跳转到球队详情
  goToTeamDetail: function (e) {
    const teamId = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/team-detail/team-detail?id=${teamId}` })
  }
})

