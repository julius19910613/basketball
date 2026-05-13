const path = require("path");

type JsonObject = Record<string, unknown>;
type SetDataPatch = Record<string, unknown>;

interface WxMock {
  cloud: {
    database: jest.Mock;
  };
  showToast: jest.Mock;
  showLoading: jest.Mock;
  hideLoading: jest.Mock;
  redirectTo: jest.Mock;
}

interface PageConfig extends JsonObject {
  data?: JsonObject;
}

interface PageInstance extends JsonObject {
  data: JsonObject;
  setData: (next: SetDataPatch) => void;
}

function applySetData(target: JsonObject, patch: SetDataPatch): void {
  Object.keys(patch).forEach((key: string) => {
    if (!key.includes(".")) {
      target[key] = patch[key];
      return;
    }
    const segments = key.split(".");
    let cursor = target as Record<string, unknown>;
    for (let i = 0; i < segments.length - 1; i += 1) {
      const seg = segments[i];
      cursor[seg] = (cursor[seg] as Record<string, unknown> | undefined) || {};
      cursor = cursor[seg] as Record<string, unknown>;
    }
    cursor[segments[segments.length - 1]] = patch[key];
  });
}

function loadPage(relativePath: string): { page: PageInstance; wxMock: WxMock } {
  jest.resetModules();
  let pageConfig: PageConfig | null = null;
  const globalContext = global as typeof globalThis & {
    wx: WxMock;
    Page: (config: PageConfig) => PageConfig;
  };
  globalContext.wx = {
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
  globalContext.Page = (config: PageConfig): PageConfig => {
    pageConfig = config;
    return config;
  };
  require(path.resolve(__dirname, "..", relativePath));
  if (!pageConfig) throw new Error(`Page load failed: ${relativePath}`);
  const page: PageInstance = {
    data: JSON.parse(JSON.stringify(pageConfig.data || {})) as JsonObject,
    setData(next: SetDataPatch): void {
      applySetData(this.data, next);
    }
  };
  Object.keys(pageConfig).forEach((key: string) => {
    if (typeof pageConfig![key] === "function") {
      page[key] = (pageConfig![key] as Function).bind(page);
    }
  });
  return { page, wxMock: globalContext.wx };
}

describe("match stats edit page", () => {
  test("builds submit payload with updated scores, quarters, and status", () => {
    const { page } = loadPage("miniprogram/pages/match/stats/edit.ts");
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

    expect((page.buildSubmitPayload as () => unknown)()).toEqual({
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

export {};
