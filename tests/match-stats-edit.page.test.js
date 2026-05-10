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
    redirectTo: jest.fn()
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

describe("match stats edit page", () => {
  test("builds submit payload with updated scores, quarters, and status", () => {
    const { page } = loadPage("miniprogram/pages/match/stats/edit.js");
    page.setData({
      match: {
        _id: "m1",
        matchType: "ncaa",
        teamNames: ["白队", "黑队"]
      },
      form: {
        scoreUs: 78,
        scoreOpponent: 74,
        quarters: [
          { quarter: 1, scoreUs: 20, scoreOpponent: 18 },
          { quarter: 2, scoreUs: 18, scoreOpponent: 20 },
          { quarter: 3, scoreUs: 22, scoreOpponent: 16 },
          { quarter: 4, scoreUs: 18, scoreOpponent: 20 }
        ],
        playerStats: [
          { playerId: "p1", played: true, nickname: "A", position: "PG", points: 22 }
        ],
        highlights: "末节反超取胜"
      }
    });

    expect(page.buildSubmitPayload()).toEqual({
      _id: "m1",
      matchType: "ncaa",
      teamNames: ["白队", "黑队"],
      scoreUs: 78,
      scoreOpponent: 74,
      quarters: [
        { quarter: 1, scoreUs: 20, scoreOpponent: 18 },
        { quarter: 2, scoreUs: 18, scoreOpponent: 20 },
        { quarter: 3, scoreUs: 22, scoreOpponent: 16 },
        { quarter: 4, scoreUs: 18, scoreOpponent: 20 }
      ],
      playerStats: [
        { playerId: "p1", played: true, nickname: "A", position: "PG", points: 22 }
      ],
      highlights: "末节反超取胜",
      matchStatus: "finished"
    });
  });
});
