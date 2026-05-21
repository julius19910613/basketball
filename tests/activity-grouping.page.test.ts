import * as path from "path";

type DataRecord = Record<string, any>;
type MockFunction = jest.Mock<any, any[]>;

interface PageConfig extends DataRecord {
  data?: DataRecord;
}

interface PageInstance extends DataRecord {
  data: DataRecord;
  setData(next: DataRecord): void;
}

interface WxMock {
  cloud: {
    database: MockFunction;
  };
  showToast: MockFunction;
  showLoading: MockFunction;
  hideLoading: MockFunction;
  redirectTo: MockFunction;
  navigateBack: MockFunction;
}

interface LoadPageResult {
  page: PageInstance;
  wxMock: WxMock;
}

function applySetData(target: DataRecord, patch: DataRecord): void {
  Object.keys(patch).forEach((key: string) => {
    if (!key.includes(".")) {
      target[key] = patch[key];
      return;
    }
    const segments: string[] = key.split(".");
    let cursor: DataRecord = target;
    for (let i = 0; i < segments.length - 1; i += 1) {
      const seg: string = segments[i];
      cursor[seg] = cursor[seg] || {};
      cursor = cursor[seg];
    }
    cursor[segments[segments.length - 1]] = patch[key];
  });
}

function loadPage(relativePath: string): LoadPageResult {
  jest.resetModules();
  let pageConfig: PageConfig | null = null;
  let loadError: unknown = null;
  const globalScope = global as typeof globalThis & {
    wx?: WxMock;
    Page?: (config: PageConfig) => PageConfig;
  };

  globalScope.wx = {
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
  globalScope.Page = (config: PageConfig): PageConfig => {
    pageConfig = config;
    return config;
  };

  try {
    jest.isolateModules(() => {
      require(path.resolve(__dirname, "..", relativePath));
    });
  } catch (error) {
    loadError = error;
  }

  if (loadError) {
    const error = loadError instanceof Error ? loadError : new Error(String(loadError));
    error.message = `Page module load failed: ${relativePath}\n${error.message}`;
    throw error;
  }

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
    if (typeof pageConfig[key] === "function") {
      page[key] = (pageConfig[key] as Function).bind(page);
    } else if (key !== "data") {
      page[key] = pageConfig[key];
    }
  });
  return { page, wxMock: globalScope.wx };
}

describe("activity grouping page", (): void => {
  test("builds grouping snapshot from current team groups", (): void => {
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

  test("auto balance splits six players across three groups", (): void => {
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
    const total: number = page.data.teamGroups.reduce(
      (sum: number, item: { playerIds: string[] }) => sum + item.playerIds.length,
      0
    );
    const overlap: string[] = page.data.teamGroups[0].playerIds.filter(
      (id: string) =>
        page.data.teamGroups[1].playerIds.includes(id) || page.data.teamGroups[2].playerIds.includes(id)
    );
    expect(total).toBe(6);
    expect(overlap).toHaveLength(0);
  });
});
