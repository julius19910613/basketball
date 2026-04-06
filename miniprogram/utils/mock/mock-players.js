/**
 * Mock 球员数据
 * 用于随机分组功能开发测试
 * 
 * 档位说明：
 * - 5档：顶级球员（2人）
 * - 4档：优秀球员（4人）
 * - 3档：普通球员（8人）
 * - 2档：新手球员（6人）
 */

const mockPlayers = [
  // 5档球员 - 2人
  {
    _id: 'p1',
    name: '张伟',
    number: 23,
    position: 'PG',
    skillLevel: 5,
    avatar: '/images/default_avatar.svg',
    height: 182,
    weight: 75,
    joinDate: '2024-01-15'
  },
  {
    _id: 'p2',
    name: '李强',
    number: 11,
    position: 'SF',
    skillLevel: 5,
    avatar: '/images/default_avatar.svg',
    height: 188,
    weight: 82,
    joinDate: '2024-01-20'
  },
  
  // 4档球员 - 4人
  {
    _id: 'p3',
    name: '王磊',
    number: 7,
    position: 'SG',
    skillLevel: 4,
    avatar: '/images/default_avatar.svg',
    height: 178,
    weight: 72,
    joinDate: '2024-02-01'
  },
  {
    _id: 'p4',
    name: '刘洋',
    number: 10,
    position: 'PF',
    skillLevel: 4,
    avatar: '/images/default_avatar.svg',
    height: 185,
    weight: 80,
    joinDate: '2024-02-10'
  },
  {
    _id: 'p5',
    name: '陈明',
    number: 15,
    position: 'C',
    skillLevel: 4,
    avatar: '/images/default_avatar.svg',
    height: 192,
    weight: 90,
    joinDate: '2024-02-15'
  },
  {
    _id: 'p6',
    name: '赵鹏',
    number: 3,
    position: 'PG',
    skillLevel: 4,
    avatar: '/images/default_avatar.svg',
    height: 180,
    weight: 74,
    joinDate: '2024-02-20'
  },
  
  // 3档球员 - 8人
  {
    _id: 'p7',
    name: '孙浩',
    number: 8,
    position: 'SG',
    skillLevel: 3,
    avatar: '/images/default_avatar.svg',
    height: 176,
    weight: 70,
    joinDate: '2024-03-01'
  },
  {
    _id: 'p8',
    name: '周杰',
    number: 12,
    position: 'SF',
    skillLevel: 3,
    avatar: '/images/default_avatar.svg',
    height: 183,
    weight: 78,
    joinDate: '2024-03-05'
  },
  {
    _id: 'p9',
    name: '吴涛',
    number: 21,
    position: 'PF',
    skillLevel: 3,
    avatar: '/images/default_avatar.svg',
    height: 186,
    weight: 83,
    joinDate: '2024-03-10'
  },
  {
    _id: 'p10',
    name: '郑凯',
    number: 5,
    position: 'C',
    skillLevel: 3,
    avatar: '/images/default_avatar.svg',
    height: 190,
    weight: 88,
    joinDate: '2024-03-15'
  },
  {
    _id: 'p11',
    name: '冯勇',
    number: 14,
    position: 'PG',
    skillLevel: 3,
    avatar: '/images/default_avatar.svg',
    height: 175,
    weight: 68,
    joinDate: '2024-03-20'
  },
  {
    _id: 'p12',
    name: '蒋华',
    number: 9,
    position: 'SG',
    skillLevel: 3,
    avatar: '/images/default_avatar.svg',
    height: 179,
    weight: 73,
    joinDate: '2024-03-25'
  },
  {
    _id: 'p13',
    name: '沈亮',
    number: 18,
    position: 'SF',
    skillLevel: 3,
    avatar: '/images/default_avatar.svg',
    height: 184,
    weight: 79,
    joinDate: '2024-04-01'
  },
  {
    _id: 'p14',
    name: '韩冰',
    number: 22,
    position: 'PF',
    skillLevel: 3,
    avatar: '/images/default_avatar.svg',
    height: 187,
    weight: 84,
    joinDate: '2024-04-05'
  },
  
  // 2档球员 - 6人
  {
    _id: 'p15',
    name: '杨帆',
    number: 4,
    position: 'PG',
    skillLevel: 2,
    avatar: '/images/default_avatar.svg',
    height: 172,
    weight: 65,
    joinDate: '2024-04-10'
  },
  {
    _id: 'p16',
    name: '徐峰',
    number: 6,
    position: 'SG',
    skillLevel: 2,
    avatar: '/images/default_avatar.svg',
    height: 174,
    weight: 67,
    joinDate: '2024-04-15'
  },
  {
    _id: 'p17',
    name: '何阳',
    number: 13,
    position: 'SF',
    skillLevel: 2,
    avatar: '/images/default_avatar.svg',
    height: 180,
    weight: 75,
    joinDate: '2024-04-20'
  },
  {
    _id: 'p18',
    name: '林波',
    number: 16,
    position: 'PF',
    skillLevel: 2,
    avatar: '/images/default_avatar.svg',
    height: 182,
    weight: 77,
    joinDate: '2024-04-25'
  },
  {
    _id: 'p19',
    name: '高远',
    number: 19,
    position: 'C',
    skillLevel: 2,
    avatar: '/images/default_avatar.svg',
    height: 188,
    weight: 85,
    joinDate: '2024-05-01'
  },
  {
    _id: 'p20',
    name: '龙飞',
    number: 24,
    position: 'SG',
    skillLevel: 2,
    avatar: '/images/default_avatar.svg',
    height: 177,
    weight: 71,
    joinDate: '2024-05-05'
  }
]

/**
 * 获取档位描述
 * @param {number} level 档位 2-5
 * @returns {string} 档位描述
 */
function getLevelDesc(level) {
  const descMap = {
    5: '顶级球员',
    4: '优秀球员',
    3: '普通球员',
    2: '新手球员'
  }
  return descMap[level] || '未知'
}

/**
 * 获取档位颜色
 * @param {number} level 档位 2-5
 * @returns {string} 颜色值
 */
function getLevelColor(level) {
  const colorMap = {
    5: '#FF4D4F', // 红色 - 顶级
    4: '#FA8C16', // 橙色 - 优秀
    3: '#52C41A', // 绿色 - 普通
    2: '#1890FF'  // 蓝色 - 新手
  }
  return colorMap[level] || '#8C8C8C'
}

/**
 * 获取位置中文名
 * @param {string} position 位置代码
 * @returns {string} 位置中文名
 */
function getPositionName(position) {
  const positionMap = {
    'PG': '控球后卫',
    'SG': '得分后卫',
    'SF': '小前锋',
    'PF': '大前锋',
    'C': '中锋'
  }
  return positionMap[position] || position
}

module.exports = {
  mockPlayers,
  getLevelDesc,
  getLevelColor,
  getPositionName
}
