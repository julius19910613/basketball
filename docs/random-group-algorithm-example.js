/**
 * 随机分组算法示例代码
 * 本文件展示档位平衡分组的完整实现逻辑
 */

// ============================================
// 1. 档位平衡分组核心算法
// ============================================

/**
 * Fisher-Yates 洗牌算法
 * @param {Array} array - 待洗牌的数组
 * @returns {Array} - 洗牌后的新数组
 */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 档位平衡分组算法
 * @param {Array} members - 参与分组的成员列表
 * @returns {Object} - 分组结果 { teamA, teamB, skillSummary }
 */
function balancedGroupBySkillLevel(members) {
  // 1. 按档位分组
  const skillGroups = {
    5: [], // 核心球员
    4: [], // 主力球员
    3: [], // 常规球员
    2: []  // 新手球员
  };
  
  members.forEach(member => {
    const level = member.skillLevel || 3; // 未设置默认为3档
    if (skillGroups[level]) {
      skillGroups[level].push(member);
    }
  });
  
  // 2. 验证每个档位是否为偶数
  for (let level = 5; level >= 2; level--) {
    const count = skillGroups[level].length;
    if (count % 2 !== 0) {
      throw new Error(
        `${level}档人数为${count}（奇数），无法平衡分组。请调整参与球员或修改档位设置。`
      );
    }
  }
  
  // 3. 初始化两队
  const teamA = [];
  const teamB = [];
  
  // 4. 对每个档位进行随机均分（从高到低）
  for (let level = 5; level >= 2; level--) {
    const group = shuffle(skillGroups[level]); // 随机洗牌
    const half = group.length / 2;
    
    // 均分到两队
    teamA.push(...group.slice(0, half));
    teamB.push(...group.slice(half));
  }
  
  // 5. 按档位（降序）和球衣号码（升序）排序
  const sortBySkillAndNumber = (a, b) => {
    // 先按档位降序（5档在前）
    if (b.skillLevel !== a.skillLevel) {
      return b.skillLevel - a.skillLevel;
    }
    // 同档位按号码升序
    return (a.number || 0) - (b.number || 0);
  };
  
  teamA.sort(sortBySkillAndNumber);
  teamB.sort(sortBySkillAndNumber);
  
  // 6. 生成档位统计
  const skillSummary = {
    level5: skillGroups[5].length,
    level4: skillGroups[4].length,
    level3: skillGroups[3].length,
    level2: skillGroups[2].length,
    total: members.length
  };
  
  return {
    teamA,
    teamB,
    skillSummary
  };
}

/**
 * 生成队伍的档位分布统计
 * @param {Array} members - 队伍成员列表
 * @returns {Object} - 档位分布统计
 */
function generateSkillDistribution(members) {
  return {
    level5: members.filter(m => m.skillLevel === 5).length,
    level4: members.filter(m => m.skillLevel === 4).length,
    level3: members.filter(m => m.skillLevel === 3).length,
    level2: members.filter(m => m.skillLevel === 2).length,
    total: members.length
  };
}

// ============================================
// 2. 使用示例
// ============================================

// 示例球员数据
const examplePlayers = [
  { userId: '001', name: '张三', number: 23, skillLevel: 5, position: 'PG' },
  { userId: '002', name: '李四', number: 10, skillLevel: 5, position: 'SG' },
  { userId: '003', name: '王五', number: 7, skillLevel: 4, position: 'C' },
  { userId: '004', name: '赵六', number: 11, skillLevel: 4, position: 'SF' },
  { userId: '005', name: '钱七', number: 9, skillLevel: 4, position: 'PF' },
  { userId: '006', name: '孙八', number: 15, skillLevel: 4, position: 'PG' },
  { userId: '007', name: '周九', number: 3, skillLevel: 3, position: 'SG' },
  { userId: '008', name: '吴十', number: 12, skillLevel: 3, position: 'PF' },
  { userId: '009', name: '郑一', number: 8, skillLevel: 3, position: 'C' },
  { userId: '010', name: '冯二', number: 5, skillLevel: 3, position: 'SF' },
  { userId: '011', name: '陈三', number: 14, skillLevel: 3, position: 'SG' },
  { userId: '012', name: '楚四', number: 6, skillLevel: 3, position: 'PG' },
  { userId: '013', name: '魏五', number: 18, skillLevel: 3, position: 'PF' },
  { userId: '014', name: '蒋六', number: 21, skillLevel: 3, position: 'SF' },
  { userId: '015', name: '沈七', number: 4, skillLevel: 2, position: 'SG' },
  { userId: '016', name: '韩八', number: 13, skillLevel: 2, position: 'PG' },
  { userId: '017', name: '杨九', number: 16, skillLevel: 2, position: 'C' },
  { userId: '018', name: '朱十', number: 2, skillLevel: 2, position: 'PF' },
  { userId: '019', name: '秦一', number: 19, skillLevel: 2, position: 'SF' },
  { userId: '020', name: '许二', number: 22, skillLevel: 2, position: 'SG' }
];

// 执行分组
try {
  console.log('=== 开始档位平衡分组 ===\n');
  console.log('参与球员: 20人');
  console.log('档位分布: 5档(2人) + 4档(4人) + 3档(8人) + 2档(6人) = 20人\n');
  
  const result = balancedGroupBySkillLevel(examplePlayers);
  
  console.log('【白队】(A队) 10人:');
  console.log('  5档 (1人):', result.teamA.filter(m => m.skillLevel === 5).map(m => m.name).join(', '));
  console.log('  4档 (2人):', result.teamA.filter(m => m.skillLevel === 4).map(m => m.name).join(', '));
  console.log('  3档 (4人):', result.teamA.filter(m => m.skillLevel === 3).map(m => m.name).join(', '));
  console.log('  2档 (3人):', result.teamA.filter(m => m.skillLevel === 2).map(m => m.name).join(', '));
  
  console.log('\n【蓝队】(B队) 10人:');
  console.log('  5档 (1人):', result.teamB.filter(m => m.skillLevel === 5).map(m => m.name).join(', '));
  console.log('  4档 (2人):', result.teamB.filter(m => m.skillLevel === 4).map(m => m.name).join(', '));
  console.log('  3档 (4人):', result.teamB.filter(m => m.skillLevel === 3).map(m => m.name).join(', '));
  console.log('  2档 (3人):', result.teamB.filter(m => m.skillLevel === 2).map(m => m.name).join(', '));
  
  console.log('\n=== 分组成功！两队实力平衡 ===');
  console.log('每队配置: 5档1人 + 4档2人 + 3档4人 + 2档3人 = 10人');
  
} catch (error) {
  console.error('分组失败:', error.message);
}

// ============================================
// 3. 验证函数
// ============================================

/**
 * 验证参与球员是否符合分组条件
 * @param {Array} members - 参与球员列表
 * @returns {Object} - 验证结果 { valid, message, stats }
 */
function validateGroupingRequirements(members) {
  const stats = {
    level5: 0,
    level4: 0,
    level3: 0,
    level2: 0,
    total: members.length
  };
  
  // 统计各档位人数
  members.forEach(member => {
    const level = member.skillLevel || 3;
    stats[`level${level}`]++;
  });
  
  // 验证总人数
  if (stats.total < 4) {
    return {
      valid: false,
      message: '参与人数不足，至少需要4人才能分组',
      stats
    };
  }
  
  if (stats.total % 2 !== 0) {
    return {
      valid: false,
      message: `参与人数为${stats.total}（奇数），无法平均分配到两队`,
      stats
    };
  }
  
  // 验证各档位人数
  const errors = [];
  for (let level = 5; level >= 2; level--) {
    const count = stats[`level${level}`];
    if (count > 0 && count % 2 !== 0) {
      errors.push(`${level}档${count}人`);
    }
  }
  
  if (errors.length > 0) {
    return {
      valid: false,
      message: `以下档位人数为奇数，无法平衡分组：${errors.join('、')}`,
      stats
    };
  }
  
  return {
    valid: true,
    message: '验证通过，可以进行平衡分组',
    stats
  };
}

// 测试验证函数
console.log('\n\n=== 验证测试 ===\n');

// 测试1: 正常情况
const test1 = validateGroupingRequirements(examplePlayers);
console.log('测试1 (正常20人):', test1.valid ? '✓ 通过' : '✗ 失败', '-', test1.message);

// 测试2: 某档位为奇数
const oddPlayers = [...examplePlayers.slice(0, 19)]; // 移除1人，使某档位为奇数
const test2 = validateGroupingRequirements(oddPlayers);
console.log('测试2 (19人-奇数):', test2.valid ? '✓ 通过' : '✗ 失败', '-', test2.message);

// 测试3: 人数过少
const fewPlayers = examplePlayers.slice(0, 2);
const test3 = validateGroupingRequirements(fewPlayers);
console.log('测试3 (2人-太少):', test3.valid ? '✓ 通过' : '✗ 失败', '-', test3.message);

// ============================================
// 4. 导出模块（用于云函数）
// ============================================

module.exports = {
  balancedGroupBySkillLevel,
  generateSkillDistribution,
  validateGroupingRequirements,
  shuffle
};
