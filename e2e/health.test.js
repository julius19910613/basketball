/**
 * 不依赖微信开发者工具的占位用例，用于确认 Jest E2E 配置可执行。
 * 真实自动化见 phase01-simple / phase01（需环境变量开启）。
 */
describe('e2e harness', () => {
  it('jest e2e config loads', () => {
    expect(1 + 1).toBe(2)
  })
})
