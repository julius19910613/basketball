const automator = require('miniprogram-automator') as typeof import('miniprogram-automator')
const fs = require('fs') as typeof import('fs')

const path = require('path') as typeof import('path')

export {}

type LaunchResult = {
  wsEndpoint?: string
  close: () => Promise<void>
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function getErrorStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined
}

async function minimalTest(): Promise<void> {
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
    }) as LaunchResult
    
    console.log('✅ 开发者工具已连接')
    console.log('📊 连接信息:')
    console.log('   - WebSocket 端点:', miniProgram.wsEndpoint || 'unknown')
    
    // 不做任何页面操作，只保持连接
    console.log('⏳ 保持连接 10 秒...')
    await new Promise<void>(resolve => setTimeout(resolve, 10000))
    
    console.log('✅ 连接稳定')
    console.log('🔚 关闭连接...')
    await miniProgram.close()
    console.log('✅ 测试完成!')
    
  } catch (error) {
    console.error('❌ 测试失败:', getErrorMessage(error))
    console.error('错误堆栈:', getErrorStack(error))
    process.exit(1)
  }
}

void minimalTest()
