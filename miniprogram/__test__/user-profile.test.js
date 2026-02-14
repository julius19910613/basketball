const mockDb = require('./mock-db');

// 模拟wx.cloud对象，特别是db方法
wx.cloud = {
  database: jest.fn(() => mockDb),
};

describe('User Profile Database Operations', () => {
  beforeEach(() => {
    mockDb.reset(); // 每次测试前重置模拟数据库
    wx.cloud.database.mockClear(); // 清除mockDb的调用记录
  });

  // Test Case: Add a new user profile
  test('should add a new user profile', async () => {
    const userProfile = {
      openid: 'test_openid_1',
      nickName: 'Test User 1',
      avatarUrl: 'http://example.com/avatar1.jpg',
      height: 180,
      weight: 75,
      position: 'PG',
      skills: ['dribbling', 'shooting'],
    };

    const db = wx.cloud.database();
    const res = await db.collection('users').add(userProfile);

    expect(db.collection).toHaveBeenCalledWith('users');
    expect(res._id).toBeDefined();

    const { data } = await db.collection('users').where({ openid: 'test_openid_1' }).get();
    expect(data.length).toBe(1);
    expect(data[0]).toMatchObject(userProfile);
  });

  // Test Case: Get user profile by openid
  test('should get a user profile by openid', async () => {
    const userProfile = {
      openid: 'test_openid_2',
      nickName: 'Test User 2',
      avatarUrl: 'http://example.com/avatar2.jpg',
      height: 175,
      weight: 70,
      position: 'SG',
      skills: ['passing'],
    };
    await wx.cloud.database().collection('users').add(userProfile);

    const db = wx.cloud.database();
    const { data } = await db.collection('users').where({ openid: 'test_openid_2' }).get();

    expect(db.collection).toHaveBeenCalledWith('users');
    expect(data.length).toBe(1);
    expect(data[0]).toMatchObject(userProfile);
  });

  // Test Case: Update an existing user profile
  test('should update an existing user profile', async () => {
    const userProfile = {
      openid: 'test_openid_3',
      nickName: 'Test User 3',
      avatarUrl: 'http://example.com/avatar3.jpg',
      height: 170,
      weight: 65,
      position: 'SF',
      skills: ['rebounding'],
    };
    const addRes = await wx.cloud.database().collection('users').add(userProfile);
    const userId = addRes._id;

    const updatedData = {
      nickName: 'Updated Test User 3',
      height: 172,
      skills: ['rebounding', 'blocking'],
    };

    const db = wx.cloud.database();
    const updateRes = await db.collection('users').doc(userId).update({ data: updatedData });

    expect(updateRes.stats.updated).toBe(1);

    const { data } = await db.collection('users').where({ openid: 'test_openid_3' }).get();
    expect(data.length).toBe(1);
    expect(data[0].nickName).toBe('Updated Test User 3');
    expect(data[0].height).toBe(172);
    expect(data[0].skills).toEqual(['rebounding', 'blocking']);
  });

  // Test Case: Remove a user profile
  test('should remove a user profile', async () => {
    const userProfile = {
      openid: 'test_openid_4',
      nickName: 'Test User 4',
      avatarUrl: 'http://example.com/avatar4.jpg',
      height: 185,
      weight: 80,
      position: 'PF',
      skills: ['blocking'],
    };
    const addRes = await wx.cloud.database().collection('users').add(userProfile);
    const userId = addRes._id;

    const db = wx.cloud.database();
    const removeRes = await db.collection('users').doc(userId).remove();

    expect(removeRes.stats.removed).toBe(1);

    const { data } = await db.collection('users').where({ openid: 'test_openid_4' }).get();
    expect(data.length).toBe(0);
  });
});