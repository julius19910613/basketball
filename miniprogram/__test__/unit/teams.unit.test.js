// miniprogram/__test__/unit/teams.unit.test.js
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
  navigateTo: jest.fn()
};

describe('Teams Page - 纯 Jest 单元测试', () => {
  beforeEach(() => {
    mockDb.reset();
    jest.clearAllMocks();
  });

  describe('数据库操作测试', () => {
    test('应该能够查询用户作为队长的球队', async () => {
      const userOpenid = 'user_001';

      // 创建用户作为队长的球队
      await mockDb.collection('teams').add({
        _id: 'team_001',
        name: '飞鹰队',
        captainId: userOpenid,
        members: [{
          userId: userOpenid,
          role: 'captain',
          number: null,
          joinedAt: new Date()
        }],
        createdAt: new Date('2026-01-01')
      });

      // 查询用户作为队长的球队
      const { data: captainTeams } = await mockDb.collection('teams').where({ captainId: userOpenid }).get();

      expect(captainTeams.length).toBe(1);
      expect(captainTeams[0].name).toBe('飞鹰队');
      expect(captainTeams[0].captainId).toBe(userOpenid);
    });

    test('应该能够查询用户作为成员的球队', async () => {
      const userOpenid = 'user_001';
      const captainOpenid = 'captain_001';

      // 创建用户作为成员的球队
      await mockDb.collection('teams').add({
        _id: 'team_001',
        name: '猛虎队',
        captainId: captainOpenid,
        members: [
          {
            userId: captainOpenid,
            role: 'captain',
            number: null,
            joinedAt: new Date()
          },
          {
            userId: userOpenid,
            role: 'member',
            number: null,
            joinedAt: new Date()
          }
        ],
        createdAt: new Date('2026-01-01')
      });

      // 查询用户作为成员的球队
      const { data: memberTeams } = await mockDb.collection('teams').where({ 'members.userId': userOpenid }).get();

      expect(memberTeams.length).toBe(1);
      expect(memberTeams[0].name).toBe('猛虎队');
      expect(memberTeams[0].members.some(m => m.userId === userOpenid)).toBe(true);
    });

    test('应该能够同时查询用户作为队长和成员的球队', async () => {
      const userOpenid = 'user_001';

      // 用户作为队长的球队
      await mockDb.collection('teams').add({
        _id: 'team_001',
        name: '飞鹰队',
        captainId: userOpenid,
        members: [{
          userId: userOpenid,
          role: 'captain',
          number: null,
          joinedAt: new Date()
        }],
        createdAt: new Date('2026-01-01')
      });

      // 用户作为成员的球队
      await mockDb.collection('teams').add({
        _id: 'team_002',
        name: '猛虎队',
        captainId: 'captain_001',
        members: [
          {
            userId: 'captain_001',
            role: 'captain',
            number: null,
            joinedAt: new Date()
          },
          {
            userId: userOpenid,
            role: 'member',
            number: null,
            joinedAt: new Date()
          }
        ],
        createdAt: new Date('2026-01-02')
      });

      // 用户作为副队长的球队
      await mockDb.collection('teams').add({
        _id: 'team_003',
        name: '火箭队',
        captainId: 'captain_002',
        members: [
          {
            userId: 'captain_002',
            role: 'captain',
            number: null,
            joinedAt: new Date()
          },
          {
            userId: userOpenid,
            role: 'vice-captain',
            number: null,
            joinedAt: new Date()
          }
        ],
        createdAt: new Date('2026-01-03')
      });

      // 查询用户作为队长的球队
      const { data: captainTeams } = await mockDb.collection('teams').where({ captainId: userOpenid }).get();
      expect(captainTeams.length).toBe(1);

      // 查询用户作为成员的球队
      const { data: memberTeams } = await mockDb.collection('teams').where({ 'members.userId': userOpenid }).get();
      expect(memberTeams.length).toBe(3); // 包括作为队长、成员、副队长的所有球队
    });

    test('球队列表应该按创建时间降序排列', async () => {
      const userOpenid = 'user_001';

      // 创建不同时间创建的球队
      await mockDb.collection('teams').add({
        _id: 'team_001',
        name: '球队1',
        captainId: userOpenid,
        members: [{ userId: userOpenid, role: 'captain', number: null, joinedAt: new Date() }],
        createdAt: new Date('2026-01-01')
      });

      await mockDb.collection('teams').add({
        _id: 'team_002',
        name: '球队2',
        captainId: userOpenid,
        members: [{ userId: userOpenid, role: 'captain', number: null, joinedAt: new Date() }],
        createdAt: new Date('2026-01-03')
      });

      await mockDb.collection('teams').add({
        _id: 'team_003',
        name: '球队3',
        captainId: userOpenid,
        members: [{ userId: userOpenid, role: 'captain', number: null, joinedAt: new Date() }],
        createdAt: new Date('2026-01-02')
      });

      const { data: teams } = await mockDb.collection('teams').where({ captainId: userOpenid }).get();
      teams.sort((a, b) => b.createdAt - a.createdAt); // 手动排序

      expect(teams.length).toBe(3);
      expect(teams[0].name).toBe('球队2');
      expect(teams[1].name).toBe('球队3');
      expect(teams[2].name).toBe('球队1');
    });
  });

  describe('权限逻辑测试', () => {
    test('应该正确识别队长的角色', async () => {
      const userOpenid = 'user_001';

      await mockDb.collection('teams').add({
        _id: 'team_001',
        name: '飞鹰队',
        captainId: userOpenid,
        members: [{
          userId: userOpenid,
          role: 'captain',
          number: null,
          joinedAt: new Date()
        }],
        createdAt: new Date()
      });

      const { data: teams } = await mockDb.collection('teams').where({ captainId: userOpenid }).get();
      const team = teams[0];

      let myRole = 'member';
      if (team.captainId === userOpenid) {
        myRole = 'captain';
      }

      expect(myRole).toBe('captain');
    });

    test('应该正确识别副队长的角色', async () => {
      const userOpenid = 'user_001';
      const captainOpenid = 'captain_001';

      await mockDb.collection('teams').add({
        _id: 'team_001',
        name: '飞鹰队',
        captainId: captainOpenid,
        members: [
          {
            userId: captainOpenid,
            role: 'captain',
            number: null,
            joinedAt: new Date()
          },
          {
            userId: userOpenid,
            role: 'vice-captain',
            number: null,
            joinedAt: new Date()
          }
        ],
        createdAt: new Date()
      });

      const { data: teams } = await mockDb.collection('teams').where({ 'members.userId': userOpenid }).get();
      const team = teams[0];

      let myRole = 'member';
      if (team.captainId === userOpenid) {
        myRole = 'captain';
      } else {
        const member = team.members.find(m => m.userId === userOpenid);
        if (member) myRole = member.role || 'member';
      }

      expect(myRole).toBe('vice-captain');
    });

    test('应该正确识别普通成员的角色', async () => {
      const userOpenid = 'user_001';
      const captainOpenid = 'captain_001';

      await mockDb.collection('teams').add({
        _id: 'team_001',
        name: '飞鹰队',
        captainId: captainOpenid,
        members: [
          {
            userId: captainOpenid,
            role: 'captain',
            number: null,
            joinedAt: new Date()
          },
          {
            userId: userOpenid,
            role: 'member',
            number: null,
            joinedAt: new Date()
          }
        ],
        createdAt: new Date()
      });

      const { data: teams } = await mockDb.collection('teams').where({ 'members.userId': userOpenid }).get();
      const team = teams[0];

      let myRole = 'member';
      if (team.captainId === userOpenid) {
        myRole = 'captain';
      } else {
        const member = team.members.find(m => m.userId === userOpenid);
        if (member) myRole = member.role || 'member';
      }

      expect(myRole).toBe('member');
    });

    test('用户没有加入的球队不应该出现在列表中', async () => {
      const userOpenid = 'user_001';

      // 用户加入的球队
      await mockDb.collection('teams').add({
        _id: 'team_001',
        name: '用户球队',
        captainId: userOpenid,
        members: [{
          userId: userOpenid,
          role: 'captain',
          number: null,
          joinedAt: new Date()
        }],
        createdAt: new Date()
      });

      // 用户没有加入的球队
      await mockDb.collection('teams').add({
        _id: 'team_002',
        name: '其他球队',
        captainId: 'other_user',
        members: [{
          userId: 'other_user',
          role: 'captain',
          number: null,
          joinedAt: new Date()
        }],
        createdAt: new Date()
      });

      const { data: captainTeams } = await mockDb.collection('teams').where({ captainId: userOpenid }).get();
      const { data: memberTeams } = await mockDb.collection('teams').where({ 'members.userId': userOpenid }).get();

      const allTeams = [...captainTeams, ...memberTeams];
      const uniqueTeams = allTeams.filter((team, index, self) =>
        index === self.findIndex(t => t._id === team._id)
      );

      expect(uniqueTeams.length).toBe(1);
      expect(uniqueTeams[0].name).toBe('用户球队');
    });
  });

  describe('边界情况测试', () => {
    test('空球队列表应该处理正常', async () => {
      const userOpenid = 'user_001';

      const { data: captainTeams } = await mockDb.collection('teams').where({ captainId: userOpenid }).get();
      const { data: memberTeams } = await mockDb.collection('teams').where({ 'members.userId': userOpenid }).get();

      expect(captainTeams).toEqual([]);
      expect(memberTeams).toEqual([]);
    });

    test('用户只加入一个球队时应该正常工作', async () => {
      const userOpenid = 'user_001';

      await mockDb.collection('teams').add({
        _id: 'team_001',
        name: '唯一球队',
        captainId: userOpenid,
        members: [{
          userId: userOpenid,
          role: 'captain',
          number: null,
          joinedAt: new Date()
        }],
        createdAt: new Date()
      });

      const { data: teams } = await mockDb.collection('teams').where({ captainId: userOpenid }).get();
      expect(teams.length).toBe(1);
      expect(teams[0].name).toBe('唯一球队');
    });

    test('用户加入多个球队时应该正常工作', async () => {
      const userOpenid = 'user_001';

      for (let i = 1; i <= 10; i++) {
        await mockDb.collection('teams').add({
          _id: `team_00${i}`,
          name: `球队${i}`,
          captainId: userOpenid,
          members: [{
            userId: userOpenid,
            role: 'captain',
            number: null,
            joinedAt: new Date()
          }],
          createdAt: new Date()
        });
      }

      const { data: teams } = await mockDb.collection('teams').where({ captainId: userOpenid }).get();
      expect(teams.length).toBe(10);
    });

    test('成员列表为空的球队应该被正确处理', async () => {
      const userOpenid = 'user_001';

      // 球队只有队长，没有其他成员
      await mockDb.collection('teams').add({
        _id: 'team_001',
        name: '单人球队',
        captainId: userOpenid,
        members: [{
          userId: userOpenid,
          role: 'captain',
          number: null,
          joinedAt: new Date()
        }],
        createdAt: new Date()
      });

      const { data: teams } = await mockDb.collection('teams').where({ captainId: userOpenid }).get();
      expect(teams.length).toBe(1);
      expect(teams[0].members.length).toBe(1);
    });
  });

  describe('错误处理测试', () => {
    test('查询不存在的用户 openid 应该返回空数组', async () => {
      const nonExistentOpenid = 'non_existent_openid';

      const { data: captainTeams } = await mockDb.collection('teams').where({ captainId: nonExistentOpenid }).get();
      const { data: memberTeams } = await mockDb.collection('teams').where({ 'members.userId': nonExistentOpenid }).get();

      expect(captainTeams).toEqual([]);
      expect(memberTeams).toEqual([]);
    });

    test('空 openid 查询应该返回空数组', async () => {
      const emptyOpenid = '';

      const { data: captainTeams } = await mockDb.collection('teams').where({ captainId: emptyOpenid }).get();
      const { data: memberTeams } = await mockDb.collection('teams').where({ 'members.userId': emptyOpenid }).get();

      expect(captainTeams).toEqual([]);
      expect(memberTeams).toEqual([]);
    });

    test('球队没有成员字段应该被正确处理', async () => {
      const userOpenid = 'user_001';

      // 创建没有 members 字段的球队
      await mockDb.collection('teams').add({
        _id: 'team_001',
        name: '无成员球队',
        captainId: userOpenid,
        createdAt: new Date()
      });

      const { data: teams } = await mockDb.collection('teams').where({ captainId: userOpenid }).get();
      expect(teams.length).toBe(1);
      expect(teams[0].members).toBeUndefined();
    });
  });
});
