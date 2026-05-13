/**
 * Mock 数据统一导出
 */

import mockPlayers = require('./mock-players')
import mockGroups = require('./mock-groups')

export = {
  ...mockPlayers,
  ...mockGroups
}
