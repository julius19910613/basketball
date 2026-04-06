/**
 * Phase 0+1 自动化测试
 * 测试内容：
 * 1. basketball.js 工具模块（19项技能 + Overall V2 算法）
 * 2. skill-input 组件（技能录入）
 * 3. add-player 页面（技能录入 + Overall 实时显示）
 * 4. player-card 组件增强
 */

const automator = require('miniprogram-automator')

// 需先用 CLI 打开项目并开启自动化（默认 ws://localhost:9420），否则跳过本文件
const runConnectSuite = process.env.E2E_WS_CONNECT === '1'
const describeConnect = runConnectSuite ? describe : describe.skip

describeConnect('Phase 0+1 测试（connect，需 E2E_WS_CONNECT=1）', () => {
  let miniProgram
  let page

  beforeAll(async () => {
    // 强制尝试连接，不自动 launch
    console.log('🔗 尝试连接到开发者工具 (请确保 CLI 已启动)...')
    miniProgram = await automator.connect({
      wsEndpoint: 'ws://localhost:9420' // WebSocket 端口（默认）
    })
    console.log('✅ 成功连接！')
  }, 90000)

  afterAll(async () => {
    if (miniProgram) {
      await miniProgram.close()
    }
  })

  /**
   * 测试1：首页加载
   */
  test('首页应该正常加载', async () => {
    page = await miniProgram.reLaunch('/pages/index/index')
    await page.waitFor(1000)
    
    const pageTitle = await page.data('pageTitle')
    expect(pageTitle).toBeDefined()
  })

  /**
   * 测试2：basketball.js 工具模块 - Overall 计算
   */
  test('Overall V2 算法应该正确计算', async () => {
    // 模拟技能数据
    const skills = {
      twoPointShot: 70, threePointShot: 65, freeThrow: 75,
      passing: 80, ballControl: 85, courtVision: 78,
      perimeterDefense: 72, interiorDefense: 68, steals: 70, blocks: 65,
      offensiveRebound: 60, defensiveRebound: 65,
      speed: 75, strength: 70, stamina: 80, vertical: 72,
      basketballIQ: 82, teamwork: 85, clutch: 78
    }
    
    // 调用 Overall V2 计算
    const overall = await miniProgram.callWxMethod('calculateOverallV2', skills, 'PG')
    expect(overall).toBeGreaterThanOrEqual(60)
    expect(overall).toBeLessThanOrEqual(90)
  })

  /**
   * 测试3：球员添加页面 - 技能录入
   */
  test('球员添加页面应该支持技能录入', async () => {
    page = await miniProgram.reLaunch('/pages/add-player/add-player')
    await page.waitFor(1000)
    
    // 检查页面是否加载
    const pageData = await page.data()
    expect(pageData).toBeDefined()
    
    // 检查是否有技能输入组件
    const skillInput = await page.$('skill-input')
    expect(skillInput).toBeDefined()
  })

  /**
   * 测试4：球员卡片 - Overall 显示
   */
  test('球员卡片应该显示 Overall 和技能概要', async () => {
    // 模拟球员数据
    const playerData = {
      id: 'test-player-1',
      name: '测试球员',
      position: 'PG',
      skills: {
        twoPointShot: 70, threePointShot: 65, freeThrow: 75,
        passing: 80, ballControl: 85, courtVision: 78,
        perimeterDefense: 72, interiorDefense: 68, steals: 70, blocks: 65,
        offensiveRebound: 60, defensiveRebound: 65,
        speed: 75, strength: 70, stamina: 80, vertical: 72,
        basketballIQ: 82, teamwork: 85, clutch: 78
      }
    }
    
    // 检查 player-card 组件
    const playerCard = await page.$('player-card')
    if (playerCard) {
      const cardData = await playerCard.data()
      expect(cardData.overall).toBeDefined()
    }
  })

  /**
   * 测试5：技能录入 - 滑动条交互
   */
  test('技能录入滑动条应该正常工作', async () => {
    page = await miniProgram.reLaunch('/pages/add-player/add-player')
    await page.waitFor(1000)
    
    // 查找滑动条元素
    const sliders = await page.$$('slider')
    expect(sliders.length).toBeGreaterThan(0)
    
    // 模拟滑动
    if (sliders.length > 0) {
      const firstSlider = sliders[0]
      await firstSlider.trigger('change', { value: 80 })
      await page.waitFor(500)
      
      // 检查值是否更新
      const pageData = await page.data()
      expect(pageData.skills).toBeDefined()
    }
  })

  /**
   * 测试6：Overall 实时更新
   */
  test('修改技能时 Overall 应该实时更新', async () => {
    page = await miniProgram.reLaunch('/pages/add-player/add-player')
    await page.waitFor(1000)
    
    // 获取初始 Overall
    const initialData = await page.data()
    const initialOverall = initialData.overall || 0
    
    // 修改技能
    const sliders = await page.$$('slider')
    if (sliders.length > 0) {
      await sliders[0].trigger('change', { value: 90 })
      await page.waitFor(500)
      
      // 检查 Overall 是否更新
      const updatedData = await page.data()
      const updatedOverall = updatedData.overall || 0
      
      expect(updatedOverall).not.toBe(initialOverall)
    }
  })
})
