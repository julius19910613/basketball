// Jest 配置 - E2E 自动化测试
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/e2e/**/*.test.js'],
  // 多个用例同时连接/拉起开发者工具会冲突，必须串行
  maxWorkers: 1,
  testTimeout: 120000,
  setupFilesAfterEnv: ['./e2e/setup.js'],
  verbose: true,
  collectCoverage: false,
  // 不收集覆盖率（E2E 测试）
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/e2e/'
  ]
};
