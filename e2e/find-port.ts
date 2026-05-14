import automator = require('miniprogram-automator')

interface ConnectOptions {
  wsEndpoint: string
  timeout: number
}

interface LaunchOptions {
  cliPath: string
  projectPath: string
}

interface MiniProgram {
  close(): Promise<void>
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

async function testPorts(): Promise<void> {
  // 尝试常见端口
  const ports: number[] = [9420, 55998, 20046, 9421, 9422, 3000]
  let connected: boolean = false

  for (let i = 0; i < ports.length; i++) {
    const port: number = ports[i]
    try {
      process.stdout.write(`尝试连接 ws://localhost:${port}... `)
      const miniProgram: MiniProgram = await automator.connect({
        wsEndpoint: `ws://localhost:${port}`,
        timeout: 3000
      } as ConnectOptions)
      console.log('✅ 成功！')
      connected = true
      await miniProgram.close()
      return
    } catch (e: unknown) {
      console.log(`❌ (${getErrorMessage(e).substring(0, 50)})`)
    }
  }

  // 所有端口都失败，尝试 launch
  if (!connected) {
    console.log('\n⚠️ 所有端口连接失败，尝试 launch...')
    try {
      const miniProgram: MiniProgram = await automator.launch({
        cliPath: '/Applications/wechatwebdevtools.app/Contents/MacOS/cli',
        projectPath: '/Users/ppt/Projects/basketball'
      } as LaunchOptions)
      console.log('✅ Launch 成功！')
      await miniProgram.close()
    } catch (e: unknown) {
      console.log('❌ Launch 失败:', getErrorMessage(e))
    }
  }
}

// 设置总超时
setTimeout((): void => {
  console.log('\n⏰ 超时退出')
  process.exit(1)
}, 30000)

testPorts().catch(console.error)
