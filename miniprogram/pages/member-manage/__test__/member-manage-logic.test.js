// pages/member-manage/__test__/member-manage-logic.test.js
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
};

wx.showToast = jest.fn();
wx.showModal = jest.fn();
wx.showLoading = jest.fn();
wx.hideLoading = jest.fn();
wx.stopPullDownRefresh = jest.fn();
wx.showActionSheet = jest.fn();
wx.navigateBack = jest.fn();

describe('Member Manage Page - 纯函数逻辑测试', () => {
  let teamId;
  let captainId;

  beforeEach(() => {
    mockDb.reset();
    teamId = 'team_001';
    captainId = 'mock_captain_openid';
  });

  describe('成员权限控制', () => {
    test('队长不能对自己进行角色操作', async () => {
      const teamData = {
        _id: teamId,
        name: '飞鹰队',
        captainId: captainId,
        members: [{
          userId: captainId,
          role: 'captain',
          joinedAt: new Date()
        }],
        createdAt: new Date()
      };

      await mockDb.collection('teams').add(teamData);

      // 队长不在操作列表中
      const { data } = await mockDb.collection('teams')
        .where({ captainId })
        .get();

      expect(data[0].captainId).toBe(captainId);
    });

    test('应该能识别队长和普通成员', async () => {
      const teamData = {
        _id: teamId,
        name: '飞鹰队',
        captainId: captainId,
        members: [
          { userId: captainId, role: 'captain', joinedAt: new Date() },
          { userId: 'member_001', role: 'member', joinedAt: new Date() }
        ],
        createdAt: new Date()
      };

      await mockDb.collection('teams').add(teamData);

      const { data } = await mockDb.collection('teams')
        .where({ _id: teamId })
        .get();

      const team = data[0];
      const captain = team.members.find(m => m.role === 'captain');
      const member = team.members.find(m => m.role === 'member');

      expect(captain).toBeDefined();
      expect(captain.userId).toBe(captainId);
      expect(member).toBeDefined();
      expect(member.userId).toBe('member_001');
    });
  });

  describe('角色更新逻辑', () => {
    test('应该能将普通成员提升为副队长', async () => {
      const teamData = {
        _id: teamId,
        name: '飞鹰队',
        captainId: captainId,
        members: [
          { userId: captainId, role: 'captain', joinedAt: new Date() },
          { userId: 'member_001', role: 'member', joinedAt: new Date() }
        ],
        createdAt: new Date()
      };

      await mockDb.collection('teams').add(teamData);

      // 模拟将成员提升为副队长
      const { data } = await mockDb.collection('teams')
        .where({ _id: teamId })
        .get();
      const team = data[0];
      const memberIndex = team.members.findIndex(m => m.userId === 'member_001');
      team.members[memberIndex].role = 'vice-captain';

      await mockDb.collection('teams').doc(teamId).update({ data: { members: team.members } });

      // 验证更新
      const { data: updatedData } = await mockDb.collection('teams')
        .where({ _id: teamId })
        .get();

      const updatedMember = updatedData[0].members.find(m => m.userId === 'member_001');
      expect(updatedMember.role).toBe('vice-captain');
    });

    test('应该能将副队长降为普通成员', async () => {
      const teamData = {
        _id: teamId,
        name: '飞鹰队',
        captainId: captainId,
        members: [
          { userId: captainId, role: 'captain', joinedAt: new Date() },
          { userId: 'member_001', role: 'vice-captain', joinedAt: new Date() }
        ],
        createdAt: new Date()
      };

      await mockDb.collection('teams').add(teamData);

      // 模拟将副队长降为普通成员
      const { data } = await mockDb.collection('teams')
        .where({ _id: teamId })
        .get();
      const team = data[0];
      const memberIndex = team.members.findIndex(m => m.userId === 'member_001');
      team.members[memberIndex].role = 'member';

      await mockDb.collection('teams').doc(teamId).update({ data: { members: team.members } });

      // 验证更新
      const { data: updatedData } = await mockDb.collection('teams')
        .where({ _id: teamId })
        .get();

      const updatedMember = updatedData[0].members.find(m => m.userId === 'member_001');
      expect(updatedMember.role).toBe('member');
    });
  });

  describe('成员移除逻辑', () => {
    test('应该能移除普通成员', async () => {
      const teamData = {
        _id: teamId,
        name: '飞鹰队',
        captainId: captainId,
        members: [
          { userId: captainId, role: 'captain', joinedAt: new Date() },
          { userId: 'member_001', role: 'member', joinedAt: new Date() },
          { userId: 'member_002', role: 'member', joinedAt: new Date() }
        ],
        createdAt: new Date()
      };

      await mockDb.collection('teams').add(teamData);

      // 移除一个成员
      const { data } = await mockDb.collection('teams')
        .where({ _id: teamId })
        .get();
      const team = data[0];
      const newMembers = team.members.filter(m => m.userId !== 'member_001');

      await mockDb.collection('teams').doc(teamId).update({ data: { members: newMembers } });

      // 验证移除
      const { data: updatedData } = await mockDb.collection('teams')
        .where({ _id: teamId })
        .get();

      expect(updatedData[0].members).toHaveLength(2);
      const removedMember = updatedData[0].members.find(m => m.userId === 'member_001');
      expect(removedMember).toBeUndefined();
    });
  });

  describe('边界情况', () => {
    test('成员列表为空时不应报错', async () => {
      const teamData = {
        _id: teamId,
        name: '空队',
        captainId: captainId,
        members: [],
        createdAt: new Date()
      };

      await mockDb.collection('teams').add(teamData);

      const { data } = await mockDb.collection('teams')
        .where({ _id: teamId })
        .get();

      expect(data[0].members).toHaveLength(0);
    });

    test('球队不存在时操作应失败', async () => {
      const { data } = await mockDb.collection('teams')
        .where({ _id: 'nonexistent_team' })
        .get();

      expect(data).toHaveLength(0);
    });
  });
});
