/**
 * 比赛数据导入脚本
 * 用于向 CloudBase 插入一场示例比赛数据
 *
 * 使用方式：
 * 1. 确保 .env 文件包含 CLOUDBASE_ENV_ID, CLOUDBASE_SECRET_ID, CLOUDBASE_SECRET_KEY
 * 2. 运行：node scripts/seed-match.js
 */

const https = require('https');
const crypto = require('crypto');

// ============ 配置 ============
const ENV_ID = process.env.CLOUDBASE_ENV_ID || 'fanchen-2gkerrmcf3aee832';
const SECRET_ID = process.env.CLOUDBASE_SECRET_ID || '';
const SECRET_KEY = process.env.CLOUDBASE_SECRET_KEY || '';

// ============ CloudBase API Helper ============

function sha1(str) {
  return crypto.createHash('sha1').update(str).digest('hex');
}

async function getAccessToken() {
  if (!SECRET_ID || !SECRET_KEY) {
    throw new Error('缺少 CLOUDBASE_SECRET_ID 或 CLOUDBASE_SECRET_KEY');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = Math.floor(Math.random() * 1000000);
  const str = `a=${SECRET_ID}&k=${SECRET_ID}&t=${timestamp}&n=${nonce}&e=2592000`;
  const signature = sha1(str);

  return { timestamp, nonce, signature };
}

async function cloudbaseRequest(action, data) {
  const { timestamp, nonce, signature } = await getAccessToken();

  const payload = JSON.stringify({
    env: ENV_ID,
    ...data
  });

  const body = JSON.stringify(payload);

  // 使用微信云开发 REST API
  const url = `https://tcb-admin.tencent.com/admin/v2/tcb/${action}?access_token=mock`;

  return new Promise((resolve, reject) => {
    // 实际使用时替换为正确的 API
    console.log('Request:', action, payload);
    resolve({ status: 'ok' });
  });
}

// ============ 查询现有球员 ============

async function queryPlayers() {
  console.log('\n📋 查询现有球员...\n');
  console.log('提示：请在微信开发者工具中手动查询 players 集合，');
  console.log('或者在 CloudBase 控制台中查看球员列表，记录 playerId 备用。\n');
  console.log('示例 JSON 数据如下 —— 导入时请将 playerId 替换为实际 ID。\n');

  // 输出示例数据结构（playerId 留空待填）
  console.log('========== 示例 playerStats 结构 ==========');
  console.log(JSON.stringify(generateMatchData(['<替换为球员A的ID>', '<替换为球员B的ID>']), null, 2));
}

// ============ 生成比赛数据 ============

function calcFgPct(made, attempted) {
  const a = Number(attempted) || 0;
  if (!a) return 0;
  return Math.round((Number(made) / a) * 1000) / 10;
}

function generateMatchData(playerIds) {
  if (playerIds.length < 4) {
    throw new Error('至少需要 4 名球员 ID');
  }

  // 分配球员到两队（假设 10 人：5v5）
  const teamA = playerIds.slice(0, Math.ceil(playerIds.length / 2));
  const teamB = playerIds.slice(Math.ceil(playerIds.length / 2));

  // 每节比分（模拟真实比赛，总分约 80-100）
  const quarters = [
    { quarter: 1, scoreUs: 22, scoreOpponent: 18 },
    { quarter: 2, scoreUs: 20, scoreOpponent: 24 },
    { quarter: 3, scoreUs: 18, scoreOpponent: 22 },
    { quarter: 4, scoreUs: 21, scoreOpponent: 20 }
  ];

  const scoreUs = quarters.reduce((s, q) => s + q.scoreUs, 0);
  const scoreOpponent = quarters.reduce((s, q) => s + q.scoreOpponent, 0);
  const result = scoreUs > scoreOpponent ? 'win' : scoreUs < scoreOpponent ? 'loss' : 'draw';

  // 球员数据（按 teamA 的 5 人生成）
  const playerStats = teamA.map((playerId, i) => {
    const points = [18, 14, 12, 10, 8][i] || 6;
    const rebounds = [8, 6, 5, 4, 3][i] || 2;
    const assists = [4, 5, 3, 2, 3][i] || 1;
    const steals = [2, 1, 3, 1, 0][i] || 0;
    const blocks = [1, 2, 0, 1, 0][i] || 0;
    const turnovers = [2, 1, 3, 2, 1][i] || 0;
    const fouls = [3, 4, 2, 3, 2][i] || 0;
    const shotsMade = Math.floor(points / 2);
    const shotsAttempted = Math.floor(shotsMade / 0.5);
    const threePtMade = [2, 1, 2, 1, 1][i] || 0;
    const threePtAttempted = [5, 3, 5, 3, 2][i] || 0;
    const ftNeeded = Math.max(0, points - shotsMade * 2 - threePtMade);
    const ftAttempted = Math.max(ftNeeded, Math.floor(ftNeeded * 1.5));

    const isPlaceholder = playerId.startsWith('placeholder_');
    return {
      playerId,
      nickname: isPlaceholder ? `球员${i + 1}` : ['张三', '李四', '王五', '赵六', '孙七'][i] || `球员${i + 1}`,
      position: ['PG', 'SG', 'SF', 'PF', 'C'][i] || 'F',
      played: true,
      points,
      rebounds,
      assists,
      steals,
      blocks,
      turnovers,
      fouls,
      shotsMade,
      shotsAttempted,
      threePtMade,
      threePtAttempted,
      ftMade: ftNeeded,
      ftAttempted,
      fgPct: calcFgPct(shotsMade, shotsAttempted),
      threePtPct: calcFgPct(threePtMade, threePtAttempted),
      ftPct: calcFgPct(ftNeeded, ftAttempted)
    };
  });

  return {
    teamId: '',
    teamNames: ['A队', 'B队'],
    matchDate: '2026-04-26',
    startTime: '14:00',
    endTime: '15:30',
    location: '室内篮球馆',
    matchType: 'friendly',
    status: 'finalized',
    isGroupingLocked: true,
    selectedPlayerIds: playerIds,
    grouping: {
      teams: [
        { teamName: 'A队', playerIds: teamA },
        { teamName: 'B队', playerIds: teamB }
      ],
      lockedAt: new Date().toISOString()
    },
    scoreUs,
    scoreOpponent,
    quarters,
    playerStats,
    highlights: '一场激烈的友谊赛，双方打得有来有回，最终 A 队 81:84 惜败。',
    result,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// ============ 主程序 ============

async function main() {
  console.log('🏀 Basketball 小程序 — 比赛数据导入工具\n');
  console.log(`CloudBase 环境：${ENV_ID}\n`);

  const args = process.argv.slice(2);
  const hasRealIds = args.length > 0;
  const playerIds = hasRealIds ? args : [
    'placeholder_player_id_01',
    'placeholder_player_id_02',
    'placeholder_player_id_03',
    'placeholder_player_id_04',
    'placeholder_player_id_05',
    'placeholder_player_id_06'
  ];

  if (!hasRealIds) {
    console.log('⚠️  未提供球员 ID，使用占位符生成模板\n');
    console.log('请先查询 players 集合获取真实 ID，再重新运行：');
    console.log('  node scripts/seed-match.js <id1> <id2> <id3> <id4> <id5> <id6>\n');
  }

  console.log(`使用 ${playerIds.length} 名球员生成比赛数据...\n`);

  try {
    const matchData = generateMatchData(playerIds);
    console.log('========== 生成的比赛数据 ==========\n');
    console.log(JSON.stringify(matchData, null, 2));

    console.log('\n\n========== CloudBase 导入说明 ==========');
    console.log('1. 打开微信开发者工具');
    console.log('2. 左侧菜单 → 云开发 → 数据库');
    console.log('3. 选择 matches 集合 → 添加记录');
    console.log('4. 粘贴上方 JSON 数据（移除 _id 和 createdAt/updatedAt，云端自动生成）');
    console.log('5. 每位球员还需要在 player_match_stats 集合中添加对应的统计记录\n');

    // 同时生成 player_match_stats 数据
    console.log('========== player_match_stats 数据（每人一条）==========');
    const statsData = matchData.playerStats.map((stat) => ({
      matchId: '<导入后复制的match记录_id>',
      playerId: stat.playerId,
      nickname: stat.nickname,
      position: stat.position,
      points: stat.points,
      rebounds: stat.rebounds,
      assists: stat.assists,
      steals: stat.steals,
      blocks: stat.blocks,
      turnovers: stat.turnovers,
      fouls: stat.fouls,
      shotsMade: stat.shotsMade,
      shotsAttempted: stat.shotsAttempted,
      threePtMade: stat.threePtMade,
      threePtAttempted: stat.threePtAttempted,
      ftMade: stat.ftMade,
      ftAttempted: stat.ftAttempted,
      fgPct: stat.fgPct,
      result: matchData.result,
      matchDate: matchData.matchDate,
      createdAt: new Date().toISOString()
    }));

    console.log(JSON.stringify(statsData, null, 2));

    // 保存到文件
    const fs = require('fs');
    const output = {
      match: matchData,
      playerMatchStats: statsData,
      importInstructions: [
        '1. 先在 CloudBase 控制台打开 players 集合，记录所有球员的 _id',
        '2. 将脚本中的 playerId 替换为实际球员 ID',
        '3. 再次运行脚本获取完整 JSON',
        '4. 在 matches 集合中创建一条记录（粘贴 match 对象）',
        '5. 在 player_match_stats 集合中创建每人一条记录（粘贴 playerMatchStats 数组）',
        '6. 将 match 记录的 _id 填入 player_match_stats 的 matchId 字段'
      ]
    };

    fs.writeFileSync('./seed-output.json', JSON.stringify(output, null, 2));
    console.log('\n✅ 数据已保存到 ./seed-output.json');

  } catch (err) {
    console.error('❌ 错误：', err.message);
    process.exit(1);
  }
}

main();
