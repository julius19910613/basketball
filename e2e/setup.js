// E2E 测试全局配置（与 jest.e2e.config.js 中 testTimeout 一致，避免拉起开发者工具时超时）
jest.setTimeout(120000);

// 全局错误处理
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error);
  throw error;
});
