const automator = require('miniprogram-automator')

async function testLaunch() {
  console.log('🚀 开始启动开发者工具...')
  console.log('📂 项目路径: /Users/ppt/Projects/basketball')
  console.log('🔧 CLI 路径: /Applications/wechatwebdevtools.app/Contents/MacOS/cli')
  
  try {
    const startTime = Date.now()
    
    // 使用 launch 方式（自动处理所有配置）
    const miniProgram = await automator.launch({
      cliPath: '/Applications/wechatwebdevtools.app/Contents/MacOS/cli',
      projectPath: '/Users/ppt/Projects/basketball'
    })
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`✅ 开发者工具已启动（耗时 ${elapsed}s）`)
    
    // 等待一下让工具完全初始化
    console.log('⏳ 等待工具初始化...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 尝试打开首页
    console.log('📄 尝试打开首页...')
    const page = await miniProgram.reLaunch('/pages/index/index')
    console.log('✅ 首页已打开')
    
    // 等待页面加载
    await page.waitFor(1000)
    console.log('✅ 页面加载完成')
    
    // 关闭
    console.log('🔚 关闭开发者工具...')
    await miniProgram.close()
    console.log('✅ 测试完成！')
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    console.error('\n💡 可能的原因:')
    console.error('1. 微信开发者工具未安装或路径错误')
    console.error('2. 项目路径不存在')
    console.error('3. macOS 权限问题（尝试手动打开开发者工具）')
    console.error('4. 开发者工具已在运行（尝试先关闭）')
    process.exit(1)
  }
}

// 设置超时
setTimeout(() => {
  console.log('\n⏰ 测试超时（90秒）')
  process.exit(1)
}, 90000)

testLaunch()
