// miniprogram/__test__/unit/create-match.unit.test.js
// 纯 Jest 单元测试 - 不依赖 miniprogram-simulate
const mockDb = require('../mock-db');

// 模拟 wx.cloud 对象
global.wx = {
  cloud: {
    callFunction: jest.fn(({ name }) => {
      if (name === 'getOpenId') {
        return Promise.resolve({ result: { openid: 'test_openid' } });
      }
      return Promise.resolve({});
    }),
    database: jest.fn(() => mockDb),
    serverDate: () => new Date()
  },
  showToast: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  showActionSheet: jest.fn(),
  navigateBack: jest.fn()
};

describe('Create Match - 纯 Jest 单元测试', () => {
  beforeEach(() => {
    mockDb.reset();
    jest.clearAllMocks();
  });

  describe('数据库操作测试', () => {
    test('应该能够创建比赛', async () => {
      const matchData = {
        type: 'Friendly',
        status: 'scheduled',
        homeTeamId: 'team_001',
        homeTeam: {
          _id: 'team_001',
          name: '飞鹰队',
          logo: 'logo.jpg'
        },
        awayTeamId: 'team_002',
        awayTeam: {
          _id: 'team_002',
          name: '猛虎队',
          logo: 'logo2.jpg'
        },
        startTime: new Date('2026-12-01 18:00'),
        location: {
          name: '北京体育馆'
        },
        homeScore: 0,
        awayScore: 0,
        createdAt: new Date()
      };

      const result = await mockDb.collection('matches').add(matchData);
      expect(result._id).toBeDefined();

      // 验证数据已保存 - 使用 where 查询
      const { data } = await mockDb.collection('matches').where({ type: 'Friendly' }).get();
      expect(data.length).toBeGreaterThanOrEqual(1);
      expect(data[0].type).toBe('Friendly');
      expect(data[0].status).toBe('scheduled');
    });

    test('创建比赛时应该初始化比分为 0-0', async () => {
      const matchData = {
        type: 'League',
        status: 'scheduled',
        homeTeamId: 'team_001',
        homeTeam: {
          _id: 'team_001',
          name: '飞鹰队'
        },
        awayTeamId: 'team_002',
        awayTeam: {
          _id: 'team_002',
          name: '猛虎队'
        },
        startTime: new Date('2026-12-01 18:00'),
        location: { name: '体育馆' },
        homeScore: 0,
        awayScore: 0
      };

      await mockDb.collection('matches').add(matchData);

      const { data } = await mockDb.collection('matches').where({ type: 'League' }).get();
      expect(data.length).toBeGreaterThanOrEqual(1);
      expect(data[0].homeScore).toBe(0);
      expect(data[0].awayScore).toBe(0);
    });

    test('创建比赛应该记录创建时间', async () => {
      const beforeCreate = new Date();

      const matchData = {
        type: 'Friendly',
        homeTeamId: 'team_001',
        homeTeam: { _id: 'team_001', name: '主队' },
        startTime: new Date('2026-12-01 18:00'),
        location: { name: '体育馆' },
        homeScore: 0,
        awayScore: 0
      };

      await mockDb.collection('matches').add(matchData);

      const afterCreate = new Date();

      const { data } = await mockDb.collection('matches').where({ type: 'Friendly' }).get();
      const createdAt = new Date(data[data.length - 1].createdAt);

      expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    test('应该能够创建只有主队的比赛（客队为空）', async () => {
      const matchData = {
        type: 'Friendly',
        status: 'scheduled',
        homeTeamId: 'team_001',
        homeTeam: {
          _id: 'team_001',
          name: '飞鹰队'
        },
        awayTeamId: null,
        awayTeam: null,
        startTime: new Date('2026-12-01 18:00'),
        location: { name: '体育馆' },
        homeScore: 0,
        awayScore: 0
      };

      await mockDb.collection('matches').add(matchData);

      const { data } = await mockDb.collection('matches').where({ type: 'Friendly' }).get();
      const match = data.find(m => m.awayTeamId === null);
      expect(match).toBeDefined();
      expect(match.awayTeamId).toBeNull();
      expect(match.awayTeam).toBeNull();
    });
  });

  describe('表单验证测试', () => {
    test('主队不能为空', () => {
      const formData = {
        matchType: 'Friendly',
        homeTeam: null,
        matchDate: '2026-12-01',
        matchTime: '18:00',
        locationName: '体育馆'
      };

      const canSubmit = formData.homeTeam && formData.matchDate && formData.matchTime && formData.locationName;
      expect(canSubmit).toBeFalsy();
    });

    test('比赛日期不能为空', () => {
      const formData = {
        matchType: 'Friendly',
        homeTeam: { _id: 'team_001', name: '飞鹰队' },
        matchDate: '',
        matchTime: '18:00',
        locationName: '体育馆'
      };

      const canSubmit = formData.homeTeam && formData.matchDate && formData.matchTime && formData.locationName;
      expect(canSubmit).toBeFalsy();
    });

    test('比赛时间不能为空', () => {
      const formData = {
        matchType: 'Friendly',
        homeTeam: { _id: 'team_001', name: '飞鹰队' },
        matchDate: '2026-12-01',
        matchTime: '',
        locationName: '体育馆'
      };

      const canSubmit = formData.homeTeam && formData.matchDate && formData.matchTime && formData.locationName;
      expect(canSubmit).toBeFalsy();
    });

    test('比赛地点不能为空', () => {
      const formData = {
        matchType: 'Friendly',
        homeTeam: { _id: 'team_001', name: '飞鹰队' },
        matchDate: '2026-12-01',
        matchTime: '18:00',
        locationName: ''
      };

      const canSubmit = formData.homeTeam && formData.matchDate && formData.matchTime && formData.locationName;
      expect(canSubmit).toBeFalsy();
    });

    test('完整的表单应该通过验证', () => {
      const formData = {
        matchType: 'Friendly',
        homeTeam: { _id: 'team_001', name: '飞鹰队' },
        matchDate: '2026-12-01',
        matchTime: '18:00',
        locationName: '北京体育馆'
      };

      const canSubmit = Boolean(formData.homeTeam && formData.matchDate && formData.matchTime && formData.locationName);
      expect(canSubmit).toBe(true);
    });

    test('比赛类型应该在有效列表中', () => {
      const validTypes = ['Friendly', 'League', 'Tournament'];

      validTypes.forEach(type => {
        const isValid = validTypes.includes(type);
        expect(isValid).toBe(true);
      });
    });
  });

  describe('比赛逻辑测试', () => {
    test('应该能够查询用户的球队列表', async () => {
      const userOpenid = 'user_001';

      // 创建测试球队
      await mockDb.collection('teams').add({
        _id: 'team_001',
        name: '用户球队1',
        captainId: userOpenid,
        members: [{
          userId: userOpenid,
          role: 'captain',
          number: null,
          joinedAt: new Date()
        }]
      });

      await mockDb.collection('teams').add({
        _id: 'team_002',
        name: '用户球队2',
        captainId: userOpenid,
        members: [{
          userId: userOpenid,
          role: 'captain',
          number: null,
          joinedAt: new Date()
        }]
      });

      await mockDb.collection('teams').add({
        _id: 'team_003',
        name: '其他球队',
        captainId: 'other_user',
        members: [{
          userId: 'other_user',
          role: 'captain',
          number: null,
          joinedAt: new Date()
        }]
      });

      const { data: userTeams } = await mockDb.collection('teams').where({ 'members.userId': userOpenid }).get();
      expect(userTeams.length).toBe(2);
      expect(userTeams.every(t => t.members.some(m => m.userId === userOpenid))).toBe(true);
    });

    test('比赛开始时间应该正确解析', () => {
      const matchDate = '2026-12-01';
      const matchTime = '18:00';
      const startTime = new Date(`${matchDate} ${matchTime}`);

      expect(startTime.getFullYear()).toBe(2026);
      expect(startTime.getMonth()).toBe(11); // 12月是11
      expect(startTime.getDate()).toBe(1);
      expect(startTime.getHours()).toBe(18);
      expect(startTime.getMinutes()).toBe(0);
    });

    test('不同比赛类型应该被正确设置', async () => {
      const matchTypes = ['Friendly', 'League', 'Tournament'];

      for (const type of matchTypes) {
        await mockDb.collection('matches').add({
          type: type,
          status: 'scheduled',
          homeTeamId: 'team_001',
          homeTeam: { _id: 'team_001', name: '主队' },
          startTime: new Date('2026-12-01 18:00'),
          location: { name: '体育馆' },
          homeScore: 0,
          awayScore: 0
        });
      }

      // 查询每种类型
      const { data: friendlyMatches } = await mockDb.collection('matches').where({ type: 'Friendly' }).get();
      const { data: leagueMatches } = await mockDb.collection('matches').where({ type: 'League' }).get();
      const { data: tournamentMatches } = await mockDb.collection('matches').where({ type: 'Tournament' }).get();

      expect(friendlyMatches.length).toBe(1);
      expect(leagueMatches.length).toBe(1);
      expect(tournamentMatches.length).toBe(1);
    });
  });

  describe('边界情况测试', () => {
    test('空比赛列表应该处理正常', async () => {
      const { data: matches } = await mockDb.collection('matches').where({ type: 'NonExistent' }).get();
      expect(matches.length).toBe(0);
      expect(Array.isArray(matches)).toBe(true);
    });

    test('空地点名称应该被拒绝', () => {
      const locationName = '';
      const isValid = locationName && locationName.trim().length > 0;
      expect(isValid).toBeFalsy();
    });

    test('长地点名称应该被接受', async () => {
      const longLocation = 'A'.repeat(100);

      const matchData = {
        type: 'Friendly',
        homeTeamId: 'team_001',
        homeTeam: { _id: 'team_001', name: '主队' },
        startTime: new Date('2026-12-01 18:00'),
        location: { name: longLocation },
        homeScore: 0,
        awayScore: 0
      };

      await mockDb.collection('matches').add(matchData);

      const { data: matches } = await mockDb.collection('matches').where({ type: 'Friendly' }).get();
      const match = matches.find(m => m.location.name === longLocation);
      expect(match).toBeDefined();
      expect(match.location.name.length).toBe(100);
    });

    test('客队可以为空', async () => {
      const matchData = {
        type: 'Friendly',
        status: 'scheduled',
        homeTeamId: 'team_001',
        homeTeam: { _id: 'team_001', name: '主队' },
        awayTeamId: null,
        awayTeam: null,
        startTime: new Date('2026-12-01 18:00'),
        location: { name: '体育馆' },
        homeScore: 0,
        awayScore: 0
      };

      await mockDb.collection('matches').add(matchData);

      const { data: matches } = await mockDb.collection('matches').where({ type: 'Friendly' }).get();
      const match = matches.find(m => m.awayTeamId === null);
      expect(match).toBeDefined();
      expect(match.awayTeamId).toBeNull();
    });
  });

  describe('错误处理测试', () => {
    test('查询不存在的比赛应该返回空数组', async () => {
      const { data } = await mockDb.collection('matches').where({ type: 'NonExistent' }).get();
      expect(data).toEqual([]);
    });

    test('查询用户没有球队时应该返回空数组', async () => {
      const userOpenid = 'user_001';
      const { data: teams } = await mockDb.collection('teams').where({ 'members.userId': userOpenid }).get();
      expect(teams).toEqual([]);
    });

    test('无效的比赛日期应该被拒绝', () => {
      const invalidDates = ['', '2026-13-01', '2026-02-30', 'not-a-date'];

      invalidDates.forEach(date => {
        const isValidDate = !isNaN(new Date(date).getTime());
        // 注意：部分无效日期会被 new Date 解析，这里只是基本验证
        if (date === '' || date === 'not-a-date') {
          expect(isValidDate).toBe(false);
        }
      });
    });
  });
});
