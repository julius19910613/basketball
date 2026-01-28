// pages/member-manage/member-manage.js
const db = wx.cloud.database()

Page({
  data: {
    teamId: '',
    teamInfo: null,
    members: [],
    loading: true,
    showInviteModal: false,
    selectedMemberId: ''
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
    this.loadData()
  },

  onShow: function() {
    if (this.data.teamId) {
      this.loadData()
    }
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 加载数据
  loadData: function() {
    this.setData({ loading: true })

    const teamId = this.data.teamId
    const _ = db.command

    // 查询球队信息
    return db.collection('teams').doc(teamId).get()
    .then(teamRes => {
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
          this.setData({
            teamInfo,
            members,
            loading: false
          })
        })
    }).catch(err => {
      console.error('加载数据失败', err)
      this.setData({ loading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    })
  },

  // 显示邀请弹窗
  showInvite: function() {
    this.setData({ showInviteModal: true })
  },

  // 隐藏邀请弹窗
  hideInviteModal: function() {
    this.setData({ showInviteModal: false })
  },

  // 邀请成员（简化版：通过分享小程序）
  inviteMember: function() {
    this.hideInviteModal()
    
    // TODO: 实现分享邀请功能
    wx.showToast({
      title: '分享功能开发中',
      icon: 'none'
    })
  },

  // 显示成员操作菜单
  showMemberMenu: function(e) {
    const memberId = e.currentTarget.dataset.id
    const member = this.data.members.find(m => m._id === memberId)

    if (!member || member.role === 'captain') {
      return
    }

    const items = ['设为副队长', '移除球队']
    
    wx.showActionSheet({
      itemList: items,
      success: (res) => {
        if (res.tapIndex === 0) {
          this.setViceCaptain(memberId)
        } else if (res.tapIndex === 1) {
          this.removeMember(memberId)
        }
      }
    })
  },

  // 设为副队长
  setViceCaptain: function(memberId) {
    wx.showLoading({ title: '设置中...' })

    db.collection('team_members').doc(memberId).update({
      data: {
        role: 'vice-captain'
      }
    }).then(() => {
      wx.hideLoading()
      wx.showToast({
        title: '设置成功',
        icon: 'success'
      })
      this.loadData()
    }).catch(err => {
      console.error('设置失败', err)
      wx.hideLoading()
      wx.showToast({
        title: '设置失败',
        icon: 'none'
      })
    })
  },

  // 移除成员
  removeMember: function(memberId) {
    wx.showModal({
      title: '确认移除',
      content: '确定要将该成员移出球队吗？',
      success: (res) => {
        if (res.confirm) {
          this.confirmRemove(memberId)
        }
      }
    })
  },

  // 确认移除
  confirmRemove: function(memberId) {
    wx.showLoading({ title: '移除中...' })

    db.collection('team_members').doc(memberId).remove()
    .then(() => {
      wx.hideLoading()
      wx.showToast({
        title: '移除成功',
        icon: 'success'
      })
      this.loadData()
    }).catch(err => {
      console.error('移除失败', err)
      wx.hideLoading()
      wx.showToast({
        title: '移除失败',
        icon: 'none'
      })
    })
  },

  // 分享球队
  onShareAppMessage: function() {
    return {
      title: `邀请你加入 ${this.data.teamInfo?.name || '我的球队'}`,
      path: `/pages/teams/teams`,
      imageUrl: this.data.teamInfo?.logo || ''
    }
  }
})
