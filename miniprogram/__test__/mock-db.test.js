const mockDb = require('./mock-db');

// 简单测试验证 mock-db 是否工作
describe('Mock Database', () => {
  beforeEach(() => {
    mockDb.reset();
  });

  test('should add user to users collection', async () => {
    const user = {
      openid: 'test_openid',
      nickName: 'Test User',
    };

    await mockDb.collection('users').add(user);

    const { data } = await mockDb.collection('users')
      .where({ openid: 'test_openid' })
      .get();

    expect(data.length).toBe(1);
    expect(data[0].nickName).toBe('Test User');
  });

  test('should add team to teams collection', async () => {
    const team = {
      name: 'Test Team',
      captainId: 'captain_openid',
      members: [{ userId: 'captain_openid', role: 'captain' }],
    };

    await mockDb.collection('teams').add(team);

    const { data } = await mockDb.collection('teams')
      .where({ name: 'Test Team' })
      .get();

    expect(data.length).toBe(1);
    expect(data[0].name).toBe('Test Team');
  });

  test('should add member to team_members collection', async () => {
    const member = {
      team_id: 'team_001',
      openid: 'user_openid',
      role: 'member',
    };

    await mockDb.collection('team_members').add(member);

    const { data } = await mockDb.collection('team_members')
      .where({ team_id: 'team_001' })
      .get();

    expect(data.length).toBe(1);
    expect(data[0].openid).toBe('user_openid');
  });
});
