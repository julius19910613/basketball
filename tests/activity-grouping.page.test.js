const path = require("path");

function applySetData(target, patch) {
  Object.keys(patch).forEach((key) => {
    if (!key.includes(".")) {
      target[key] = patch[key];
      return;
    }
    const segments = key.split(".");
    let cursor = target;
    for (let i = 0; i < segments.length - 1; i += 1) {
      const seg = segments[i];
      cursor[seg] = cursor[seg] || {};
      cursor = cursor[seg];
    }
    cursor[segments[segments.length - 1]] = patch[key];
  });
}

function loadPage(relativePath) {
  jest.resetModules();
  let pageConfig = null;
  global.wx = {
    cloud: {
      database: jest.fn(() => ({
        collection: jest.fn(() => ({
          orderBy: jest.fn(() => ({
            get: jest.fn(async () => ({ data: [] }))
          }))
        }))
      }))
    },
    showToast: jest.fn(),
    showLoading: jest.fn(),
    hideLoading: jest.fn(),
    redirectTo: jest.fn(),
    navigateBack: jest.fn()
  };
  global.Page = (config) => {
    pageConfig = config;
    return config;
  };
  require(path.resolve(__dirname, "..", relativePath));
  const page = {
    data: JSON.parse(JSON.stringify(pageConfig.data || {})),
    setData(next) {
      applySetData(this.data, next);
    }
  };
  Object.keys(pageConfig).forEach((key) => {
    if (typeof pageConfig[key] === "function") page[key] = pageConfig[key].bind(page);
  });
  return { page, wxMock: global.wx };
}

describe("activity grouping page", () => {
  test("builds grouping snapshot from current team groups", () => {
    const { page } = loadPage("miniprogram/pages/activity/grouping/grouping.ts");
    page.setData({
      activity: {
        teamNames: ["白队", "黑队", "红队"],
        groupingSnapshot: { version: 3 }
      },
      selectedPlayerIds: ["p1", "p2", "p3", "p4", "p5", "p6"],
      teamGroups: [
        { teamName: "白队", playerIds: ["p1", "p2"] },
        { teamName: "黑队", playerIds: ["p3", "p4"] },
        { teamName: "红队", playerIds: ["p5", "p6"] }
      ]
    });

    expect(page.buildGroupingSnapshot()).toEqual({
      version: 3,
      selectedPlayerIds: ["p1", "p2", "p3", "p4", "p5", "p6"],
      teams: [
        { teamName: "白队", playerIds: ["p1", "p2"] },
        { teamName: "黑队", playerIds: ["p3", "p4"] },
        { teamName: "红队", playerIds: ["p5", "p6"] }
      ],
      lockedAt: null
    });
  });

  test("auto balance splits six players across three groups", () => {
    const { page } = loadPage("miniprogram/pages/activity/grouping/grouping.ts");
    page.setData({
      players: [
        { playerId: "p1", overall: 99 },
        { playerId: "p2", overall: 90 },
        { playerId: "p3", overall: 81 },
        { playerId: "p4", overall: 72 },
        { playerId: "p5", overall: 63 },
        { playerId: "p6", overall: 54 }
      ],
      selectedPlayerIds: ["p1", "p2", "p3", "p4", "p5", "p6"],
      teamGroups: [
        { teamName: "白队", playerIds: [] },
        { teamName: "黑队", playerIds: [] },
        { teamName: "红队", playerIds: [] }
      ]
    });

    page.onAutoBalance();
    const total = page.data.teamGroups.reduce((sum, item) => sum + item.playerIds.length, 0);
    const overlap = page.data.teamGroups[0].playerIds.filter((id) => page.data.teamGroups[1].playerIds.includes(id) || page.data.teamGroups[2].playerIds.includes(id));
    expect(total).toBe(6);
    expect(overlap).toHaveLength(0);
  });
});
