import automator from 'miniprogram-automator'

type Automator = typeof import('miniprogram-automator')
type MiniProgram = Awaited<ReturnType<Automator['connect']>>
type ErrorWithMessage = {
  message: string
}

async function testConnection(): Promise<void> {
  console.log('🔗 开始测试连接...')

  try {
    // 尝试连接
    const miniProgram: MiniProgram = await automator.connect({
      wsEndpoint: 'ws://localhost:9420'
    })
    console.log('✅ 连接成功！')

    // 等待 2 秒，看连接是否稳定
    console.log('⏱️  等待 2 秒测试连接稳定性...')
    await new Promise<void>((resolve: () => void) => setTimeout(resolve, 2000))

    // 尝试获取版本信息（不涉及页面操作）
    console.log('📊 尝试获取开发者工具信息...')
    const info: unknown = await miniProgram.send('Tool.getInfo', {})
    console.log('✅ 开发者工具信息:', info)

    console.log('🔚 关闭连接...')
    await miniProgram.close()
    console.log('✅ 测试完成！')
  } catch (error) {
    const typedError = error as ErrorWithMessage
    console.error('❌ 测试失败:', typedError.message)
    console.error('完整错误:', error)
    process.exit(1)
  }
}

void testConnection()
