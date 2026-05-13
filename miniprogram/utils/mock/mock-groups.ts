/**
 * Mock 分组历史记录
 * 用于随机分组功能开发测试
 */

interface GroupTeamData {
  name: string;
  players: string[];
  avgLevel: number;
}

interface GroupRecordBase {
  _id: string;
  createTime: string;
  playerCount: number;
  groupCount: number;
}

interface GroupRecordInput {
  playerCount: number;
  groupCount: number;
  [key: string]: unknown;
}

interface GroupRecord extends GroupRecordBase {
  [key: string]: unknown;
}

interface PlayerLike {
  _id: string;
  [key: string]: unknown;
}

interface DisplayTeam {
  name: string;
  players: PlayerLike[];
  avgLevel: number;
}

interface DisplayGroup {
  _id: string;
  createTime: string;
  teams: DisplayTeam[];
}

const mockGroupHistory: GroupRecord[] = [
  {
    _id: 'g1',
    createTime: '2024-05-20 14:30:00',
    playerCount: 10,
    groupCount: 2,
    teamA: {
      name: 'A队',
      players: ['p1', 'p4', 'p7', 'p10', 'p15'],
      avgLevel: 3.4
    },
    teamB: {
      name: 'B队',
      players: ['p2', 'p5', 'p8', 'p11', 'p16'],
      avgLevel: 3.2
    }
  },
  {
    _id: 'g2',
    createTime: '2024-05-18 16:00:00',
    playerCount: 12,
    groupCount: 2,
    teamA: {
      name: '红队',
      players: ['p1', 'p6', 'p9', 'p12', 'p15', 'p18'],
      avgLevel: 3.0
    },
    teamB: {
      name: '蓝队',
      players: ['p2', 'p3', 'p7', 'p10', 'p16', 'p19'],
      avgLevel: 3.1
    }
  },
  {
    _id: 'g3',
    createTime: '2024-05-15 10:00:00',
    playerCount: 15,
    groupCount: 3,
    teamA: {
      name: 'A队',
      players: ['p1', 'p4', 'p7', 'p10', 'p13'],
      avgLevel: 3.4
    },
    teamB: {
      name: 'B队',
      players: ['p2', 'p5', 'p8', 'p11', 'p14'],
      avgLevel: 3.4
    },
    teamC: {
      name: 'C队',
      players: ['p3', 'p6', 'p9', 'p12', 'p15'],
      avgLevel: 3.2
    }
  }
]

/**
 * 获取所有分组历史
 * @returns {Array} 分组历史列表
 */
function getGroupHistory(): GroupRecord[] {
  return mockGroupHistory
}

/**
 * 根据 ID 获取分组详情
 * @param {string} groupId 分组 ID
 * @returns {Object|null} 分组详情
 */
function getGroupById(groupId: string): GroupRecord | null {
  return mockGroupHistory.find((g: GroupRecord) => g._id === groupId) || null
}

/**
 * 添加分组记录（仅 Mock，不会持久化）
 * @param {Object} groupData 分组数据
 * @returns {Object} 新增的分组记录
 */
function addGroupRecord(groupData: GroupRecordInput): GroupRecord {
  const newGroup: GroupRecord = {
    _id: `g${mockGroupHistory.length + 1}`,
    createTime: new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(/\//g, '-'),
    ...groupData
  }
  mockGroupHistory.unshift(newGroup)
  return newGroup
}

/**
 * 格式化分组数据用于显示
 * @param {Object} group 分组数据
 * @param {Array} players 所有球员数据
 * @returns {Object} 格式化后的分组数据
 */
function formatGroupForDisplay(group: GroupRecord, players: PlayerLike[]): DisplayGroup {
  const result: DisplayGroup = {
    _id: group._id,
    createTime: group.createTime,
    teams: []
  }

  // 处理每个队伍
  const teamKeys = Object.keys(group).filter((key: string) => key.startsWith('team'))

  teamKeys.forEach((key: string) => {
    const team = group[key] as GroupTeamData | undefined
    if (!team) {
      return
    }

    const teamPlayers = team.players.map((playerId: string) => {
      const player = players.find((p: PlayerLike) => p._id === playerId)
      return player ? { ...player } : null
    }).filter((p: PlayerLike | null): p is PlayerLike => p !== null)

    result.teams.push({
      name: team.name,
      players: teamPlayers,
      avgLevel: team.avgLevel
    })
  })

  return result
}

export = {
  mockGroupHistory,
  getGroupHistory,
  getGroupById,
  addGroupRecord,
  formatGroupForDisplay
}
