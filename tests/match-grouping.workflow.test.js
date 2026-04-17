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
    const grouped = helper.buildSnakeGrouping(players, ["p1", "p2", "p3", "p4"]);
    const overlap = grouped.groups[0].filter((id) => grouped.groups[1].includes(id));
    expect(overlap.length).toBe(0);
    expect(grouped.groups[0].length + grouped.groups[1].length).toBe(4);
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

  test("list page routes draft item to grouping page", () => {
    const { page, wxMock } = loadPage("miniprogram/pages/match/list/list.js");
    page.goDetail({ currentTarget: { dataset: { id: "m1", status: "draft" } } });
    expect(wxMock.navigateTo).toHaveBeenCalledWith({ url: "/pages/match/grouping/grouping?id=m1" });
  });
});
