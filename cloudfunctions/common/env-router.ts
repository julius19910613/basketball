/**
 * 云函数环境路由公共模块
 * 根据调用方传入的 _envVersion 路由到对应集合
 */

/** 支持的环境版本 */
type EnvVersion = 'develop' | 'trial' | 'release'

/** 集合名称映射表 */
type CollectionMap = Record<string, string>

/** 环境到集合映射 */
const COLLECTION_MAP: Record<EnvVersion, CollectionMap> = {
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
 * @param name - 业务集合名
 * @param envVersion - 环境版本 (develop/trial/release)
 * @returns 实际集合名
 */
function getCollection(name: string, envVersion?: string): string {
  const version = (envVersion || 'release') as EnvVersion
  const map = COLLECTION_MAP[version] || COLLECTION_MAP.release
  return map[name] || name
}

/**
 * 获取完整集合映射表
 * @param envVersion - 环境版本
 * @returns 集合映射表
 */
function getCollections(envVersion?: string): CollectionMap {
  const version = (envVersion || 'release') as EnvVersion
  return COLLECTION_MAP[version] || COLLECTION_MAP.release
}

export default {
  getCollection,
  getCollections
}
