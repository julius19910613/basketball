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

function loadPage(relativePath, { wxMock } = {}) {
  jest.resetModules();
  let pageConfig = null;
  global.wx = wxMock || {
    showToast: jest.fn(),
    showLoading: jest.fn(),
    hideLoading: jest.fn(),
    navigateTo: jest.fn(),
    cloud: { database: () => ({ collection: () => ({ orderBy: () => ({ get: async () => ({ data: [] }) }) }) }) }
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

describe("match grouping workflow", () => {
  test("validateGrouping requires all selected players assigned without overlap", () => {
    const helper = require("../miniprogram/utils/match-helper");
    const pass = helper.validateGrouping(["p1", "p2", "p3", "p4"], {
      teams: [
        { teamName: "A队", playerIds: ["p1", "p2"] },
        { teamName: "B队", playerIds: ["p3", "p4"] }
      ]
    });
    const fail = helper.validateGrouping(["p1", "p2"], {
      teams: [
        { teamName: "A队", playerIds: ["p1"] },
        { teamName: "B队", playerIds: ["p1"] }
      ]
    });
    expect(pass.ok).toBe(true);
    expect(fail.ok).toBe(false);
  });

  test("buildSnakeGrouping returns non-overlapping two teams", () => {
    const helper = require("../miniprogram/utils/match-helper");
    const players = [
      { playerId: "p1", overall: 99 },
      { playerId: "p2", overall: 88 },
      { playerId: "p3", overall: 77 },
      { playerId: "p4", overall: 66 }
    ];
    const grouped = helper.buildSnakeGrouping(players, ["p1", "p2", "p3", "p4"], 2);
    const overlap = grouped.groups[0].filter((id) => grouped.groups[1].includes(id));
    expect(overlap.length).toBe(0);
    expect(grouped.groups[0].length + grouped.groups[1].length).toBe(4);
  });

  test("buildBalancedTwoTeamGrouping balances PG counts and splits by height/score", () => {
    const helper = require("../miniprogram/utils/match-helper");
    const players = [
      { playerId: "a1", position: "PG", height: 170, weight: 70, overall: 60 },
      { playerId: "a2", position: "PG", height: 190, weight: 90, overall: 80 },
      { playerId: "a3", position: "PG", height: 171, weight: 71, overall: 61 },
      { playerId: "a4", position: "PG", height: 189, weight: 89, overall: 79 }
    ];
    const ids = ["a1", "a2", "a3", "a4"];
    const grouped = helper.buildBalancedTwoTeamGrouping(players, ids);
    const g0 = grouped.groups[0];
    const g1 = grouped.groups[1];
    expect(g0.length + g1.length).toBe(4);
    expect(g0.filter((id) => g1.includes(id)).length).toBe(0);
    expect(Math.abs(g0.length - g1.length)).toBe(0);
    const pg0 = g0.length;
    const pg1 = g1.length;
    expect(pg0).toBe(2);
    expect(pg1).toBe(2);
  });

  test("buildBalancedTwoTeamGrouping handles multiple positions independently", () => {
    const helper = require("../miniprogram/utils/match-helper");
    const players = [
      { playerId: "p1", position: "PG", height: 180, weight: 75, overall: 70 },
      { playerId: "p2", position: "PG", height: 182, weight: 76, overall: 72 },
      { playerId: "s1", position: "SG", height: 185, weight: 78, overall: 75 },
      { playerId: "s2", position: "SG", height: 186, weight: 79, overall: 76 }
    ];
    const grouped = helper.buildBalancedTwoTeamGrouping(players, ["p1", "p2", "s1", "s2"]);
    const g0 = new Set(grouped.groups[0]);
    const g1 = new Set(grouped.groups[1]);
    expect(g0.size + g1.size).toBe(4);
    const pgOn0 = ["p1", "p2"].filter((id) => g0.has(id)).length;
    const pgOn1 = ["p1", "p2"].filter((id) => g1.has(id)).length;
    expect(Math.abs(pgOn0 - pgOn1)).toBe(0);
    const sgOn0 = ["s1", "s2"].filter((id) => g0.has(id)).length;
    const sgOn1 = ["s1", "s2"].filter((id) => g1.has(id)).length;
    expect(Math.abs(sgOn0 - sgOn1)).toBe(0);
  });

  test("buildPlayerStatsForSelection keeps a single source of truth for played flags", () => {
    const helper = require("../miniprogram/utils/match-helper");
    const players = [
      { playerId: "p1", nickname: "A", position: "PG" },
      { playerId: "p2", nickname: "B", position: "SG" },
      { playerId: "p3", nickname: "C", position: "SF" }
    ];
    const existing = [
      { playerId: "p1", nickname: "A", position: "PG", played: true, points: 10 },
      { playerId: "p2", nickname: "B", position: "SG", played: true, points: 4 }
    ];

    const synced = helper.buildPlayerStatsForSelection(players, existing, ["p2", "p3"]);
    expect(synced).toEqual([
      { playerId: "p1", nickname: "A", position: "PG", played: false, points: 10 },
      { playerId: "p2", nickname: "B", position: "SG", played: true, points: 4 },
      expect.objectContaining({ playerId: "p3", nickname: "C", position: "SF", played: true, points: 0 })
    ]);
  });

  test("create page blocks grouping when selected players < 4", async () => {
    const { page, wxMock } = loadPage("miniprogram/pages/match/create/create.js");
    page.setData({
      form: { ...page.data.form, teamNames: ["A队", "B队"], matchDate: "2026-01-01" },
      selectedPlayerIds: ["p1", "p2", "p3"]
    });
    await page.onGoGrouping();
    expect(wxMock.showToast).toHaveBeenCalled();
    expect(wxMock.navigateTo).not.toHaveBeenCalled();
  });

  test("grouping page payload syncs playerStats with selected players", () => {
    const { page } = loadPage("miniprogram/pages/match/grouping/grouping.js");
    page.setData({
      players: [
        { playerId: "p1", displayNickname: "A", displayPosition: "PG" },
        { playerId: "p2", displayNickname: "B", displayPosition: "SG" },
        { playerId: "p3", displayNickname: "C", displayPosition: "SF" }
      ],
      selectedPlayerIds: ["p2", "p3"],
      teamGroups: [
        { teamName: "A队", playerIds: ["p2"] },
        { teamName: "B队", playerIds: ["p3"] }
      ],
      match: {
        playerStats: [
          { playerId: "p1", nickname: "A", position: "PG", played: true, points: 6 },
          { playerId: "p2", nickname: "B", position: "SG", played: false, points: 0 }
        ]
      }
    });

    expect(page.buildGroupingPayload()).toEqual({
      selectedPlayerIds: ["p2", "p3"],
      playerStats: [
        { playerId: "p1", nickname: "A", position: "PG", played: false, points: 6 },
        { playerId: "p2", nickname: "B", position: "SG", played: true, points: 0 },
        expect.objectContaining({ playerId: "p3", nickname: "C", position: "SF", played: true, points: 0 })
      ],
      grouping: {
        teams: [
          { teamName: "A队", playerIds: ["p2"] },
          { teamName: "B队", playerIds: ["p3"] }
        ]
      }
    });
  });

  test("list page routes unlocked item to grouping page", () => {
    const { page, wxMock } = loadPage("miniprogram/pages/match/list/list.js");
    page.goDetail({ currentTarget: { dataset: { id: "m1", locked: false } } });
    expect(wxMock.navigateTo).toHaveBeenCalledWith({ url: "/pages/match/grouping/grouping?id=m1" });
  });

  test("list page routes locked item to detail page", () => {
    const { page, wxMock } = loadPage("miniprogram/pages/match/list/list.js");
    page.goDetail({ currentTarget: { dataset: { id: "m2", locked: true } } });
    expect(wxMock.navigateTo).toHaveBeenCalledWith({ url: "/pages/match/detail/detail?id=m2" });
  });
});
