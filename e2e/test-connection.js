const automator = require('miniprogram-automator')

async function test() {
  try {
    console.log('正在连接微信开发者工具...')
    const miniProgram = await automator.launch({
      cliPath: '/Applications/wechatwebdevtools.app/Contents/MacOS/cli',
      projectPath: '/Users/ppt/Projects/basketball'
    })
    
    console.log('✅ 连接成功！')
    
    // 测试打开首页
    console.log('正在打开首页...')
    const page = await miniProgram.reLaunch('/pages/index/index')
    await page.waitFor(1000)
    console.log('✅ 首页加载成功！')
    
    // 关闭
    await miniProgram.close()
    console.log('✅ 测试完成！')
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    process.exit(1)
  }
}

test()
