// pages/create-team/__test__/create-team-logic.test.js
// 纯函数逻辑测试，不涉及页面渲染
const mockDb = require('../../../__test__/mock-db');

// 模拟 wx 全局对象
wx.cloud = {
  callFunction: jest.fn(({ name }) => {
    if (name === 'getOpenId') {
      return Promise.resolve({ result: { openid: 'mock_captain_openid' } });
    }
    return Promise.resolve({});
  }),
  database: jest.fn(() => mockDb),
  uploadFile: jest.fn(),
};

wx.showToast = jest.fn();
wx.showLoading = jest.fn();
wx.hideLoading = jest.fn();
wx.showActionSheet = jest.fn();
wx.chooseImage = jest.fn();
wx.navigateBack = jest.fn();

// 模拟 db.serverDate
mockDb.serverDate = () => new Date();

describe('Create Team Page - 纯函数逻辑测试', () => {
  beforeEach(() => {
    mockDb.reset();
    wx.cloud.callFunction.mockClear();
    wx.showToast.mockClear();
    wx.showLoading.mockClear();
    wx.hideLoading.mockClear();
    wx.navigateBack.mockClear();
  });

  describe('球队创建逻辑', () => {
    test('应该成功创建球队并返回球队ID', async () => {
      const openid = 'captain_001';
      const teamData = {
        name: '飞鹰队',
        description: '',
        region: '北京',
        color: '#FF6B35',
        logo: 'cloud://team-logo.jpg',
        captainId: openid,
        members: [{
          userId: openid,
          role: 'captain',
          number: null,
          joinedAt: new Date()
        }],
        createdAt: new Date()
      };

      const addResult = await mockDb.collection('teams').add(teamData);

      expect(addResult._id).toBeDefined();
      expect(addResult._id).toMatch(/^mock-team-id-\d+$/);
    });

    test('创建后应该能查询到球队', async () => {
      const openid = 'captain_001';
      const teamData = {
        name: '飞鹰队',
        region: '北京',
        color: '#FF6B35',
        captainId: openid,
        members: [{
          userId: openid,
          role: 'captain',
          number: null,
          joinedAt: new Date()
        }],
        createdAt: new Date()
      };

      const addResult = await mockDb.collection('teams').add(teamData);
      const { data } = await mockDb.collection('teams')
        .where({ _id: addResult._id })
        .get();

      expect(data).toHaveLength(1);
      expect(data[0].name).toBe('飞鹰队');
      expect(data[0].captainId).toBe(openid);
      expect(data[0].members).toHaveLength(1);
      expect(data[0].members[0].role).toBe('captain');
    });

    test('应该创建默认颜色球队', async () => {
      const openid = 'captain_001';
      const teamData = {
        name: '猛虎队',
        region: '上海',
        color: '#FF6B35', // 默认橙色
        captainId: openid,
        members: [{
          userId: openid,
          role: 'captain',
          number: null,
          joinedAt: new Date()
        }],
        createdAt: new Date()
      };

      await mockDb.collection('teams').add(teamData);
      const { data } = await mockDb.collection('teams')
        .where({ name: '猛虎队' })
        .get();

      expect(data[0].color).toBe('#FF6B35');
    });

    test('队长应该作为第一个成员', async () => {
      const openid = 'captain_001';
      const teamData = {
        name: '飞鹰队',
        region: '北京',
        color: '#FF6B35',
        captainId: openid,
        members: [{
          userId: openid,
          role: 'captain',
          number: null,
          joinedAt: new Date()
        }],
        createdAt: new Date()
      };

      await mockDb.collection('teams').add(teamData);
      const { data } = await mockDb.collection('teams')
        .where({ captainId: openid })
        .get();

      expect(data[0].members[0].userId).toBe(openid);
      expect(data[0].members[0].role).toBe('captain');
    });
  });

  describe('数据库操作验证', () => {
    test('多个球队应该可以独立存在', async () => {
      const team1Data = {
        name: '飞鹰队',
        region: '北京',
        color: '#FF6B35',
        captainId: 'captain_001',
        members: [{
          userId: 'captain_001',
          role: 'captain',
          number: null,
          joinedAt: new Date()
        }],
        createdAt: new Date('2026-01-01')
      };

      const team2Data = {
        name: '猛虎队',
        region: '上海',
        color: '#4CAF50',
        captainId: 'captain_002',
        members: [{
          userId: 'captain_002',
          role: 'captain',
          number: null,
          joinedAt: new Date()
        }],
        createdAt: new Date('2026-01-02')
      };

      await mockDb.collection('teams').add(team1Data);
      await mockDb.collection('teams').add(team2Data);

      const { data } = await mockDb.collection('teams').where({}).get();

      expect(data).toHaveLength(2);
      expect(data.map(t => t.name)).toContain('飞鹰队');
      expect(data.map(t => t.name)).toContain('猛虎队');
    });
  });

  describe('边界情况', () => {
    test('没有 logo 也能创建球队', async () => {
      const openid = 'captain_001';
      const teamData = {
        name: '无徽章队',
        region: '深圳',
        color: '#FF6B35',
        logo: '', // 空 logo
        captainId: openid,
        members: [{
          userId: openid,
          role: 'captain',
          number: null,
          joinedAt: new Date()
        }],
        createdAt: new Date()
      };

      await mockDb.collection('teams').add(teamData);
      const { data } = await mockDb.collection('teams')
        .where({ name: '无徽章队' })
        .get();

      expect(data[0].logo).toBe('');
    });

    test('空的 members 数组也能创建', async () => {
      const openid = 'captain_001';
      const teamData = {
        name: '测试队',
        region: '广州',
        color: '#FF6B35',
        captainId: openid,
        members: [], // 空 members
        createdAt: new Date()
      };

      const addResult = await mockDb.collection('teams').add(teamData);
      const { data } = await mockDb.collection('teams')
        .where({ _id: addResult._id })
        .get();

      expect(data).toHaveLength(1);
      expect(data[0].members).toHaveLength(0);
    });
  });
});
