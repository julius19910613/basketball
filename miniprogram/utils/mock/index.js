/**
 * Mock 数据统一导出
 */

const mockPlayers = require('./mock-players')
const mockGroups = require('./mock-groups')

module.exports = {
  ...mockPlayers,
  ...mockGroups
}
