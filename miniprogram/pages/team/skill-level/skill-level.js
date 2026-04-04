// pages/team/skill-level/skill-level.js
const db = require('../../../utils/db')

Page({
  data: {
    teamId: '',
    players: [],
    loading: true,
    editingPlayer: null,
    showLevelPicker: false,
    levelOptions: [
      { value: 5, label: '5档 - 顶级球员', color: '#FF4D4F' },
      { value: 4, label: '4档 - 优秀球员', color: '#FA8C16' },
      { value: 3, label: '3档 - 普通球员', color: '#52C41A' },
      { value: 2, label: '2档 - 新手球员', color: '#1890FF' }
    ],
    // 统计信息
    stats: {
      total: 0,
      level5: 0,
      level4: 0,
      level3: 0,
      level2: 0,
      avgLevel: 0
    }
  },

  onLoad: function(options) {
    // 从参数获取 teamId，如果没有则使用默认值（测试用）
    const teamId = options.teamId || 'test-team-id'
    this.setData({ teamId })
    this.loadPlayers()
  },

  onShow: function() {
    // 每次显示页面时重新加载数据
    this.loadPlayers()
  },

  // 加载球员数据
  loadPlayers: async function() {
    const MIN_LOADING_TIME = 500 // 最小显示时间，防止闪烁
    const startTime = Date.now()
    
    this.setData({ loading: true })
    
    try {
      // 从真实数据库加载成员数据
      const players = await db.getTeamMembersDetail(this.data.teamId)
      
      // 计算统计信息
      const stats = this.calculateStats(players)
      
      // 确保骨架屏至少显示 MIN_LOADING_TIME
      const elapsed = Date.now() - startTime
      const delay = Math.max(0, MIN_LOADING_TIME - elapsed)
      
      setTimeout(() => {
        this.setData({
          players,
          stats,
          loading: false
        })
      }, delay)
      
    } catch (err) {
      console.error('加载球员数据失败:', err)
      
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
      
      this.setData({ loading: false })
    }
  },

  // 计算统计信息
  calculateStats: function(players) {
    const stats = {
      total: players.length,
      level5: 0,
      level4: 0,
      level3: 0,
      level2: 0,
      avgLevel: 0
    }
    
    if (players.length === 0) return stats
    
    let totalLevel = 0
    players.forEach(p => {
      totalLevel += p.skillLevel
      if (p.skillLevel === 5) stats.level5++
      else if (p.skillLevel === 4) stats.level4++
      else if (p.skillLevel === 3) stats.level3++
      else if (p.skillLevel === 2) stats.level2++
    })
    
    stats.avgLevel = (totalLevel / players.length).toFixed(2)
    return stats
  },

  // 点击球员 - 打开档位选择器
  onPlayerTap: function(e) {
    const { id } = e.currentTarget.dataset
    const player = this.data.players.find(p => p._id === id)
    
    if (player) {
      this.setData({
        editingPlayer: player,
        showLevelPicker: true
      })
    }
  },

  // 选择档位
  onLevelSelect: async function(e) {
    const { level } = e.currentTarget.dataset
    const { editingPlayer, players, teamId } = this.data
    
    if (!editingPlayer) return
    
    wx.showLoading({ title: '保存中...', mask: true })
    
    try {
      // 保存到数据库
      await db.updateMemberSkillLevel(teamId, editingPlayer.userId, level)
      
      // 更新本地数据
      const index = players.findIndex(p => p.userId === editingPlayer.userId)
      if (index !== -1) {
        players[index].skillLevel = level
        players[index].levelDesc = db.getLevelDesc(level)
        players[index].levelColor = db.getLevelColor(level)
      }
      
      // 重新计算统计
      const stats = this.calculateStats(players)
      
      this.setData({
        players,
        stats,
        showLevelPicker: false,
        editingPlayer: null
      })
      
      wx.hideLoading()
      wx.showToast({
        title: `已设为${level}档`,
        icon: 'success'
      })
      
    } catch (err) {
      wx.hideLoading()
      console.error('保存档位失败:', err)
      
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
  },

  // 关闭档位选择器
  closeLevelPicker: function() {
    this.setData({
      showLevelPicker: false,
      editingPlayer: null
    })
  },

  // 阻止冒泡
  preventBubble: function() {},

  // 快速设置 - 自动平衡档位
  autoBalance: function() {
    wx.showModal({
      title: '自动平衡',
      content: '将根据球员实际能力重新分配档位，确定吗？',
      success: (res) => {
        if (res.confirm) {
          // TODO: 实现自动平衡逻辑
          wx.showToast({
            title: '功能开发中',
            icon: 'none'
          })
        }
      }
    })
  },

  // 重置所有档位
  resetAll: function() {
    wx.showModal({
      title: '重置档位',
      content: '将所有球员档位重置为3档，确定吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '重置中...', mask: true })
          
          try {
            // 批量更新到数据库
            const updates = this.data.players.map(p => ({
              userId: p.userId,
              skillLevel: 3
            }))
            
            await db.batchUpdateSkillLevel(this.data.teamId, updates)
            
            // 更新本地数据
            const players = this.data.players.map(p => ({
              ...p,
              skillLevel: 3,
              levelDesc: db.getLevelDesc(3),
              levelColor: db.getLevelColor(3)
            }))
            
            const stats = this.calculateStats(players)
            
            this.setData({ players, stats })
            
            wx.hideLoading()
            wx.showToast({
              title: '已重置',
              icon: 'success'
            })
            
          } catch (err) {
            wx.hideLoading()
            console.error('重置失败:', err)
            
            wx.showToast({
              title: '重置失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.loadPlayers()
    wx.stopPullDownRefresh()
  }
})
