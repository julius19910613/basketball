/**
 * Phase 0+1 自动化测试（简化版）
 * 只测试基础功能
 */

import path from 'path';
import automator from 'miniprogram-automator';

export {}

const DEFAULT_CLI_PATH =
  '/Applications/wechatwebdevtools.app/Contents/MacOS/cli'

type MiniProgramPage = {
  waitFor: (timeout: number) => Promise<void>
}

type MiniProgramInstance = {
  close: () => Promise<void>
  switchTab: (pagePath: string) => Promise<MiniProgramPage>
}

// 需本机已装微信开发者工具；未设置时跳过，避免 CI / 无 GUI 环境失败
const runLaunchSuite = process.env.E2E_LAUNCH === '1'
const describeLaunch = runLaunchSuite ? describe : describe.skip

describeLaunch('Phase 0+1 基础测试（launch，需 E2E_LAUNCH=1）', () => {
  let miniProgram: MiniProgramInstance | undefined

  beforeAll(async (): Promise<void> => {
    const cliPath = process.env.WECHAT_DEVTOOLS_CLI || DEFAULT_CLI_PATH
    const projectPath =
      process.env.MINIPROGRAM_PROJECT_PATH || path.join(__dirname, '..')
    console.log('🚀 启动开发者工具...')
    miniProgram = await automator.launch({
      cliPath,
      projectPath
    }) as MiniProgramInstance
    console.log('✅ 开发者工具已启动')
  }, 90000) // 90 秒超时

  afterAll(async (): Promise<void> => {
    if (miniProgram) {
      console.log('🔚 关闭开发者工具...')
      await miniProgram.close()
    }
  })

  test('首页应该正常加载', async (): Promise<void> => {
    console.log('📄 打开首页...')
    // 首页为 tabBar 页，优先 switchTab；与 reLaunch 相比更贴近真实路由行为
    const page = await miniProgram!.switchTab('/pages/index/index')
    await page.waitFor(1000)
    
    console.log('✅ 首页加载成功')
    expect(page).toBeDefined()
  }, 30000)
})
