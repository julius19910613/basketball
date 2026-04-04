/**
 * 随机分组算法
 * 实现按能力档位平衡分组功能
 */

/**
 * Fisher-Yates 洗牌算法
 * 用于随机打乱数组顺序
 * @param {Array} array 待洗牌的数组
 * @returns {Array} 洗牌后的新数组
 */
function shuffle(array) {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * 按档位分组
 * @param {Array} players 球员数组
 * @returns {Object} 按档位分组的对象 { 5: [...], 4: [...], 3: [...], 2: [...] }
 */
function groupByLevel(players) {
  const groups = {
    5: [],
    4: [],
    3: [],
    2: []
  }
  
  players.forEach(player => {
    const level = player.skillLevel
    if (groups[level]) {
      groups[level].push(player)
    }
  })
  
  return groups
}

/**
 * 按档位平衡分组（核心算法）
 * 
 * 算法思路：
 * 1. 按档位分组
 * 2. 每个档位内部随机打乱
 * 3. 轮流分配到各队（保证每队档位分布尽量均匀）
 * 
 * @param {Array} players 待分组的球员数组
 * @param {number} teamCount 队伍数量（默认2队）
 * @param {Object} options 配置选项
 * @param {string} options.teamNamePrefix 队伍名称前缀
 * @returns {Object} 分组结果
 */
function balancedGroup(players, teamCount = 2, options = {}) {
  const { teamNamePrefix = '队伍' } = options
  
  // 参数校验
  if (!players || players.length === 0) {
    return {
      success: false,
      error: '没有可选的球员'
    }
  }
  
  if (teamCount < 2 || teamCount > 5) {
    return {
      success: false,
      error: '队伍数量需要在 2-5 之间'
    }
  }
  
  if (players.length < teamCount * 2) {
    return {
      success: false,
      error: `至少需要 ${teamCount * 2} 名球员才能分成 ${teamCount} 队`
    }
  }
  
  // 按档位分组并随机打乱
  const levelGroups = groupByLevel(players)
  
  // 对每个档位进行随机打乱
  Object.keys(levelGroups).forEach(level => {
    levelGroups[level] = shuffle(levelGroups[level])
  })
  
  // 初始化队伍
  const teams = []
  for (let i = 0; i < teamCount; i++) {
    teams.push({
      name: `${teamNamePrefix}${['A', 'B', 'C', 'D', 'E'][i]}`,
      players: [],
      totalLevel: 0
    })
  }
  
  // 从高档位到低档位依次分配（蛇形分配）
  const levels = [5, 4, 3, 2]
  
  levels.forEach(level => {
    const levelPlayers = levelGroups[level]
    
    // 蛇形分配：第一轮正序，第二轮倒序
    let round = 0
    let playerIndex = 0
    
    while (playerIndex < levelPlayers.length) {
      const teamIndex = round % 2 === 0 
        ? playerIndex % teamCount 
        : teamCount - 1 - (playerIndex % teamCount)
      
      // 找到人数最少的队伍（平局时优先分配到当前队伍）
      let targetTeam = teamIndex
      let minPlayers = teams[teamIndex].players.length
      
      teams.forEach((team, idx) => {
        if (team.players.length < minPlayers) {
          minPlayers = team.players.length
          targetTeam = idx
        }
      })
      
      // 分配球员
      teams[targetTeam].players.push(levelPlayers[playerIndex])
      teams[targetTeam].totalLevel += level
      
      playerIndex++
      
      // 当一轮分配完成后，进入下一轮
      if (playerIndex % teamCount === 0) {
        round++
      }
    }
  })
  
  // 计算每队平均档位
  teams.forEach(team => {
    team.avgLevel = team.players.length > 0 
      ? (team.totalLevel / team.players.length).toFixed(2) 
      : 0
  })
  
  // 按名称排序（A、B、C...）
  teams.sort((a, b) => a.name.localeCompare(b.name))
  
  // 计算分组统计
  const stats = calculateGroupStats(teams)
  
  return {
    success: true,
    teams: teams,
    stats: stats,
    createTime: new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(/\//g, '-')
  }
}

/**
 * 计算分组统计信息
 * @param {Array} teams 队伍数组
 * @returns {Object} 统计信息
 */
function calculateGroupStats(teams) {
  if (teams.length === 0) return null
  
  const avgLevels = teams.map(t => parseFloat(t.avgLevel))
  const maxAvg = Math.max(...avgLevels)
  const minAvg = Math.min(...avgLevels)
  const totalPlayers = teams.reduce((sum, t) => sum + t.players.length, 0)
  
  return {
    teamCount: teams.length,
    totalPlayers: totalPlayers,
    playersPerTeam: Math.round(totalPlayers / teams.length * 10) / 10,
    maxAvgLevel: maxAvg,
    minAvgLevel: minAvg,
    levelDifference: (maxAvg - minAvg).toFixed(2),
    isBalanced: (maxAvg - minAvg) <= 0.5 // 平均档位差小于0.5视为平衡
  }
}

/**
 * 验证分组条件
 * @param {Array} selectedPlayers 选中的球员
 * @param {number} teamCount 队伍数量
 * @returns {Object} 验证结果
 */
function validateGroupCondition(selectedPlayers, teamCount) {
  const errors = []
  const warnings = []
  
  // 基本校验
  if (!selectedPlayers || selectedPlayers.length === 0) {
    errors.push('请至少选择一名球员')
  }
  
  if (teamCount < 2) {
    errors.push('至少需要分成 2 队')
  }
  
  if (teamCount > 5) {
    errors.push('最多只能分成 5 队')
  }
  
  // 人数校验
  if (selectedPlayers.length < teamCount * 2) {
    errors.push(`至少需要 ${teamCount * 2} 名球员才能分成 ${teamCount} 队`)
  }
  
  // 档位分布校验
  const levelGroups = groupByLevel(selectedPlayers)
  const levelCounts = Object.keys(levelGroups).map(level => ({
    level: parseInt(level),
    count: levelGroups[level].length
  }))
  
  // 警告：某个档位人数过少可能导致不平衡
  levelCounts.forEach(item => {
    if (item.count > 0 && item.count < teamCount) {
      warnings.push(`${item.level}档球员只有 ${item.count} 人，可能导致分组不够均匀`)
    }
  })
  
  // 警告：人数不能平均分配
  if (selectedPlayers.length % teamCount !== 0) {
    warnings.push(`总人数 ${selectedPlayers.length} 不能被 ${teamCount} 整除，各队人数会有差异`)
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    levelDistribution: levelCounts
  }
}

/**
 * 获取分组预设方案
 * @param {number} playerCount 球员数量
 * @returns {Array} 推荐的分组方案
 */
function getGroupPresets(playerCount) {
  const presets = []
  
  if (playerCount >= 4) {
    presets.push({ teams: 2, label: '2队对抗', min: 4, desc: `每队约${Math.floor(playerCount/2)}人` })
  }
  if (playerCount >= 6) {
    presets.push({ teams: 3, label: '3队循环', min: 6, desc: `每队约${Math.floor(playerCount/3)}人` })
  }
  if (playerCount >= 8) {
    presets.push({ teams: 4, label: '4队淘汰', min: 8, desc: `每队约${Math.floor(playerCount/4)}人` })
  }
  
  return presets
}

module.exports = {
  shuffle,
  groupByLevel,
  balancedGroup,
  calculateGroupStats,
  validateGroupCondition,
  getGroupPresets
}
