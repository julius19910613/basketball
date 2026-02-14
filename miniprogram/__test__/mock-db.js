let mockUsersCollection = []; // 模拟users集合的数据
let mockTeamsCollection = []; // 模拟teams集合的数据
let mockTeamMembersCollection = []; // 模拟team_members集合的数据
let mockMatchesCollection = []; // 模拟matches集合的数据

// 通用排序函数
function sortCollection(collection, field, order) {
  return collection.sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];

    // 处理日期对象
    const aTime = aVal instanceof Date ? aVal.getTime() : aVal;
    const bTime = bVal instanceof Date ? bVal.getTime() : bVal;

    if (aTime < bTime) return order === 'desc' ? 1 : -1;
    if (aTime > bTime) return order === 'desc' ? -1 : 1;
    return 0;
  });
}

const mockDb = {
  collection: jest.fn((name) => {
    if (name === 'users') {
      return {
        add: jest.fn((data) => {
          const newDoc = {
            _id: `mock-user-id-${mockUsersCollection.length}`,
            ...data,
            createdAt: data.createdAt || new Date() // 只有当 data 中没有 createdAt 时才使用当前时间
          };
          mockUsersCollection.push(newDoc);
          return Promise.resolve({ _id: newDoc._id });
        }),
        where: jest.fn((query) => {
          return {
            orderBy: jest.fn((field, order) => {
              return {
                get: jest.fn(() => {
                  const result = mockUsersCollection.filter(user => {
                    // 简化查询逻辑，只支持单字段精确匹配
                    for (const key in query) {
                      if (user[key] !== query[key]) {
                        return false;
                      }
                    }
                    return true;
                  });
                  const sorted = sortCollection([...result], field, order);
                  return Promise.resolve({ data: sorted });
                }),
              };
            }),
            get: jest.fn(() => {
              const result = mockUsersCollection.filter(user => {
                for (const key in query) {
                  if (user[key] !== query[key]) {
                    return false;
                  }
                }
                return true;
              });
              return Promise.resolve({ data: result });
            }),
          };
        }),
        doc: jest.fn((id) => {
          return {
            update: jest.fn(({ data }) => {
              const index = mockUsersCollection.findIndex(user => user._id === id);
              if (index > -1) {
                mockUsersCollection[index] = { ...mockUsersCollection[index], ...data };
                return Promise.resolve({ stats: { updated: 1 } });
              }
              return Promise.resolve({ stats: { updated: 0 } });
            }),
            remove: jest.fn(() => {
              const initialLength = mockUsersCollection.length;
              mockUsersCollection = mockUsersCollection.filter(user => user._id !== id);
              return Promise.resolve({ stats: { removed: initialLength !== mockUsersCollection.length ? 1 : 0 } });
            })
          };
        }),
      };
    }
    if (name === 'teams') {
      return {
        add: jest.fn((data) => {
          const newDoc = {
            _id: `mock-team-id-${mockTeamsCollection.length}`,
            ...data,
            createdAt: data.createdAt || new Date()
          };
          mockTeamsCollection.push(newDoc);
          return Promise.resolve({ _id: newDoc._id });
        }),
        where: jest.fn((query) => {
          return {
            orderBy: jest.fn((field, order) => {
              return {
                get: jest.fn(() => {
                  let result = mockTeamsCollection.filter(team => {
                    // 处理 $or 查询
                    if (query.$or) {
                      return query.$or.some(condition => {
                        // 检查 captainId
                        if (condition.captainId) {
                          return team.captainId === condition.captainId;
                        }
                        // 检查 members.userId
                        if (condition['members.userId']) {
                          return team.members && team.members.some(m => m.userId === condition['members.userId']);
                        }
                        return false;
                      });
                    }
                    // 普通查询
                    if (query.captainId) {
                      if (team.captainId !== query.captainId) {
                        return false;
                      }
                    }
                    if (query['members.userId']) {
                      if (!team.members || !team.members.some(m => m.userId === query['members.userId'])) {
                        return false;
                      }
                    }
                    if (query.name) {
                      if (team.name !== query.name) {
                        return false;
                      }
                    }
                    if (query['homeTeam._id']) {
                      if (team._id !== query['homeTeam._id']) {
                        return false;
                      }
                    }
                    if (query['awayTeam._id']) {
                      if (team._id !== query['awayTeam._id']) {
                        return false;
                      }
                    }
                    return true;
                  });
                  const sorted = sortCollection([...result], field, order);
                  return Promise.resolve({ data: sorted });
                }),
              };
            }),
            get: jest.fn(() => {
              let result = mockTeamsCollection.filter(team => {
                if (query.captainId) {
                  if (team.captainId !== query.captainId) {
                    return false;
                  }
                }
                if (query['members.userId']) {
                  if (!team.members || !team.members.some(m => m.userId === query['members.userId'])) {
                    return false;
                  }
                }
                if (query.name) {
                  if (team.name !== query.name) {
                    return false;
                  }
                }
                if (query['homeTeam._id']) {
                  if (team._id !== query['homeTeam._id']) {
                    return false;
                  }
                }
                if (query['awayTeam._id']) {
                  if (team._id !== query['awayTeam._id']) {
                    return false;
                  }
                }
                return true;
              });
              return Promise.resolve({ data: result });
            }),
          };
        }),
        doc: jest.fn((id) => {
          const index = mockTeamsCollection.findIndex(team => team._id === id);
          const team = index >= 0 ? mockTeamsCollection[index] : null;
          return {
            get: jest.fn(() => {
              return Promise.resolve({ data: team ? [team] : [] });
            }),
            update: jest.fn(({ data }) => {
              if (index > -1) {
                mockTeamsCollection[index] = { ...mockTeamsCollection[index], ...data };
                return Promise.resolve({ stats: { updated: 1 } });
              }
              return Promise.resolve({ stats: { updated: 0 } });
            }),
          };
        }),
      };
    }
    if (name === 'team_members') {
      return {
        add: jest.fn((data) => {
          const newDoc = {
            _id: `mock-member-id-${mockTeamMembersCollection.length}`,
            ...data,
            createdAt: data.createdAt || new Date()
          };
          mockTeamMembersCollection.push(newDoc);
          return Promise.resolve({ _id: newDoc._id });
        }),
        where: jest.fn((query) => {
          return {
            get: jest.fn(() => {
              const result = mockTeamMembersCollection.filter(member => {
                if (query.team_id && member.team_id !== query.team_id) {
                  return false;
                }
                return true;
              });
              return Promise.resolve({ data: result });
            }),
          };
        }),
        doc: jest.fn((id) => {
          return {
            update: jest.fn(({ data }) => {
              const index = mockTeamMembersCollection.findIndex(m => m._id === id);
              if (index > -1) {
                mockTeamMembersCollection[index] = { ...mockTeamMembersCollection[index], ...data };
                return Promise.resolve({ stats: { updated: 1 } });
              }
              return Promise.resolve({ stats: { updated: 0 } });
            }),
            remove: jest.fn(() => {
              const initialLength = mockTeamMembersCollection.length;
              mockTeamMembersCollection = mockTeamMembersCollection.filter(m => m._id !== id);
              return Promise.resolve({ stats: { removed: initialLength !== mockTeamMembersCollection.length ? 1 : 0 } });
            })
          };
        }),
      };
    }
    if (name === 'matches') {
      return {
        add: jest.fn((data) => {
          const newDoc = {
            _id: `mock-match-id-${mockMatchesCollection.length}`,
            ...data,
            createdAt: data.createdAt || new Date()
          };
          mockMatchesCollection.push(newDoc);
          return Promise.resolve({ _id: newDoc._id });
        }),
        where: jest.fn((query) => {
          return {
            get: jest.fn(() => {
              const result = mockMatchesCollection.filter(match => {
                for (const key in query) {
                  if (match[key] !== query[key]) {
                    return false;
                  }
                }
                return true;
              });
              return Promise.resolve({ data: result });
            }),
          };
        }),
      };
    }
    // 未知集合返回空对象
    return {
      add: jest.fn(),
      where: jest.fn(() => ({ get: jest.fn(() => Promise.resolve({ data: [] })) })),
    };
  }),
};

// 模拟 db.command
mockDb.command = {
  or: jest.fn((conditions) => ({ $or: conditions })),
  in: jest.fn((values) => ({ $in: values })),
};

// 重置模拟数据，以便每次测试都是干净的环境
mockDb.reset = () => {
  mockUsersCollection.length = 0;
  mockTeamsCollection.length = 0;
  mockTeamMembersCollection.length = 0;
  mockMatchesCollection.length = 0;
};

module.exports = mockDb;
