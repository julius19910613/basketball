const automator = require('miniprogram-automator')

async function testConnection() {
  console.log('🔗 开始测试连接...')
  
  try {
    // 尝试连接
    const miniProgram = await automator.connect({
      wsEndpoint: 'ws://localhost:9420'
    })
    console.log('✅ 连接成功！')
    
    // 等待 2 秒，看连接是否稳定
    console.log('⏱️  等待 2 秒测试连接稳定性...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 尝试获取版本信息（不涉及页面操作）
    console.log('📊 尝试获取开发者工具信息...')
    const info = await miniProgram.send('Tool.getInfo', {})
    console.log('✅ 开发者工具信息:', info)
    
    console.log('🔚 关闭连接...')
    await miniProgram.close()
    console.log('✅ 测试完成！')
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    console.error('完整错误:', error)
    process.exit(1)
  }
}

testConnection()
