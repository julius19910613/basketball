/**
 * 环境配置模块
 * 单环境内用集合前缀区分开发(dev)与生产(release)
 */

/** 支持的环境版本 */
type EnvVersion = 'develop' | 'trial' | 'release'

/** 集合名称映射表 */
type CollectionMap = Record<string, string>

/** 微信全局配置对象（小程序运行时注入） */
declare const __wxConfig: {
  envVersion?: EnvVersion
}

// 集合名称映射：develop/trial → dev_xxx，release → xxx
const COLLECTION_MAP: Record<EnvVersion, CollectionMap> = {
  develop: {
    activities: 'dev_activities',
    activity_registrations: 'dev_activity_registrations',
    players: 'dev_players',
    teams: 'dev_teams',
    matches: 'dev_matches',
    users: 'dev_users',
    player_match_stats: 'dev_player_match_stats',
    random_groups: 'dev_random_groups'
  },
  trial: {
    activities: 'dev_activities',
    activity_registrations: 'dev_activity_registrations',
    players: 'dev_players',
    teams: 'dev_teams',
    matches: 'dev_matches',
    users: 'dev_users',
    player_match_stats: 'dev_player_match_stats',
    random_groups: 'dev_random_groups'
  },
  release: {
    activities: 'activities',
    activity_registrations: 'activity_registrations',
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
 * @returns develop | trial | release
 */
function getEnvVersion(): EnvVersion {
  if (typeof __wxConfig !== 'undefined' && __wxConfig.envVersion) {
    return __wxConfig.envVersion
  }
  return 'develop'
}

/**
 * 根据当前环境获取对应集合名
 * @param name - 业务集合名（如 'players'）
 * @returns 实际集合名（如 'dev_players' 或 'players'）
 */
function getCollection(name: string): string {
  const env = getEnvVersion()
  const map = COLLECTION_MAP[env] || COLLECTION_MAP.release
  return map[name] || name
}

/**
 * 是否为开发环境
 * @returns true 表示当前为 develop 环境
 */
function isDev(): boolean {
  return getEnvVersion() === 'develop'
}

/** 环境配置对象 */
interface EnvConfig {
  version: EnvVersion
  collections: CollectionMap
  isDev: boolean
  logLevel: 'debug' | 'warn' | 'error'
}

/**
 * 获取当前环境完整配置
 * @returns 环境配置对象
 */
function getEnvConfig(): EnvConfig {
  const env = getEnvVersion()
  return {
    version: env,
    collections: COLLECTION_MAP[env] || COLLECTION_MAP.release,
    isDev: env === 'develop',
    logLevel: env === 'develop' ? 'debug' : (env === 'trial' ? 'warn' : 'error')
  }
}

export = {
  getCollection,
  getEnvVersion,
  getEnvConfig,
  isDev
}
