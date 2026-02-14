// pages/teams/__test__/teams-logic.test.js
// 纯函数逻辑测试，不涉及页面渲染
const mockDb = require('../../../__test__/mock-db');

// 模拟 wx 全局对象
wx.cloud = {
  callFunction: jest.fn(({ name }) => {
    if (name === 'getOpenId') {
      return Promise.resolve({ result: { openid: 'mock_user_openid' } });
    }
    return Promise.resolve({});
  }),
  database: jest.fn(() => mockDb),
};

wx.showToast = jest.fn();
wx.showLoading = jest.fn();
wx.hideLoading = jest.fn();
wx.stopPullDownRefresh = jest.fn();
wx.navigateTo = jest.fn();

// 模拟 getApp
getApp = jest.fn(() => ({
  globalData: { openid: 'mock_user_openid' }
}));

// 复制 loadTeams 的核心逻辑
async function loadTeamsLogic(openid) {
  const db = wx.cloud.database();
  const _ = db.command;

  const res = await db.collection('teams').where(
    _.or([
      { captainId: openid },
      { 'members.userId': openid }
    ])
  ).orderBy('createdAt', 'desc').get();

  const teamList = res.data.map(team => {
    let myRole = 'member';
    if (team.captainId === openid) {
      myRole = 'captain';
    } else {
      const member = team.members?.find(m => m.userId === openid);
      if (member) myRole = member.role || 'member';
    }
    return { ...team, myRole };
  });

  return teamList;
}

describe('Teams Page - 纯函数逻辑测试', () => {
  beforeEach(() => {
    mockDb.reset();
    wx.cloud.callFunction.mockClear();
    wx.showToast.mockClear();
    wx.navigateTo.mockClear();
  });

  describe('角色识别逻辑', () => {
    test('应该正确识别队长', async () => {
      const openid = 'user_captain';
      const teamId = 'team_001';

      const team = {
        _id: teamId,
        name: '飞鹰队',
        captainId: openid,
        members: [
          { userId: 'user_captain', role: 'captain' },
          { userId: 'user_001', role: 'member' }
        ],
        createdAt: new Date()
      };
      mockDb.collection('teams').add(team);

      const result = await loadTeamsLogic(openid);

      expect(result).toHaveLength(1);
      expect(result[0].myRole).toBe('captain');
      expect(result[0].name).toBe('飞鹰队');
    });

    test('应该正确识别普通成员', async () => {
      const openid = 'user_001';
      const captainId = 'user_captain';
      const teamId = 'team_001';

      const team = {
        _id: teamId,
        name: '飞鹰队',
        captainId: captainId,
        members: [
          { userId: captainId, role: 'captain' },
          { userId: openid, role: 'member' }
        ],
        createdAt: new Date()
      };
      mockDb.collection('teams').add(team);

      const result = await loadTeamsLogic(openid);

      expect(result).toHaveLength(1);
      expect(result[0].myRole).toBe('member');
      expect(result[0].name).toBe('飞鹰队');
    });

    test('应该正确识别副队长', async () => {
      const openid = 'user_002';
      const captainId = 'user_captain';
      const teamId = 'team_001';

      const team = {
        _id: teamId,
        name: '飞鹰队',
        captainId: captainId,
        members: [
          { userId: captainId, role: 'captain' },
          { userId: openid, role: 'vice-captain' }
        ],
        createdAt: new Date()
      };
      mockDb.collection('teams').add(team);

      const result = await loadTeamsLogic(openid);

      expect(result).toHaveLength(1);
      expect(result[0].myRole).toBe('vice-captain');
    });

    test('应该识别用户所在的多个球队', async () => {
      const openid = 'user_multi';
      const team1Id = 'team_001';
      const team2Id = 'team_002';

      const team1 = {
        _id: team1Id,
        name: '飞鹰队',
        captainId: 'captain_001',
        members: [
          { userId: 'captain_001', role: 'captain' },
          { userId: openid, role: 'vice-captain' }
        ],
        createdAt: new Date('2026-01-01T00:00:00.000Z')
      };

      const team2 = {
        _id: team2Id,
        name: '猛虎队',
        captainId: openid,
        members: [
          { userId: openid, role: 'captain' }
        ],
        createdAt: new Date('2026-01-02T00:00:00.000Z')
      };

      mockDb.collection('teams').add(team1);
      mockDb.collection('teams').add(team2);

      const result = await loadTeamsLogic(openid);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('猛虎队'); // 按创建时间降序
      expect(result[0].myRole).toBe('captain');
      expect(result[1].name).toBe('飞鹰队');
      expect(result[1].myRole).toBe('vice-captain');
    });
  });

  describe('数据库查询逻辑', () => {
    test('应该只返回用户作为队长或成员的球队', async () => {
      const openid = 'user_001';

      // 用户作为队长的球队
      const team1 = {
        _id: 'team_001',
        name: '飞鹰队',
        captainId: openid,
        members: [],
        createdAt: new Date()
      };
      mockDb.collection('teams').add(team1);

      // 用户作为成员的球队
      const team2 = {
        _id: 'team_002',
        name: '猛虎队',
        captainId: 'captain_002',
        members: [{ userId: openid, role: 'member' }],
        createdAt: new Date()
      };
      mockDb.collection('teams').add(team2);

      // 其他球队（用户不在其中）
      const team3 = {
        _id: 'team_003',
        name: '其他队',
        captainId: 'captain_003',
        members: [],
        createdAt: new Date()
      };
      mockDb.collection('teams').add(team3);

      const result = await loadTeamsLogic(openid);

      expect(result).toHaveLength(2);
      const teamNames = result.map(t => t.name);
      expect(teamNames).toContain('飞鹰队');
      expect(teamNames).toContain('猛虎队');
      expect(teamNames).not.toContain('其他队');
    });
  });

  describe('排序逻辑', () => {
    test('球队列表应该按创建时间降序排列', async () => {
      const openid = 'user_001';

      const teams = [
        {
          _id: 'team_001',
          name: '老球队',
          captainId: openid,
          createdAt: new Date('2026-01-01')
        },
        {
          _id: 'team_002',
          name: '新球队',
          captainId: openid,
          createdAt: new Date('2026-01-10')
        },
        {
          _id: 'team_003',
          name: '中等球队',
          captainId: openid,
          createdAt: new Date('2026-01-05')
        }
      ];

      teams.forEach(t => mockDb.collection('teams').add(t));

      const result = await loadTeamsLogic(openid);

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('新球队');
      expect(result[1].name).toBe('中等球队');
      expect(result[2].name).toBe('老球队');
    });
  });

  describe('边界情况', () => {
    test('用户没有任何球队时应该返回空数组', async () => {
      const openid = 'user_empty';

      // 只添加其他用户的球队
      mockDb.collection('teams').add({
        _id: 'team_001',
        name: '其他球队',
        captainId: 'other_user',
        createdAt: new Date()
      });

      const result = await loadTeamsLogic(openid);

      expect(result).toHaveLength(0);
    });

    test('成员没有明确角色时默认为 member', async () => {
      const openid = 'user_001';
      const captainId = 'captain_001';

      const team = {
        _id: 'team_001',
        name: '飞鹰队',
        captainId: captainId,
        members: [
          { userId: captainId, role: 'captain' },
          { userId: openid } // 没有明确 role
        ],
        createdAt: new Date()
      };
      mockDb.collection('teams').add(team);

      const result = await loadTeamsLogic(openid);

      expect(result[0].myRole).toBe('member');
    });

    test('members 数组为空时不会报错', async () => {
      const openid = 'user_captain';

      const team = {
        _id: 'team_001',
        name: '飞鹰队',
        captainId: openid,
        members: [], // 空数组
        createdAt: new Date()
      };
      mockDb.collection('teams').add(team);

      const result = await loadTeamsLogic(openid);

      expect(result).toHaveLength(1);
      expect(result[0].myRole).toBe('captain');
    });
  });
});
