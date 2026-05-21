import automator from 'miniprogram-automator'

type Automator = typeof import('miniprogram-automator')
type MiniProgram = Awaited<ReturnType<Automator['launch']>>
type Page = Awaited<ReturnType<MiniProgram['reLaunch']>>
type ErrorWithMessage = {
  message: string
}

async function test(): Promise<void> {
  try {
    console.log('正在连接微信开发者工具...')
    const miniProgram: MiniProgram = await automator.launch({
      cliPath: '/Applications/wechatwebdevtools.app/Contents/MacOS/cli',
      projectPath: '/Users/ppt/Projects/basketball'
    })

    console.log('✅ 连接成功！')

    // 测试打开首页
    console.log('正在打开首页...')
    const page: Page = await miniProgram.reLaunch('/pages/index/index')
    await page.waitFor(1000)
    console.log('✅ 首页加载成功！')

    // 关闭
    await miniProgram.close()
    console.log('✅ 测试完成！')
  } catch (error) {
    const typedError = error as ErrorWithMessage
    console.error('❌ 测试失败:', typedError.message)
    process.exit(1)
  }
}

void test()
