import automator = require('miniprogram-automator')

interface LaunchOptions {
  cliPath: string
  projectPath: string
}

interface Page {
  data(): Promise<unknown>
}

interface MiniProgram {
  close(): Promise<void>
  reLaunch(path: string): Promise<Page>
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

async function testPageLoad(): Promise<void> {
  console.log('🚀 启动开发者工具...')

  let miniProgram: MiniProgram | undefined

  try {
    miniProgram = await automator.launch({
      cliPath: '/Applications/wechatwebdevtools.app/Contents/MacOS/cli',
      projectPath: '/Users/ppt/Projects/basketball'
    } as LaunchOptions)

    console.log('✅ 已连接')

    console.log('📄 尝试打开首页...')
    console.log('   路径: pages/index/index')
    console.log('   超时: 60 秒')

    // 增加超时到 60 秒
    const page: Page = await Promise.race([
      miniProgram.reLaunch('/pages/index/index'),
      new Promise<never>((_resolve, reject): void => {
        setTimeout((): void => reject(new Error('页面加载超时(60s)')), 60000)
      })
    ])

    console.log('✅ 首页加载成功!')

    // 获取页面数据
    console.log('📊 获取页面数据...')
    const data: unknown = await page.data()
    console.log('   页面数据:', JSON.stringify(data, null, 2).substring(0, 200))

    console.log('🔚 关闭...')
    await miniProgram.close()
    console.log('✅ 测试完成!')

  } catch (error: unknown) {
    console.error('❌ 失败:', getErrorMessage(error))
    if (miniProgram) {
      try {
        await miniProgram.close()
      } catch (e: unknown) {
        // 忽略关闭错误
      }
    }
    process.exit(1)
  }
}

testPageLoad()
