// pages/team-detail/team-detail.js
const db = wx.cloud.database()

Page({
  data: {
    teamId: '',
    teamInfo: null,
    members: [],
    loading: true,
    isCaptain: false
  },

  onLoad: function(options) {
    if (!options.id) {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }

    this.setData({ teamId: options.id })
    this.loadTeamDetail()
  },

  onShow: function() {
    if (this.data.teamId) {
      this.loadTeamDetail()
    }
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.loadTeamDetail().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 加载球队详情
  loadTeamDetail: function() {
    this.setData({ loading: true })

    const teamId = this.data.teamId
    const _ = db.command

    // 获取用户 openid
    return wx.cloud.callFunction({
      name: 'getOpenId'
    }).then(res => {
      const openid = res.result.openid

      // 查询球队信息
      return db.collection('teams').doc(teamId).get()
    }).then(teamRes => {
      const teamInfo = teamRes.data

      // 查询成员列表
      return db.collection('team_members')
        .where({ team_id: teamId })
        .orderBy('join_time', 'asc')
        .get()
        .then(membersRes => {
          const memberOpenids = membersRes.data.map(m => m.openid)

          // 查询成员的微信信息
          if (memberOpenids.length > 0) {
            return db.collection('users')
              .where({ openid: _.in(memberOpenids) })
              .get()
              .then(usersRes => {
                const usersMap = {}
                usersRes.data.forEach(user => {
                  usersMap[user.openid] = user
                })

                const members = membersRes.data.map(member => ({
                  ...member,
                  userInfo: usersMap[member.openid] || {}
                }))

                return members
              })
          } else {
            return []
          }
        }).then(members => {
          // 判断当前用户是否是队长
          const captain = members.find(m => m.role === 'captain')
          const isCaptain = captain && captain.openid === openid

          this.setData({
            teamInfo,
            members,
            loading: false,
            isCaptain
          })
        })
    }).catch(err => {
      console.error('加载球队详情失败', err)
      this.setData({ loading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    })
  },

  // 跳转到成员管理
  goToMemberManage: function() {
    wx.navigateTo({
      url: `/pages/member-manage/member-manage?id=${this.data.teamId}`
    })
  }
})
