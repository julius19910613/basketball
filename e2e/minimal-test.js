const automator = require('miniprogram-automator')
const fs = require('fs')

const path = require('path')

async function minimalTest() {
  const projectPath = '/Users/ppt/Projects/basketball'
  
  console.log('🚀 启动开发者工具...')
  console.log('📂 项目路径:', projectPath)
  
  const cliPath = '/Applications/wechatwebdevtools.app/Contents/MacOS/cli'
  
  // 检查 CLI 是否存在
  if (!fs.existsSync(cliPath)) {
    console.log('❌ CLI 不存在')
    console.log('   请确认微信开发者工具已安装')
    process.exit(1)
  }
  
  console.log('✅ CLI 存在')
  
  try {
    const miniProgram = await automator.launch({
      cliPath: cliPath,
      projectPath: projectPath
    })
    
    console.log('✅ 开发者工具已连接')
    console.log('📊 连接信息:')
    console.log('   - WebSocket 端点:', miniProgram.wsEndpoint || 'unknown')
    
    // 不做任何页面操作，只保持连接
    console.log('⏳ 保持连接 10 秒...')
    await new Promise(resolve => setTimeout(resolve, 10000))
    
    console.log('✅ 连接稳定')
    console.log('🔚 关闭连接...')
    await miniProgram.close()
    console.log('✅ 测试完成!')
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    console.error('错误堆栈:', error.stack)
    process.exit(1)
  }
}

minimalTest()
