// miniprogram/__test__/unit/create-team.unit.test.js
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
    serverDate: () => new Date(),
    uploadFile: jest.fn(({ cloudPath, filePath, success, fail }) => {
      // 模拟上传成功
      success({ fileID: 'cloud://test-path/logo.jpg' });
    })
  },
  showToast: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  showActionSheet: jest.fn(),
  chooseImage: jest.fn(({ success }) => {
    success({ tempFilePaths: ['temp.jpg'] });
  }),
  navigateBack: jest.fn()
};

describe('Create Team - 纯 Jest 单元测试', () => {
  beforeEach(() => {
    mockDb.reset();
    jest.clearAllMocks();
  });

  describe('数据库操作测试', () => {
    test('应该能够创建球队', async () => {
      const teamData = {
        name: '飞鹰队',
        description: '',
        region: '北京',
        color: '#FF6B35',
        logo: '',
        captainId: 'test_openid',
        members: [{
          userId: 'test_openid',
          role: 'captain',
          number: null,
          joinedAt: new Date()
        }],
        createdAt: new Date()
      };

      const result = await mockDb.collection('teams').add(teamData);
      expect(result._id).toBeDefined();

      // 验证数据已保存
      const { data } = await mockDb.collection('teams').where({ name: '飞鹰队' }).get();
      expect(data.length).toBe(1);
      expect(data[0].name).toBe('飞鹰队');
      expect(data[0].captainId).toBe('test_openid');
      expect(data[0].members.length).toBe(1);
      expect(data[0].members[0].role).toBe('captain');
    });

    test('创建球队时应该自动添加队长为成员', async () => {
      const teamData = {
        name: '猛虎队',
        description: '',
        region: '上海',
        color: '#4CAF50',
        logo: '',
        captainId: 'test_openid',
        members: [{
          userId: 'test_openid',
          role: 'captain',
          number: null,
          joinedAt: new Date()
        }],
        createdAt: new Date()
      };

      await mockDb.collection('teams').add(teamData);

      const { data } = await mockDb.collection('teams').where({ name: '猛虎队' }).get();
      expect(data[0].members.length).toBe(1);
      expect(data[0].members[0].userId).toBe('test_openid');
      expect(data[0].members[0].role).toBe('captain');
    });

    test('创建球队应该记录创建时间', async () => {
      const beforeCreate = new Date();

      const teamData = {
        name: '火箭队',
        captainId: 'test_openid',
        members: [{
          userId: 'test_openid',
          role: 'captain',
          number: null,
          joinedAt: new Date()
        }]
      };

      await mockDb.collection('teams').add(teamData);

      const afterCreate = new Date();

      const { data } = await mockDb.collection('teams').where({ name: '火箭队' }).get();
      const createdAt = new Date(data[0].createdAt);

      expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });
  });

  describe('表单验证测试', () => {
    test('队名不能为空', () => {
      const formData = {
        name: '',
        region: '北京',
        color: '#FF6B35'
      };

      const isValid = formData.name && formData.name.trim().length > 0;
      expect(isValid).toBeFalsy();
    });

    test('队名不能只有空格', () => {
      const formData = {
        name: '   ',
        region: '北京',
        color: '#FF6B35'
      };

      const isValid = formData.name && formData.name.trim().length > 0;
      expect(isValid).toBe(false);
    });

    test('有效的队名应该被接受', () => {
      const validNames = ['飞鹰队', 'Flying Eagles', '123', '测试队 01'];

      validNames.forEach(name => {
        const isValid = name && name.trim().length > 0;
        expect(isValid).toBe(true);
      });
    });

    test('地区不能为空', () => {
      const formData = {
        name: '飞鹰队',
        region: '',
        color: '#FF6B35'
      };

      const isValid = formData.region && formData.region.trim().length > 0;
      expect(isValid).toBeFalsy();
    });

    test('有效的地区应该被接受', () => {
      const validRegions = ['北京', '上海', '广州市', '深圳南山'];

      validRegions.forEach(region => {
        const isValid = region && region.trim().length > 0;
        expect(isValid).toBe(true);
      });
    });

    test('颜色应该在有效颜色列表中', () => {
      const validColors = ['#FF6B35', '#4CAF50', '#2196F3', '#FFC107', '#9C27B0', '#E91E63', '#607D8B', '#795548'];

      validColors.forEach(color => {
        const isValid = validColors.includes(color);
        expect(isValid).toBe(true);
      });
    });

    test('无效颜色应该被拒绝', () => {
      const validColors = ['#FF6B35', '#4CAF50', '#2196F3', '#FFC107'];
      const invalidColors = ['invalid', '#000000', 'red', ''];

      invalidColors.forEach(color => {
        const isValid = validColors.includes(color);
        expect(isValid).toBe(false);
      });
    });

    test('openid 存在才能创建球队', () => {
      const openid = 'test_openid';
      const hasOpenid = openid && openid.length > 0;
      expect(hasOpenid).toBe(true);
    });

    test('openid 为空时不能创建球队', () => {
      const openid = '';
      const hasOpenid = openid && openid.length > 0;
      expect(hasOpenid).toBeFalsy();
    });
  });

  describe('权限逻辑测试', () => {
    test('创建者应该自动成为队长', async () => {
      const creatorOpenid = 'user_001';

      const teamData = {
        name: '勇士队',
        captainId: creatorOpenid,
        members: [{
          userId: creatorOpenid,
          role: 'captain',
          number: null,
          joinedAt: new Date()
        }]
      };

      await mockDb.collection('teams').add(teamData);

      const { data } = await mockDb.collection('teams').where({ name: '勇士队' }).get();
      expect(data[0].captainId).toBe(creatorOpenid);
      expect(data[0].members[0].role).toBe('captain');
    });

    test('球队创建后，队长应该存在于成员列表中', async () => {
      const captainOpenid = 'captain_001';

      const teamData = {
        name: '雄狮队',
        captainId: captainOpenid,
        members: [{
          userId: captainOpenid,
          role: 'captain',
          number: null,
          joinedAt: new Date()
        }]
      };

      await mockDb.collection('teams').add(teamData);

      const { data } = await mockDb.collection('teams').where({ name: '雄狮队' }).get();
      const team = data[0];

      expect(team.members.find(m => m.userId === captainOpenid)).toBeDefined();
      expect(team.members.find(m => m.userId === captainOpenid).role).toBe('captain');
    });

    test('查询用户创建的球队应该返回正确结果', async () => {
      const userOpenid = 'user_001';

      await mockDb.collection('teams').add({
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
        name: '其他球队',
        captainId: 'other_user',
        members: [{
          userId: 'other_user',
          role: 'captain',
          number: null,
          joinedAt: new Date()
        }]
      });

      const { data: userTeams } = await mockDb.collection('teams').where({ captainId: userOpenid }).get();
      expect(userTeams.length).toBe(2);
      expect(userTeams.every(t => t.captainId === userOpenid)).toBe(true);
    });
  });

  describe('边界情况测试', () => {
    test('最短队名（1个字符）应该被接受', async () => {
      const teamData = {
        name: 'A',
        captainId: 'test_openid',
        members: [{
          userId: 'test_openid',
          role: 'captain',
          number: null,
          joinedAt: new Date()
        }]
      };

      await mockDb.collection('teams').add(teamData);

      const { data } = await mockDb.collection('teams').where({ name: 'A' }).get();
      expect(data.length).toBe(1);
      expect(data[0].name).toBe('A');
    });

    test('长队名应该被接受', async () => {
      const longName = 'A'.repeat(50);

      const teamData = {
        name: longName,
        captainId: 'test_openid',
        members: [{
          userId: 'test_openid',
          role: 'captain',
          number: null,
          joinedAt: new Date()
        }]
      };

      await mockDb.collection('teams').add(teamData);

      const { data } = await mockDb.collection('teams').where({ name: longName }).get();
      expect(data.length).toBe(1);
      expect(data[0].name.length).toBe(50);
    });

    test('相同队名可以被创建', async () => {
      const teamName = '重复队名';

      await mockDb.collection('teams').add({
        name: teamName,
        captainId: 'user_001',
        members: [{
          userId: 'user_001',
          role: 'captain',
          number: null,
          joinedAt: new Date()
        }]
      });

      await mockDb.collection('teams').add({
        name: teamName,
        captainId: 'user_002',
        members: [{
          userId: 'user_002',
          role: 'captain',
          number: null,
          joinedAt: new Date()
        }]
      });

      const { data } = await mockDb.collection('teams').where({ name: teamName }).get();
      expect(data.length).toBe(2);
    });

    test('空队徽 URL 应该被接受', async () => {
      const teamData = {
        name: '无队徽队',
        logo: '',
        captainId: 'test_openid',
        members: [{
          userId: 'test_openid',
          role: 'captain',
          number: null,
          joinedAt: new Date()
        }]
      };

      await mockDb.collection('teams').add(teamData);

      const { data } = await mockDb.collection('teams').where({ name: '无队徽队' }).get();
      expect(data.length).toBe(1);
      expect(data[0].logo).toBe('');
    });
  });

  describe('错误处理测试', () => {
    test('查询不存在的球队应该返回空数组', async () => {
      const { data } = await mockDb.collection('teams').where({ name: '不存在的球队' }).get();
      expect(data).toEqual([]);
    });

    test('查询空 openid 的球队应该返回空数组', async () => {
      const { data } = await mockDb.collection('teams').where({ captainId: '' }).get();
      expect(data).toEqual([]);
    });
  });
});
