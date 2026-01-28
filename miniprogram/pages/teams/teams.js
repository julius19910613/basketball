// pages/teams/teams.js
const db = wx.cloud.database()

Page({
  data: {
    teamList: [],
    loading: false,
    openid: ''
  },

  onLoad: function(options) {
    this.getOpenId()
  },

  onShow: function() {
    // 页面显示时刷新列表
    if (this.data.openid) {
      this.loadTeams()
    }
  },

  // 获取用户 openid
  getOpenId: function() {
    wx.cloud.callFunction({
      name: 'getOpenId'
    }).then(res => {
      this.setData({
        openid: res.result.openid
      })
      this.loadTeams()
    }).catch(err => {
      console.error('获取 openid 失败', err)
      wx.showToast({
        title: '获取用户信息失败',
        icon: 'none'
      })
    })
  },

  // 加载球队列表
  loadTeams: function() {
    this.setData({ loading: true })

    // 查询用户是队长的球队
    db.collection('team_members').where({
      openid: this.data.openid,
      role: db.command.in(['captain', 'vice-captain', 'member'])
    }).get().then(membersRes => {
      const teamIds = membersRes.data.map(item => item.team_id)
      
      if (teamIds.length === 0) {
        this.setData({ teamList: [], loading: false })
        return
      }

      // 查询球队详情
      db.collection('teams').where({
        _id: db.command.in(teamIds)
      }).get().then(teamsRes => {
        const teamList = teamsRes.data.map(team => {
          const member = membersRes.data.find(m => m.team_id === team._id)
          return {
            ...team,
            myRole: member ? member.role : 'member'
          }
        })
        this.setData({ teamList, loading: false })
      }).catch(err => {
        console.error('获取球队详情失败', err)
        this.setData({ loading: false })
      })
    }).catch(err => {
      console.error('获取球队列表失败', err)
      this.setData({ loading: false })
    })
  },

  // 跳转到创建球队页面
  createTeam: function() {
    wx.navigateTo({
      url: '/pages/create-team/create-team'
    })
  },

  // 跳转到球队详情
  goToTeamDetail: function(e) {
    const teamId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/team-detail/team-detail?id=${teamId}`
    })
  }
})
