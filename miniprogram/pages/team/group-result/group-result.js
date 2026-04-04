// pages/team/group-result/group-result.js
const db = require('../../../utils/db')
const { balancedGroup } = require('../../../utils/group-algorithm')

Page({
  data: {
    teamId: '',
    result: null,
    teams: [],
    stats: null,
    createTime: '',
    showTeamDetail: null,
    saved: false,
    saving: false,
    levelComparisonData: [] // 档位对比数据（预计算）
  },

  onLoad: function(options) {
    // 从参数获取 teamId
    const teamId = options.teamId || 'test-team-id'
    this.setData({ teamId })
    
    // 从全局获取分组结果
    const app = getApp()
    const result = app.globalData.groupResult
    
    if (!result) {
      wx.showToast({
        title: '分组数据丢失',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }
    
    // 增强球员数据（添加档位描述和颜色）
    const teams = result.teams.map(team => ({
      ...team,
      players: team.players.map(p => ({
        ...p,
        levelDesc: db.getLevelDesc(p.skillLevel),
        levelColor: db.getLevelColor(p.skillLevel)
      }))
    }))
    
    // 计算档位对比数据
    const levelComparisonData = this.calculateLevelComparison(teams)
    
    this.setData({
      result,
      teams,
      stats: result.stats,
      createTime: result.createTime,
      levelComparisonData
    })
    
    // 清除全局数据
    app.globalData.groupResult = null
  },

  // 计算档位对比数据
  calculateLevelComparison: function(teams) {
    const levels = [5, 4, 3, 2]
    return levels.map(level => ({
      level,
      teams: teams.map(team => ({
        name: team.name,
        count: team.players.filter(p => p.skillLevel === level).length
      }))
    }))
  },

  // 显示/隐藏队伍详情
  toggleTeamDetail: function(e) {
    const { index } = e.currentTarget.dataset
    const { showTeamDetail } = this.data
    
    if (showTeamDetail === index) {
      this.setData({ showTeamDetail: null })
    } else {
      this.setData({ showTeamDetail: index })
    }
  },

  // 重新分组
  regroup: function() {
    wx.showModal({
      title: '重新分组',
      content: '将使用相同的球员重新随机分组，确定吗？',
      success: (res) => {
        if (res.confirm) {
          this.doRegroup()
        }
      }
    })
  },

  // 执行重新分组
  doRegroup: function() {
    const { result, teams } = this.data
    if (!result) return
    
    // 收集所有球员
    const allPlayers = teams.reduce((acc, team) => {
      return acc.concat(team.players)
    }, [])
    
    // 重新分组
    const newResult = balancedGroup(allPlayers, teams.length, {
      teamNamePrefix: '队伍'
    })
    
    if (newResult.success) {
      const newTeams = newResult.teams.map(team => ({
        ...team,
        players: team.players.map(p => ({
          ...p,
          levelDesc: db.getLevelDesc(p.skillLevel),
          levelColor: db.getLevelColor(p.skillLevel)
        }))
      }))
      
      // 重新计算档位对比数据
      const levelComparisonData = this.calculateLevelComparison(newTeams)
      
      this.setData({
        result: newResult,
        teams: newTeams,
        stats: newResult.stats,
        createTime: newResult.createTime,
        levelComparisonData,
        saved: false
      })
      
      wx.showToast({
        title: '已重新分组',
        icon: 'success'
      })
    }
  },

  // 保存分组记录
  saveGroup: async function() {
    const { result, teams, saved, saving, teamId } = this.data
    if (!result || saved || saving) return
    
    this.setData({ saving: true })
    wx.showLoading({ title: '保存中...', mask: true })
    
    try {
      // 格式化分组数据用于保存
      const groupData = db.formatGroupResultForSave(result, teamId)
      
      // 保存到数据库
      const groupId = await db.saveGroupResult(groupData)
      
      this.setData({ 
        saved: true,
        saving: false
      })
      
      wx.hideLoading()
      wx.showToast({
        title: '已保存',
        icon: 'success'
      })
      
    } catch (err) {
      console.error('保存分组失败:', err)
      
      this.setData({ saving: false })
      wx.hideLoading()
      
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
  },

  // 分享分组结果
  onShareAppMessage: function() {
    const { teams, createTime } = this.data
    const teamNames = teams.map(t => t.name).join(' vs ')
    
    return {
      title: `篮球分组：${teamNames}`,
      path: '/pages/index/index',
      imageUrl: '' // 可以生成分享图片
    }
  },

  // 生成分享图片
  generateShareImage: function() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 复制分组结果
  copyResult: function() {
    const { teams, createTime } = this.data
    
    let text = `篮球分组 ${createTime}\n\n`
    teams.forEach(team => {
      text += `【${team.name}】平均档位：${team.avgLevel}\n`
      team.players.forEach(p => {
        text += `  ${p.name}(${p.number}号) - ${p.skillLevel}档\n`
      })
      text += '\n'
    })
    
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({
          title: '已复制',
          icon: 'success'
        })
      }
    })
  },

  // 返回上一页
  goBack: function() {
    wx.navigateBack()
  },

  // 返回首页
  goHome: function() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})
