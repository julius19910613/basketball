/**
 * 云函数环境路由公共模块
 * 根据调用方传入的 _envVersion 路由到对应集合
 */

// 集合名称映射
const COLLECTION_MAP = {
  develop: {
    players: 'dev_players',
    teams: 'dev_teams',
    matches: 'dev_matches',
    users: 'dev_users',
    player_match_stats: 'dev_player_match_stats',
    random_groups: 'dev_random_groups'
  },
  trial: {
    players: 'dev_players',
    teams: 'dev_teams',
    matches: 'dev_matches',
    users: 'dev_users',
    player_match_stats: 'dev_player_match_stats',
    random_groups: 'dev_random_groups'
  },
  release: {
    players: 'players',
    teams: 'teams',
    matches: 'matches',
    users: 'users',
    player_match_stats: 'player_match_stats',
    random_groups: 'random_groups'
  }
}

/**
 * 获取指定环境版本的集合名
 * @param {string} name - 业务集合名
 * @param {string} envVersion - 环境版本 (develop/trial/release)
 * @returns {string}
 */
function getCollection(name, envVersion) {
  const version = envVersion || 'release'
  const map = COLLECTION_MAP[version] || COLLECTION_MAP.release
  return map[name] || name
}

/**
 * 获取完整集合映射表
 * @param {string} envVersion
 * @returns {Object}
 */
function getCollections(envVersion) {
  const version = envVersion || 'release'
  return COLLECTION_MAP[version] || COLLECTION_MAP.release
}

module.exports = {
  getCollection,
  getCollections
}
