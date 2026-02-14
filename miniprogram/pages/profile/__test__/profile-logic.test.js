// pages/profile/__test__/profile-logic.test.js
// 纯函数逻辑测试，不涉及页面渲染
const mockDb = require('../../../__test__/mock-db');

// 模拟 wx 全局对象
wx.cloud = {
  callFunction: jest.fn(({ name }) => {
    if (name === 'getOpenId') {
      return Promise.resolve({ result: { openid: 'mock_test_openid' } });
    }
    return Promise.resolve({});
  }),
  database: jest.fn(() => mockDb),
  uploadFile: jest.fn(),
};

wx.showToast = jest.fn();
wx.showLoading = jest.fn();
wx.hideLoading = jest.fn();
wx.chooseImage = jest.fn();
wx.showModal = jest.fn();

describe('Profile Page - 纯函数逻辑测试', () => {
  beforeEach(() => {
    mockDb.reset();
    wx.cloud.callFunction.mockClear();
    wx.showToast.mockClear();
  });

  describe('用户资料创建', () => {
    test('应该成功创建新用户资料', async () => {
      const openid = 'new_user_001';
      const profileData = {
        nickName: '新玩家',
        avatarUrl: '/images/default_avatar.png',
        height: 180,
        weight: 75,
        position: 'PG (控球后卫)',
        skills: ['运球', '投篮'],
        openid: openid,
        create_time: new Date()
      };

      const addResult = await mockDb.collection('users').add(profileData);

      expect(addResult._id).toBeDefined();
      expect(addResult._id).toMatch(/^mock-user-id-\d+$/);

      // 验证能查询到
      const { data } = await mockDb.collection('users')
        .where({ openid })
        .get();

      expect(data).toHaveLength(1);
      expect(data[0].nickName).toBe('新玩家');
    });

    test('应该正确解析技能字符串为数组', () => {
      const skillsString = '运球,投篮,传球, 防守';

      // 模拟页面中的解析逻辑
      const skillsArray = skillsString.split(/[,，\s]+/).filter(s => s.trim() !== '');

      expect(skillsArray).toEqual(['运球', '投篮', '传球', '防守']);
    });

    test('应该正确解析不同格式的技能字符串', () => {
      const testCases = [
        { input: '运球', expected: ['运球'] },
        { input: '运球 投篮', expected: ['运球', '投篮'] },
        { input: '运球,投篮', expected: ['运球', '投篮'] },
        { input: '运球，投篮', expected: ['运球', '投篮'] },
        { input: '运球, 投篮', expected: ['运球', '投篮'] },
        { input: '  运球  ,  投篮  ', expected: ['运球', '投篮'] },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = input.split(/[,，\s]+/).filter(s => s.trim() !== '');
        expect(result).toEqual(expected);
      });
    });

    test('空技能字符串应该返回空数组', () => {
      const testCases = ['', '   ', ', , '];

      testCases.forEach(input => {
        const result = input.split(/[,，\s]+/).filter(s => s.trim() !== '');
        expect(result).toEqual([]);
      });
    });
  });

  describe('用户资料更新', () => {
    test('应该更新用户资料', async () => {
      const openid = 'existing_user_001';
      const originalProfile = {
        nickName: '旧名字',
        height: 170,
        weight: 60,
        position: 'C (中锋)',
        skills: ['防守'],
        openid: openid,
        create_time: new Date()
      };

      const addResult = await mockDb.collection('users').add(originalProfile);

      // 更新
      const updatedData = {
        nickName: '新名字',
        height: 175,
        weight: 70,
        position: 'PF (大前锋)',
        skills: ['防守', '篮板']
      };

      await mockDb.collection('users').doc(addResult._id).update({ data: updatedData });

      // 验证更新
      const { data } = await mockDb.collection('users')
        .where({ openid })
        .get();

      expect(data).toHaveLength(1);
      expect(data[0].nickName).toBe('新名字');
      expect(data[0].height).toBe(175);
      expect(data[0].weight).toBe(70);
      expect(data[0].position).toBe('PF (大前锋)');
      expect(data[0].skills).toEqual(['防守', '篮板']);
    });

    test('应该支持部分字段更新', async () => {
      const openid = 'partial_update_user';
      const originalProfile = {
        nickName: '玩家',
        height: 180,
        weight: 75,
        position: 'PG (控球后卫)',
        skills: ['运球'],
        openid: openid,
        create_time: new Date()
      };

      const addResult = await mockDb.collection('users').add(originalProfile);

      // 只更新身高和体重
      const partialUpdate = {
        height: 185,
        weight: 80
      };

      await mockDb.collection('users').doc(addResult._id).update({ data: partialUpdate });

      // 验证更新
      const { data } = await mockDb.collection('users')
        .where({ openid })
        .get();

      expect(data[0].height).toBe(185);
      expect(data[0].weight).toBe(80);
      // 其他字段保持不变
      expect(data[0].nickName).toBe('玩家');
      expect(data[0].position).toBe('PG (控球后卫)');
      expect(data[0].skills).toEqual(['运球']);
    });
  });

  describe('位置选择逻辑', () => {
    test('应该正确找到位置索引', () => {
      const positions = ['PG (控球后卫)', 'SG (得分后卫)', 'SF (小前锋)', 'PF (大前锋)', 'C (中锋)', '其他'];

      const testCases = [
        { position: 'PG (控球后卫)', expectedIndex: 0 },
        { position: 'SG (得分后卫)', expectedIndex: 1 },
        { position: 'SF (小前锋)', expectedIndex: 2 },
        { position: 'PF (大前锋)', expectedIndex: 3 },
        { position: 'C (中锋)', expectedIndex: 4 },
        { position: '其他', expectedIndex: 5 },
        { position: '未知位置', expectedIndex: 5 }, // 未知位置默认为'其他'
      ];

      testCases.forEach(({ position, expectedIndex }) => {
        const index = positions.indexOf(position);
        const actualIndex = index !== -1 ? index : positions.length - 1;
        expect(actualIndex).toBe(expectedIndex);
      });
    });
  });

  describe('边界情况', () => {
    test('用户不存在时应该返回空数组', async () => {
      const { data } = await mockDb.collection('users')
        .where({ openid: 'nonexistent_user' })
        .get();

      expect(data).toHaveLength(0);
    });

    test('应该处理 null 和 undefined 字段', async () => {
      const openid = 'user_with_nulls';
      const profileData = {
        nickName: '玩家',
        height: null,
        weight: undefined,
        position: '',
        skills: [],
        openid: openid,
        create_time: new Date()
      };

      await mockDb.collection('users').add(profileData);

      const { data } = await mockDb.collection('users')
        .where({ openid })
        .get();

      expect(data[0].height).toBe(null);
      expect(data[0].weight).toBeUndefined();
      expect(data[0].position).toBe('');
      expect(data[0].skills).toEqual([]);
    });

    test('应该处理空昵称', async () => {
      const openid = 'user_empty_name';
      const profileData = {
        nickName: '',
        height: 180,
        weight: 75,
        openid: openid,
        create_time: new Date()
      };

      const addResult = await mockDb.collection('users').add(profileData);

      const { data } = await mockDb.collection('users')
        .where({ openid })
        .get();

      expect(data[0].nickName).toBe('');
    });
  });
});
