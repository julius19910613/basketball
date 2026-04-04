// pages/match/match-detail/match-detail.js
const db = wx.cloud.database()

Page({
  data: {
    matchId: '',
    matchInfo: null,
    loading: true,
    canEdit: false,
    statusText: {
      'scheduled': '未开始',
      'ongoing': '进行中',
      'finished': '已结束'
    },
    formattedStartTime: '',
    // 比分弹窗
    showScoreModal: false,
    tempHomeScore: 0,
    tempAwayScore: 0
  },

  onLoad(options) {
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

    this.setData({ matchId: options.id })
    this.loadMatchDetail()
  },

  onShow() {
    if (this.data.matchId) {
      this.loadMatchDetail()
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadMatchDetail().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 加载比赛详情
  async loadMatchDetail() {
    const MIN_LOADING_TIME = 500
    const startTime = Date.now()

    this.setData({ loading: true })

    try {
      // 获取用户 openid
      const openidRes = await wx.cloud.callFunction({ name: 'getOpenId' })
      const openid = openidRes.result.openid

      // 查询比赛信息
      const matchRes = await db.collection('matches').doc(this.data.matchId).get()
      const matchInfo = matchRes.data

      // 格式化时间
      const formattedStartTime = this.formatDateTime(new Date(matchInfo.startTime))

      // 判断是否有编辑权限（创建者或队长）
      const canEdit = matchInfo.homeTeam && matchInfo.homeTeam._id === openid

      // 确保最小加载时间
      const elapsed = Date.now() - startTime
      const delay = Math.max(0, MIN_LOADING_TIME - elapsed)

      setTimeout(() => {
        this.setData({
          matchInfo,
          formattedStartTime,
          canEdit,
          loading: false
        })
      }, delay)

    } catch (err) {
      console.error('加载比赛详情失败:', err)
      this.setData({ loading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  // 格式化日期时间
  formatDateTime(date) {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
    const weekDay = weekDays[date.getDay()]
    return `${year}年${month}月${day}日 周${weekDay} ${hours}:${minutes}`
  },

  // 编辑比赛
  editMatch() {
    wx.navigateTo({
      url: `/pages/match/create-match/create-match?id=${this.data.matchId}&mode=edit`
    })
  },

  // 显示比分弹窗
  updateScore() {
    this.setData({
      showScoreModal: true,
      tempHomeScore: this.data.matchInfo.homeScore || 0,
      tempAwayScore: this.data.matchInfo.awayTeam ? (this.data.matchInfo.awayScore || 0) : 0
    })
  },

  hideScoreModal() {
    this.setData({ showScoreModal: false })
  },

  preventClose() {
    // 阻止点击弹窗内容区域关闭
  },

  onHomeScoreInput(e) {
    this.setData({ tempHomeScore: parseInt(e.detail.value) || 0 })
  },

  onAwayScoreInput(e) {
    this.setData({ tempAwayScore: parseInt(e.detail.value) || 0 })
  },

  // 确认比分
  async confirmScore() {
    const { tempHomeScore, tempAwayScore, matchId } = this.data

    try {
      wx.showLoading({ title: '更新中...' })

      await db.collection('matches').doc(matchId).update({
        data: {
          homeScore: tempHomeScore,
          awayScore: tempAwayScore
        }
      })

      wx.hideLoading()
      wx.showToast({
        title: '更新成功',
        icon: 'success'
      })

      this.setData({ showScoreModal: false })
      this.loadMatchDetail()

    } catch (err) {
      wx.hideLoading()
      console.error('更新比分失败:', err)
      wx.showToast({
        title: '更新失败',
        icon: 'none'
      })
    }
  },

  // 开始比赛
  async startMatch() {
    try {
      wx.showLoading({ title: '操作中...' })

      await db.collection('matches').doc(this.data.matchId).update({
        data: {
          status: 'ongoing'
        }
      })

      wx.hideLoading()
      wx.showToast({
        title: '比赛开始',
        icon: 'success'
      })

      this.loadMatchDetail()

    } catch (err) {
      wx.hideLoading()
      console.error('操作失败:', err)
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    }
  },

  // 结束比赛
  async finishMatch() {
    wx.showModal({
      title: '确认结束比赛？',
      content: '结束后将无法再修改状态',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '操作中...' })

            await db.collection('matches').doc(this.data.matchId).update({
              data: {
                status: 'finished'
              }
            })

            wx.hideLoading()
            wx.showToast({
              title: '比赛结束',
              icon: 'success'
            })

            this.loadMatchDetail()

          } catch (err) {
            wx.hideLoading()
            console.error('操作失败:', err)
            wx.showToast({
              title: '操作失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  // 删除比赛
  deleteMatch() {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除吗？',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '删除中...' })

            await db.collection('matches').doc(this.data.matchId).remove()

            wx.hideLoading()
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            })

            setTimeout(() => {
              wx.navigateBack()
            }, 1500)

          } catch (err) {
            wx.hideLoading()
            console.error('删除失败:', err)
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  // 分享
  onShareAppMessage() {
    const { matchInfo } = this.data
    return {
      title: `${matchInfo.homeTeam.name} VS ${matchInfo.awayTeam ? matchInfo.awayTeam.name : '待定'} - 比赛详情`,
      path: `/pages/match/match-detail/match-detail?id=${this.data.matchId}`
    }
  }
})
