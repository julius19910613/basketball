const automator = require('miniprogram-automator')

async function testPorts() {
  // 尝试常见端口
  const ports = [9420, 55998, 20046, 9421, 9422, 3000]
  let connected = false
  
  for (let i = 0; i < ports.length; i++) {
    const port = ports[i]
    try {
      process.stdout.write(`尝试连接 ws://localhost:${port}... `)
      const miniProgram = await automator.connect({
        wsEndpoint: `ws://localhost:${port}`,
        timeout: 3000
      })
      console.log('✅ 成功！')
      connected = true
      await miniProgram.close()
      return
    } catch (e) {
      console.log(`❌ (${e.message.substring(0, 50)})`)
    }
  }
  
  // 所有端口都失败，尝试 launch
  if (!connected) {
    console.log('\n⚠️ 所有端口连接失败，尝试 launch...')
    try {
      const miniProgram = await automator.launch({
        cliPath: '/Applications/wechatwebdevtools.app/Contents/MacOS/cli',
        projectPath: '/Users/ppt/Projects/basketball'
      })
      console.log('✅ Launch 成功！')
      await miniProgram.close()
    } catch (e) {
      console.log('❌ Launch 失败:', e.message)
    }
  }
}

// 设置总超时
setTimeout(() => {
  console.log('\n⏰ 超时退出')
  process.exit(1)
}, 30000)

testPorts().catch(console.error)
