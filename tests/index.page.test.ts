import * as path from "path";

type DataRecord = Record<string, any>;

interface PageConfig extends DataRecord {
  data?: DataRecord;
}

interface PageInstance extends DataRecord {
  data: DataRecord;
  setData(next: DataRecord): void;
}

function applySetData(target: DataRecord, patch: DataRecord): void {
  Object.keys(patch).forEach((key: string) => {
    if (!key.includes(".")) {
      target[key] = patch[key];
      return;
    }
    const segments = key.split(".");
    let cursor: DataRecord = target;
    for (let i = 0; i < segments.length - 1; i += 1) {
      const seg = segments[i];
      cursor[seg] = cursor[seg] || {};
      cursor = cursor[seg];
    }
    cursor[segments[segments.length - 1]] = patch[key];
  });
}

function loadPage(relativePath: string, databaseMock: any): PageInstance {
  jest.resetModules();
  let pageConfig: PageConfig | null = null;
  const globalScope = global as typeof globalThis & {
    wx?: Record<string, any>;
    Page?: (config: PageConfig) => PageConfig;
    getApp?: () => any;
  };

  globalScope.getApp = () => ({
    globalData: { isLoggedIn: true, userInfo: { nickName: "Tester" } },
    checkLogin: jest.fn(async () => ({ userInfo: { nickName: "Tester" } }))
  });
  globalScope.wx = {
    cloud: {
      database: jest.fn(() => databaseMock)
    },
    switchTab: jest.fn(),
    navigateTo: jest.fn()
  };
  globalScope.Page = (config: PageConfig): PageConfig => {
    pageConfig = config;
    return config;
  };

  jest.isolateModules(() => {
    require(path.resolve(__dirname, "..", relativePath));
  });

  if (!pageConfig) {
    throw new Error(`Page load failed: ${relativePath}`);
  }

  const page: PageInstance = {
    data: JSON.parse(JSON.stringify(pageConfig.data || {})) as DataRecord,
    setData(next: DataRecord): void {
      applySetData(this.data, next);
    }
  };

  Object.keys(pageConfig).forEach((key: string) => {
    if (typeof pageConfig?.[key] === "function") {
      page[key] = (pageConfig[key] as Function).bind(page);
    }
  });

  return page;
}

describe("index page summary", () => {
  test("shows player and match counts with current collections", async () => {
    const countMock = jest
      .fn()
      .mockResolvedValueOnce({ total: 12 })
      .mockResolvedValueOnce({ total: 7 });
    const databaseMock = {
      collection: jest.fn(() => ({
        count: countMock
      }))
    };
    const page = loadPage("miniprogram/pages/index/index.ts", databaseMock);

    await page.fetchSummary();

    expect(page.data.playerCount).toBe(12);
    expect(page.data.matchCount).toBe(7);
  });
});
