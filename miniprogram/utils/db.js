/**
 * 数据库工具模块
 * 封装云数据库操作
 */

const db = wx.cloud.database()
const _ = db.command
const matchHelper = require("./match-helper")

/**
 * 数据库集合常量
 */
const COLLECTIONS = {
  PLAYERS: 'players',
  MATCHES: 'matches',
  PLAYER_MATCH_STATS: 'player_match_stats',
  TEAMS: 'teams',
  USERS: 'users',
  RANDOM_GROUPS: 'random_groups'
}

/**
 * ================== Players 相关操作 ==================
 */

/**
 * 添加球员
 */
async function addPlayer(playerData) {
  try {
    const res = await db.collection(COLLECTIONS.PLAYERS).add({
      data: {
        ...playerData,
        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
      }
    })
    return res._id
  } catch (err) {
    console.error('添加球员失败:', err)
    throw err
  }
}

/**
 * ================== skillLevel 相关操作 ==================
 */

/**
 * 获取球队所有成员的能力档位
 * @param {string} teamId - 球队ID
 * @returns {Promise<Array>} 成员列表（含skillLevel）
 */
async function getTeamMembersWithSkillLevel(teamId) {
  try {
    const res = await db.collection('teams').doc(teamId).get()
    const members = res.data.members || []
    
    // 为每个成员添加档位描述和颜色
    return members.map(m => ({
      ...m,
      levelDesc: getLevelDesc(m.skillLevel || 3),
      levelColor: getLevelColor(m.skillLevel || 3)
    }))
  } catch (err) {
    console.error('获取球队成员失败:', err)
    throw err
  }
}

/**
 * 更新成员能力档位
 * @param {string} teamId - 球队ID
 * @param {string} userId - 用户OpenID
 * @param {number} skillLevel - 档位 (2-5)
 * @returns {Promise<boolean>} 是否成功
 */
async function updateMemberSkillLevel(teamId, userId, skillLevel) {
  try {
    // 1. 获取当前team数据
    const teamRes = await db.collection('teams').doc(teamId).get()
    const members = teamRes.data.members || []
    
    // 2. 找到并更新对应成员
    const memberIndex = members.findIndex(m => m.userId === userId)
    if (memberIndex === -1) {
      throw new Error('未找到该成员')
    }
    
    members[memberIndex].skillLevel = skillLevel
    
    // 3. 更新teams集合
    await db.collection('teams').doc(teamId).update({
      data: {
        members: members
      }
    })
    
    // 4. 同步更新users集合
    await db.collection('users').where({
      _openid: userId
    }).update({
      data: {
        skillLevel: skillLevel,
        skillLevelUpdatedAt: db.serverDate()
      }
    })
    
    return true
  } catch (err) {
    console.error('更新成员档位失败:', err)
    throw err
  }
}

/**
 * 批量更新成员能力档位
 * @param {string} teamId - 球队ID
 * @param {Array} updates - 更新列表 [{userId, skillLevel}, ...]
 * @returns {Promise<boolean>} 是否成功
 */
async function batchUpdateSkillLevel(teamId, updates) {
  try {
    // 1. 获取当前team数据
    const teamRes = await db.collection('teams').doc(teamId).get()
    const members = teamRes.data.members || []
    
    // 2. 批量更新
    updates.forEach(update => {
      const memberIndex = members.findIndex(m => m.userId === update.userId)
      if (memberIndex !== -1) {
        members[memberIndex].skillLevel = update.skillLevel
      }
    })
    
    // 3. 更新teams集合
    await db.collection('teams').doc(teamId).update({
      data: {
        members: members
      }
    })
    
    return true
  } catch (err) {
    console.error('批量更新档位失败:', err)
    throw err
  }
}

/**
 * 获取档位统计信息
 * @param {string} teamId - 球队ID
 * @returns {Promise<Object>} 统计信息
 */
async function getSkillLevelStats(teamId) {
  try {
    const members = await getTeamMembersWithSkillLevel(teamId)
    
    const stats = {
      total: members.length,
      level5: 0,
      level4: 0,
      level3: 0,
      level2: 0,
      avgLevel: 0
    }
    
    if (members.length === 0) return stats
    
    let totalLevel = 0
    members.forEach(m => {
      const level = m.skillLevel || 3
      totalLevel += level
      if (level === 5) stats.level5++
      else if (level === 4) stats.level4++
      else if (level === 3) stats.level3++
      else if (level === 2) stats.level2++
    })
    
    stats.avgLevel = (totalLevel / members.length).toFixed(2)
    
    return stats
  } catch (err) {
    console.error('获取档位统计失败:', err)
    throw err
  }
}

/**
 * ================== random_groups 相关操作 ==================
 */

/**
 * 保存分组结果
 * @param {Object} groupData - 分组数据
 * @returns {Promise<string>} 分组记录ID
 */
async function saveGroupResult(groupData) {
  try {
    const res = await db.collection('random_groups').add({
      data: {
        ...groupData,
        createdAt: db.serverDate()
      }
    })
    
    return res._id
  } catch (err) {
    console.error('保存分组结果失败:', err)
    throw err
  }
}

/**
 * 获取分组历史记录
 * @param {string} teamId - 球队ID
 * @param {number} limit - 返回数量
 * @returns {Promise<Array>} 分组历史列表
 */
async function getGroupHistory(teamId, limit = 20) {
  try {
    const res = await db.collection('random_groups')
      .where({
        teamId: teamId
      })
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get()
    
    return res.data
  } catch (err) {
    console.error('获取分组历史失败:', err)
    throw err
  }
}

/**
 * 获取单个分组详情
 * @param {string} groupId - 分组ID
 * @returns {Promise<Object>} 分组详情
 */
async function getGroupDetail(groupId) {
  try {
    const res = await db.collection('random_groups').doc(groupId).get()
    return res.data
  } catch (err) {
    console.error('获取分组详情失败:', err)
    throw err
  }
}

/**
 * 删除分组记录
 * @param {string} groupId - 分组ID
 * @returns {Promise<boolean>} 是否成功
 */
async function deleteGroupResult(groupId) {
  try {
    await db.collection('random_groups').doc(groupId).remove()
    return true
  } catch (err) {
    console.error('删除分组记录失败:', err)
    throw err
  }
}

/**
 * ================== Matches 相关操作 ==================
 */

function buildMatchWhere(teamId, filter) {
  var where = {}
  if (teamId) where.teamId = teamId
  if (filter && filter.result) where.result = filter.result
  if (filter && filter.matchType) where.matchType = filter.matchType
  if (filter && filter.status) where.status = filter.status
  return where
}

async function createPlayerMatchStats(match) {
  var stats = matchHelper.extractPlayerMatchStats(match)
  if (!stats.length) return
  await Promise.all(
    stats.map(function (item) {
      return db.collection(COLLECTIONS.PLAYER_MATCH_STATS).add({
        data: Object.assign({}, item, { createdAt: db.serverDate() })
      })
    })
  )
}

async function replacePlayerMatchStats(matchId, match) {
  await db
    .collection(COLLECTIONS.PLAYER_MATCH_STATS)
    .where({ matchId: matchId })
    .remove()
  await createPlayerMatchStats(Object.assign({}, match, { _id: matchId }))
}

function getGroupingPayloadUpdateData(groupingPayload, lockedAt) {
  var data = {
    selectedPlayerIds: groupingPayload.selectedPlayerIds || [],
    playerStats: groupingPayload.playerStats || [],
    grouping: Object.assign({}, groupingPayload.grouping || {})
  }
  if (lockedAt) {
    data.grouping = Object.assign({}, data.grouping, { lockedAt: lockedAt })
  }
  return data
}

/**
 * 创建比赛
 */
async function createMatch(matchData) {
  try {
    var payload = matchHelper.prepareMatchForSave(matchData)
    var grouping = payload.grouping || { teamAPlayerIds: [], teamBPlayerIds: [], lockedAt: null }
    var nowData = Object.assign({}, payload, {
      status: payload.status || "draft",
      isGroupingLocked: !!payload.isGroupingLocked,
      selectedPlayerIds: payload.selectedPlayerIds || [],
      grouping: grouping,
      createdAt: db.serverDate(),
      updatedAt: db.serverDate()
    })
    var res = await db.collection(COLLECTIONS.MATCHES).add({ data: nowData })
    await createPlayerMatchStats(Object.assign({}, payload, { _id: res._id }))
    return res._id
  } catch (err) {
    console.error("创建比赛失败:", err)
    throw err
  }
}

/**
 * 获取比赛列表
 */
async function getMatchList(teamId, filter = {}, page = 0, pageSize = 20) {
  try {
    var where = buildMatchWhere(teamId, filter)
    var query = db
      .collection(COLLECTIONS.MATCHES)
      .where(where)
      .orderBy("matchDate", "desc")
      .skip(page * pageSize)
      .limit(pageSize)

    if (filter && filter.playerId) {
      var history = await db
        .collection(COLLECTIONS.PLAYER_MATCH_STATS)
        .where({ playerId: filter.playerId })
        .orderBy("matchDate", "desc")
        .get()
      var matchIds = (history.data || []).map(function (item) {
        return item.matchId
      })
      if (!matchIds.length) return []
      where._id = _.in(matchIds)
      query = db
        .collection(COLLECTIONS.MATCHES)
        .where(where)
        .orderBy("matchDate", "desc")
        .skip(page * pageSize)
        .limit(pageSize)
    }

    var res = await query.get()
    return res.data || []
  } catch (err) {
    console.error("获取比赛列表失败:", err)
    throw err
  }
}

/**
 * 获取比赛详情
 */
async function getMatchDetail(matchId) {
  try {
    var res = await db.collection(COLLECTIONS.MATCHES).doc(matchId).get()
    return res.data || null
  } catch (err) {
    console.error("获取比赛详情失败:", err)
    throw err
  }
}

async function getMatchById(matchId) {
  var res = await db.collection(COLLECTIONS.MATCHES).doc(matchId).get()
  return res.data || null
}

/**
 * 更新比赛
 */
async function updateMatch(matchId, updateData) {
  try {
    var existing = await getMatchById(matchId)
    if (!existing) throw new Error("比赛不存在")
    var payload = matchHelper.prepareMatchForSave(updateData)
    if (matchHelper.isGroupingLocked(existing) && (payload.grouping || payload.selectedPlayerIds)) {
      throw new Error("已完成比赛不允许修改分组")
    }
    await db.collection(COLLECTIONS.MATCHES).doc(matchId).update({
      data: Object.assign({}, payload, { updatedAt: db.serverDate() })
    })
    await replacePlayerMatchStats(matchId, payload)
    return true
  } catch (err) {
    console.error("更新比赛失败:", err)
    throw err
  }
}

async function saveMatchDraft(payload) {
  var data = Object.assign({}, payload, {
    status: "draft",
    isGroupingLocked: false
  })
  if (data._id) {
    var id = data._id
    delete data._id
    await db.collection(COLLECTIONS.MATCHES).doc(id).update({
      data: Object.assign({}, data, { updatedAt: db.serverDate() })
    })
    await replacePlayerMatchStats(id, data)
    return id
  }
  return createMatch(data)
}

async function updateDraftGrouping(matchId, payload) {
  var existing = await getMatchById(matchId)
  if (!existing) throw new Error("草稿不存在")
  if (matchHelper.isGroupingLocked(existing)) throw new Error("已完成比赛不可修改分组")
  var updateData = getGroupingPayloadUpdateData(payload)
  await db.collection(COLLECTIONS.MATCHES).doc(matchId).update({
    data: Object.assign({}, updateData, {
      status: "draft",
      isGroupingLocked: false,
      updatedAt: db.serverDate()
    })
  })
  await replacePlayerMatchStats(matchId, Object.assign({}, existing, updateData))
  return true
}

async function finalizeMatchGrouping(matchId, groupingPayload) {
  var existing = await getMatchById(matchId)
  if (!existing) throw new Error("比赛不存在")
  if (matchHelper.isGroupingLocked(existing)) throw new Error("比赛已完成")
  var lockedAt = db.serverDate()
  var updateData = getGroupingPayloadUpdateData(groupingPayload, lockedAt)
  await db.collection(COLLECTIONS.MATCHES).doc(matchId).update({
    data: Object.assign({}, updateData, {
      status: "finalized",
      isGroupingLocked: true,
      updatedAt: db.serverDate()
    })
  })
  await replacePlayerMatchStats(matchId, Object.assign({}, existing, updateData))
  return true
}

/**
 * 删除比赛
 */
async function deleteMatch(matchId) {
  try {
    await db.collection(COLLECTIONS.MATCHES).doc(matchId).remove()
    await db
      .collection(COLLECTIONS.PLAYER_MATCH_STATS)
      .where({ matchId: matchId })
      .remove()
    return true
  } catch (err) {
    console.error("删除比赛失败:", err)
    throw err
  }
}

/**
 * 获取球员比赛历史
 */
async function getPlayerMatchHistory(playerId, limit = 20) {
  try {
    var res = await db
      .collection(COLLECTIONS.PLAYER_MATCH_STATS)
      .where({ playerId: playerId })
      .orderBy("matchDate", "desc")
      .limit(limit)
      .get()
    return res.data || []
  } catch (err) {
    console.error("获取球员比赛历史失败:", err)
    throw err
  }
}

/**
 * 获取球员赛季统计
 */
async function getPlayerSeasonStats(playerId, season) {
  try {
    var history = await getPlayerMatchHistory(playerId, 200)
    var list = history
    if (season) {
      list = history.filter(function (item) {
        return String(item.matchDate || "").startsWith(String(season))
      })
    }
    if (!list.length) {
      return {
        games: 0,
        avgPoints: 0,
        avgRebounds: 0,
        avgAssists: 0,
        maxPoints: 0,
        fgPct: 0
      }
    }
    var total = list.reduce(
      function (acc, item) {
        acc.points += Number(item.points) || 0
        acc.rebounds += Number(item.rebounds) || 0
        acc.assists += Number(item.assists) || 0
        acc.maxPoints = Math.max(acc.maxPoints, Number(item.points) || 0)
        acc.shotsMade += Number(item.shotsMade) || 0
        acc.shotsAttempted += Number(item.shotsAttempted) || 0
        return acc
      },
      { points: 0, rebounds: 0, assists: 0, maxPoints: 0, shotsMade: 0, shotsAttempted: 0 }
    )
    var games = list.length
    return {
      games: games,
      avgPoints: Math.round((total.points / games) * 10) / 10,
      avgRebounds: Math.round((total.rebounds / games) * 10) / 10,
      avgAssists: Math.round((total.assists / games) * 10) / 10,
      maxPoints: total.maxPoints,
      fgPct: matchHelper.calcFgPct(total.shotsMade, total.shotsAttempted)
    }
  } catch (err) {
    console.error("获取球员赛季统计失败:", err)
    throw err
  }
}

/**
 * ================== 辅助函数 ==================
 */

/**
 * 获取档位描述
 * @param {number} level 档位 2-5
 * @returns {string} 档位描述
 */
function getLevelDesc(level) {
  const descMap = {
    5: '顶级球员',
    4: '优秀球员',
    3: '普通球员',
    2: '新手球员'
  }
  return descMap[level] || '未知'
}

/**
 * 获取档位颜色
 * @param {number} level 档位 2-5
 * @returns {string} 颜色值
 */
function getLevelColor(level) {
  const colorMap = {
    5: '#FF4D4F', // 红色 - 顶级
    4: '#FA8C16', // 橙色 - 优秀
    3: '#52C41A', // 绿色 - 普通
    2: '#1890FF'  // 蓝色 - 新手
  }
  return colorMap[level] || '#8C8C8C'
}

/**
 * 获取位置中文名
 * @param {string} position 位置代码
 * @returns {string} 位置中文名
 */
function getPositionName(position) {
  const positionMap = {
    'PG': '控球后卫',
    'SG': '得分后卫',
    'SF': '小前锋',
    'PF': '大前锋',
    'C': '中锋'
  }
  return positionMap[position] || position
}

/**
 * 格式化分组结果用于显示
 * @param {Object} groupResult - 分组结果（从算法返回）
 * @param {string} teamId - 球队ID
 * @returns {Object} 格式化后的分组数据
 */
function formatGroupResultForSave(groupResult, teamId) {
  const app = getApp()
  const currentUser = app.globalData.userInfo || {}
  
  return {
    teamId: teamId,
    groupId: `group_${Date.now()}`,
    algorithm: 'balanced',
    totalMembers: groupResult.stats.totalPlayers,
    groups: groupResult.teams.map((team, index) => ({
      teamName: team.name,
      teamColor: getTeamColor(index),
      members: team.players.map(p => ({
        userId: p._id || p.userId,
        number: p.number,
        name: p.name,
        avatar: p.avatar || p.avatarUrl,
        skillLevel: p.skillLevel
      })),
      skillDistribution: {
        level5: team.players.filter(p => p.skillLevel === 5).length,
        level4: team.players.filter(p => p.skillLevel === 4).length,
        level3: team.players.filter(p => p.skillLevel === 3).length,
        level2: team.players.filter(p => p.skillLevel === 2).length
      },
      avgLevel: parseFloat(team.avgLevel)
    })),
    skillSummary: {
      level5: groupResult.stats.level5Count || 0,
      level4: groupResult.stats.level4Count || 0,
      level3: groupResult.stats.level3Count || 0,
      level2: groupResult.stats.level2Count || 0
    },
    createdBy: currentUser._openid || '',
    createTime: groupResult.createTime
  }
}

/**
 * 获取队伍颜色
 * @param {number} index - 队伍索引
 * @returns {string} 颜色值
 */
function getTeamColor(index) {
  const colors = ['#FFFFFF', '#2196F3', '#F44336', '#FFEB3B']
  return colors[index % colors.length]
}

/**
 * ================== 用户相关操作 ==================
 */

/**
 * 获取用户信息
 * @param {string} openid - 用户OpenID
 * @returns {Promise<Object>} 用户信息
 */
async function getUserInfo(openid) {
  try {
    const res = await db.collection('users').where({
      _openid: openid
    }).get()
    
    return res.data[0] || null
  } catch (err) {
    console.error('获取用户信息失败:', err)
    throw err
  }
}

/**
 * 更新用户信息
 * @param {string} openid - 用户OpenID
 * @param {Object} data - 更新数据
 * @returns {Promise<boolean>} 是否成功
 */
async function updateUserInfo(openid, data) {
  try {
    await db.collection('users').where({
      _openid: openid
    }).update({
      data: {
        ...data,
        updatedAt: db.serverDate()
      }
    })
    
    return true
  } catch (err) {
    console.error('更新用户信息失败:', err)
    throw err
  }
}

/**
 * ================== 团队成员相关操作 ==================
 */

/**
 * 获取团队成员详情（包含用户信息）
 * @param {string} teamId - 球队ID
 * @returns {Promise<Array>} 成员详情列表
 */
async function getTeamMembersDetail(teamId) {
  try {
    // 1. 获取团队成员列表
    const teamRes = await db.collection('teams').doc(teamId).get()
    const members = teamRes.data.members || []
    
    // 2. 获取所有成员的用户信息
    const userOpenids = members.map(m => m.userId)
    
    // 注意：云数据库一次最多查询 100 条
    const usersRes = await db.collection('users')
      .where({
        _openid: _.in(userOpenids)
      })
      .get()
    
    const usersMap = {}
    usersRes.data.forEach(user => {
      usersMap[user._openid] = user
    })
    
    // 3. 合并成员信息
    return members.map(m => {
      const user = usersMap[m.userId] || {}
      return {
        ...user,
        ...m,
        levelDesc: getLevelDesc(m.skillLevel || 3),
        levelColor: getLevelColor(m.skillLevel || 3)
      }
    })
  } catch (err) {
    console.error('获取团队成员详情失败:', err)
    throw err
  }
}

module.exports = {
  // matches 相关
  createMatch,
  getMatchList,
  getMatchDetail,
  updateMatch,
  saveMatchDraft,
  updateDraftGrouping,
  finalizeMatchGrouping,
  deleteMatch,
  getPlayerMatchHistory,
  getPlayerSeasonStats,

  // skillLevel 相关
  getTeamMembersWithSkillLevel,
  updateMemberSkillLevel,
  batchUpdateSkillLevel,
  getSkillLevelStats,
  
  // random_groups 相关
  saveGroupResult,
  getGroupHistory,
  getGroupDetail,
  deleteGroupResult,
  
  // 辅助函数
  getLevelDesc,
  getLevelColor,
  getPositionName,
  formatGroupResultForSave,
  
  // 用户相关
  getUserInfo,
  updateUserInfo,
  
  // 团队成员相关
  getTeamMembersDetail
}
