/**
 * 环境配置模块
 * 单环境内用集合前缀区分开发(dev)与生产(release)
 */

// 集合名称映射：develop/trial → dev_xxx，release → xxx
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
 * 获取当前运行环境版本
 * @returns {string} develop | trial | release
 */
function getEnvVersion() {
  if (typeof __wxConfig !== 'undefined' && __wxConfig.envVersion) {
    return __wxConfig.envVersion
  }
  return 'develop'
}

/**
 * 根据当前环境获取对应集合名
 * @param {string} name - 业务集合名（如 'players'）
 * @returns {string} 实际集合名（如 'dev_players' 或 'players'）
 */
function getCollection(name) {
  const env = getEnvVersion()
  const map = COLLECTION_MAP[env] || COLLECTION_MAP.release
  return map[name] || name
}

/**
 * 是否为开发环境
 * @returns {boolean}
 */
function isDev() {
  return getEnvVersion() === 'develop'
}

/**
 * 获取当前环境完整配置
 * @returns {Object}
 */
function getEnvConfig() {
  const env = getEnvVersion()
  return {
    version: env,
    collections: COLLECTION_MAP[env] || COLLECTION_MAP.release,
    isDev: env === 'develop',
    logLevel: env === 'develop' ? 'debug' : (env === 'trial' ? 'warn' : 'error')
  }
}

module.exports = {
  getCollection,
  getEnvVersion,
  getEnvConfig,
  isDev
}
