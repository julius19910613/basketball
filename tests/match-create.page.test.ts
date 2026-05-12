import path = require("path");

type DataRecord = Record<string, any>;

interface PageConfig extends DataRecord {
  data?: DataRecord;
}

interface PageInstance extends DataRecord {
  data: DataRecord;
  setData(next: DataRecord): void;
}

type MockFunction = jest.Mock<any, any[]>;

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

interface PlayerSelectionChangeEvent {
  detail: {
    value: string[];
  };
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

function loadPage(relativePath: string): PageInstance {
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
    if (typeof pageConfig?.[key] === "function") {
      page[key] = (pageConfig[key] as Function).bind(page);
    } else if (key !== "data") {
      page[key] = pageConfig[key];
    }
  });

  return page;
}

describe("match create page player select all", (): void => {
  test("toggles select all and clear all in picker", (): void => {
    const page = loadPage("miniprogram/pages/match/create/create.ts");
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

  test("supports checkbox-group change detail.value shape", (): void => {
    const page = loadPage("miniprogram/pages/match/create/create.ts");
    page.setData({
      players: [{ playerId: "p1" }, { playerId: "p2" }, { playerId: "p3" }]
    });

    page.onPlayerSelectionChange({ detail: { value: ["p1", "p2", "p3"] } } as PlayerSelectionChangeEvent);
    expect(page.data.tempSelectedPlayerIds).toEqual(["p1", "p2", "p3"]);
    expect(page.data.isAllPlayersSelected).toBe(true);
  });
});
