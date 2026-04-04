// pages/team/random-group/random-group.js
const db = require('../../../utils/db')
const { balancedGroup, validateGroupCondition, getGroupPresets } = require('../../../utils/group-algorithm')

Page({
  data: {
    teamId: '',
    allPlayers: [],
    selectedPlayers: [],
    teamCount: 2,
    teamCountOptions: [2, 3, 4],
    presets: [],
    validationResult: null,
    loading: true,
    selectingMode: false,
    // 动画相关
    showGroupAnimation: false,
    animationPlayers: [],
    animationTeams: [],
    isLowEndDevice: false,
    // 统计
    selectedStats: {
      total: 0,
      level5: 0,
      level4: 0,
      level3: 0,
      level2: 0
    },
    // 各档位总人数（用于显示）
    levelStats: {
      level5: 0,
      level4: 0,
      level3: 0,
      level2: 0
    }
  },

  onLoad: function(options) {
    const teamId = options.teamId || 'test-team-id'
    
    // 检测设备性能
    this.checkDevicePerformance()
    
    this.setData({ teamId })
    this.loadPlayers()
  },
  
  /**
   * 检测设备性能
   */
  checkDevicePerformance: function() {
    try {
      const systemInfo = wx.getSystemInfoSync()
      
      // 判断是否为低端设备
      // 条件：Android 且 SDK 版本较低，或屏幕宽度较小
      const isLowEnd = 
        (systemInfo.platform === 'android' && systemInfo.SDKVersion < '2.10.0') ||
        systemInfo.screenWidth < 360 ||
        (systemInfo.benchmarkLevel && systemInfo.benchmarkLevel < 10)
      
      this.setData({ isLowEndDevice: isLowEnd })
      
      if (isLowEnd) {
        console.log('检测到低端设备，将禁用复杂动画')
      }
    } catch (err) {
      console.error('检测设备性能失败:', err)
    }
  },

  // 加载球员数据
  loadPlayers: async function() {
    const MIN_LOADING_TIME = 500
    const startTime = Date.now()
    
    this.setData({ loading: true })
    
    try {
      // 从真实数据库加载成员数据
      const members = await db.getTeamMembersDetail(this.data.teamId)
      
      const allPlayers = members.map(m => ({
        ...m,
        _id: m.userId, // 为了兼容分组算法
        selected: true // 默认全选
      }))
      
      // 默认全选
      const selectedPlayers = [...allPlayers]
      
      // 获取预设方案
      const presets = getGroupPresets(selectedPlayers.length)
      
      // 计算各档位总人数
      const levelStats = {
        level5: allPlayers.filter(p => p.skillLevel === 5).length,
        level4: allPlayers.filter(p => p.skillLevel === 4).length,
        level3: allPlayers.filter(p => p.skillLevel === 3).length,
        level2: allPlayers.filter(p => p.skillLevel === 2).length
      }
      
      // 确保骨架屏至少显示 MIN_LOADING_TIME
      const elapsed = Date.now() - startTime
      const delay = Math.max(0, MIN_LOADING_TIME - elapsed)
      
      setTimeout(() => {
        this.setData({
          allPlayers,
          selectedPlayers,
          presets,
          levelStats,
          loading: false
        })
        
        this.updateSelectedStats()
        this.validateConditions()
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

  // 更新已选统计
  updateSelectedStats: function() {
    const { selectedPlayers } = this.data
    const stats = {
      total: selectedPlayers.length,
      level5: 0,
      level4: 0,
      level3: 0,
      level2: 0
    }
    
    selectedPlayers.forEach(p => {
      if (p.skillLevel === 5) stats.level5++
      else if (p.skillLevel === 4) stats.level4++
      else if (p.skillLevel === 3) stats.level3++
      else if (p.skillLevel === 2) stats.level2++
    })
    
    this.setData({ selectedStats: stats })
  },

  // 验证分组条件
  validateConditions: function() {
    const { selectedPlayers, teamCount } = this.data
    const result = validateGroupCondition(selectedPlayers, teamCount)
    this.setData({ validationResult: result })
    return result
  },

  // 切换球员选择
  togglePlayer: function(e) {
    const { id } = e.currentTarget.dataset
    const { allPlayers } = this.data
    
    const index = allPlayers.findIndex(p => p._id === id)
    if (index !== -1) {
      allPlayers[index].selected = !allPlayers[index].selected
      
      const selectedPlayers = allPlayers.filter(p => p.selected)
      const presets = getGroupPresets(selectedPlayers.length)
      
      this.setData({ allPlayers, selectedPlayers, presets })
      this.updateSelectedStats()
      this.validateConditions()
    }
  },

  // 全选
  selectAll: function() {
    const { allPlayers } = this.data
    allPlayers.forEach(p => p.selected = true)
    const selectedPlayers = [...allPlayers]
    const presets = getGroupPresets(selectedPlayers.length)
    
    this.setData({ allPlayers, selectedPlayers, presets })
    this.updateSelectedStats()
    this.validateConditions()
  },

  // 取消全选
  deselectAll: function() {
    const { allPlayers } = this.data
    allPlayers.forEach(p => p.selected = false)
    
    this.setData({ allPlayers, selectedPlayers: [], presets: [] })
    this.updateSelectedStats()
    this.validateConditions()
  },

  // 按档位全选
  selectByLevel: function(e) {
    const { level } = e.currentTarget.dataset
    const { allPlayers } = this.data
    
    const levelPlayers = allPlayers.filter(p => p.skillLevel === level)
    levelPlayers.forEach(p => p.selected = true)
    
    const selectedPlayers = allPlayers.filter(p => p.selected)
    
    this.setData({ allPlayers, selectedPlayers })
    this.updateSelectedStats()
    this.validateConditions()
  },

  // 改变队伍数量
  onTeamCountChange: function(e) {
    const teamCount = parseInt(e.detail.value) + 2 // picker 索引从0开始
    this.setData({ teamCount })
    this.validateConditions()
  },

  // 选择预设方案
  selectPreset: function(e) {
    const { teams } = e.currentTarget.dataset
    this.setData({ teamCount: teams })
    this.validateConditions()
  },

  // 开始分组
  startGrouping: function() {
    const validation = this.validateConditions()
    
    if (!validation.valid) {
      wx.showToast({
        title: validation.errors[0] || '分组条件不满足',
        icon: 'none'
      })
      return
    }
    
    // 显示警告（如果有）
    if (validation.warnings.length > 0) {
      wx.showModal({
        title: '分组提示',
        content: validation.warnings.join('\n'),
        confirmText: '继续分组',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.doGrouping()
          }
        }
      })
    } else {
      this.doGrouping()
    }
  },

  // 执行分组
  doGrouping: function() {
    const { selectedPlayers, teamCount, isLowEndDevice } = this.data
    
    // 执行分组算法
    const result = balancedGroup(selectedPlayers, teamCount, {
      teamNamePrefix: '队伍'
    })
    
    if (!result.success) {
      wx.showToast({
        title: result.error || '分组失败',
        icon: 'none'
      })
      return
    }
    
    // 判断是否播放动画
    if (isLowEndDevice) {
      // 低端设备：直接跳转，使用简单淡入
      this.navigateToResult(result)
    } else {
      // 正常设备：播放分组动画
      this.playGroupAnimation(selectedPlayers, result)
    }
  },
  
  /**
   * 播放分组动画
   */
  playGroupAnimation: function(players, result) {
    // 准备动画数据
    const animationPlayers = players.map(p => ({
      _id: p._id || p.userId,
      name: p.name || p.nickName,
      avatar: p.avatar || p.avatarUrl
    }))
    
    const animationTeams = result.teams.map(team => ({
      name: team.name,
      players: team.players
    }))
    
    // 显示动画
    this.setData({
      showGroupAnimation: true,
      animationPlayers,
      animationTeams
    })
  },
  
  /**
   * 动画完成回调
   */
  onAnimationComplete: function() {
    const { animationTeams } = this.data
    
    // 构建结果数据
    const result = {
      success: true,
      teams: animationTeams,
      stats: {
        totalPlayers: animationTeams.reduce((sum, team) => sum + team.players.length, 0),
        teamCount: animationTeams.length
      },
      createTime: new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).replace(/\//g, '-')
    }
    
    // 隐藏动画
    this.setData({
      showGroupAnimation: false,
      animationPlayers: [],
      animationTeams: []
    })
    
    // 跳转到结果页
    this.navigateToResult(result)
  },
  
  /**
   * 跳转到结果页
   */
  navigateToResult: function(result) {
    // 将结果存储到全局
    const app = getApp()
    app.globalData.groupResult = result
    
    wx.navigateTo({
      url: `/pages/team/group-result/group-result?teamId=${this.data.teamId}`
    })
  },

  // 快速分组（使用默认配置）
  quickGroup: function() {
    // 快速分组使用所有球员和默认2队
    this.setData({ teamCount: 2 })
    this.selectAll()
    
    setTimeout(() => {
      this.startGrouping()
    }, 100)
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.loadPlayers()
    wx.stopPullDownRefresh()
  },

  // 按档位显示球员
  onLevelTabChange: function(e) {
    const { level } = e.currentTarget.dataset
    // 可以实现按档位筛选显示
  }
})
