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
        command: {},
        collection: jest.fn()
      }))
    },
    showToast: jest.fn(),
    showLoading: jest.fn(),
    hideLoading: jest.fn(),
    navigateBack: jest.fn()
  };

  global.Page = (config) => {
    pageConfig = config;
    return config;
  };

  require(path.resolve(__dirname, "..", relativePath));
  if (!pageConfig) throw new Error(`Page load failed: ${relativePath}`);

  const page = {
    data: JSON.parse(JSON.stringify(pageConfig.data || {})),
    setData(next) {
      applySetData(this.data, next);
    }
  };

  Object.keys(pageConfig).forEach((key) => {
    if (typeof pageConfig[key] === "function") {
      page[key] = pageConfig[key].bind(page);
    } else if (key !== "data") {
      page[key] = pageConfig[key];
    }
  });

  return page;
}

describe("match create page player select all", () => {
  test("toggles select all and clear all in picker", () => {
    const page = loadPage("miniprogram/pages/match/create/create.js");
    page.setData({
      players: [{ playerId: "p1" }, { playerId: "p2" }, { playerId: "p3" }],
      selectedPlayerIds: ["p1"]
    });

    page.onShowPlayerPicker();
    expect(page.data.tempSelectedPlayerIds).toEqual(["p1"]);
    expect(page.data.isAllPlayersSelected).toBe(false);

    page.onToggleSelectAllPlayers();
    expect(page.data.tempSelectedPlayerIds).toEqual(["p1", "p2", "p3"]);
    expect(page.data.isAllPlayersSelected).toBe(true);

    page.onToggleSelectAllPlayers();
    expect(page.data.tempSelectedPlayerIds).toEqual([]);
    expect(page.data.isAllPlayersSelected).toBe(false);
  });

  test("supports checkbox-group change detail.value shape", () => {
    const page = loadPage("miniprogram/pages/match/create/create.js");
    page.setData({
      players: [{ playerId: "p1" }, { playerId: "p2" }, { playerId: "p3" }]
    });

    page.onPlayerSelectionChange({ detail: { value: ["p1", "p2", "p3"] } });
    expect(page.data.tempSelectedPlayerIds).toEqual(["p1", "p2", "p3"]);
    expect(page.data.isAllPlayersSelected).toBe(true);
  });
});
