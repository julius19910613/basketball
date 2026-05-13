import path = require("path");

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
  navigateTo: MockFunction;
  redirectTo: MockFunction;
  switchTab: MockFunction;
}

interface AppMock {
  globalData: {
    openid: string;
  };
}

interface LoadPageOptions {
  wxMock?: WxMock;
  appMock?: AppMock;
}

interface LoadPageResult {
  page: PageInstance;
  wxMock: WxMock;
  appMock: AppMock;
}

interface MatchStatsEvent {
  currentTarget: {
    dataset: {
      id: string;
    };
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

function loadPage(relativePath: string, options: LoadPageOptions = {}): LoadPageResult {
  jest.resetModules();
  let pageConfig: PageConfig | null = null;
  let loadError: unknown = null;
  const wxMock: WxMock = options.wxMock || {
    cloud: {
      database: jest.fn(() => ({
        collection: jest.fn(() => ({
          where: jest.fn(() => ({
            limit: jest.fn(() => ({
              get: jest.fn(async () => ({ data: [] }))
            })),
            get: jest.fn(async () => ({ data: [] }))
          })),
          doc: jest.fn(() => ({
            get: jest.fn(async () => ({ data: null }))
          }))
        }))
      }))
    },
    showToast: jest.fn(),
    showLoading: jest.fn(),
    hideLoading: jest.fn(),
    navigateTo: jest.fn(),
    redirectTo: jest.fn(),
    switchTab: jest.fn()
  };
  const appMock: AppMock = options.appMock || { globalData: { openid: "openid-1" } };
  const globalScope = global as typeof globalThis & {
    wx?: WxMock;
    getApp?: jest.Mock<AppMock, []>;
    Page?: (config: PageConfig) => PageConfig;
  };

  globalScope.wx = wxMock;
  globalScope.getApp = jest.fn(() => appMock);
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

  return { page, wxMock, appMock };
}

describe("activity phase 1 pages", (): void => {
  test("activity create page blocks invalid publish", async (): Promise<void> => {
    const { page, wxMock } = loadPage("miniprogram/pages/activity/create/create.ts");
    page.setData({
      form: {
        ...page.data.form,
        title: "",
        activityDate: "2026-06-28",
        startTime: "19:00",
        endTime: "22:00",
        teamNames: ["白队", "黑队", "红队"]
      }
    });

    await page.onPublish();
    expect(wxMock.showToast).toHaveBeenCalledWith(expect.objectContaining({ title: "请输入活动名称" }));
    expect(wxMock.redirectTo).not.toHaveBeenCalled();
  });

  test("activity create page saves draft and redirects to detail", async (): Promise<void> => {
    const createActivity: MockFunction = jest.fn(async () => "activity-1");
    jest.doMock("../miniprogram/utils/db", () => ({
      createActivity
    }));

    const { page, wxMock } = loadPage("miniprogram/pages/activity/create/create.ts");
    page.setData({
      form: {
        ...page.data.form,
        title: "6月底篮球活动",
        activityDate: "2026-06-28",
        startTime: "19:00",
        endTime: "22:00",
        location: "主场馆",
        teamNames: ["白队", "黑队", "红队"]
      }
    });

    jest.useFakeTimers();
    await page.onSaveDraft();
    expect(createActivity).toHaveBeenCalled();
    jest.runAllTimers();
    expect(wxMock.redirectTo).toHaveBeenCalledWith({ url: "/pages/activity/detail/detail?id=activity-1" });
    jest.useRealTimers();
  });

  test("activity register page requires linked player before registration", async (): Promise<void> => {
    jest.doMock("../miniprogram/utils/db", () => ({
      getActivityDetail: jest.fn(async () => ({ _id: "a1", title: "活动", status: "registration_open" })),
      getActivityRegistrations: jest.fn(async () => []),
      registerForActivity: jest.fn()
    }));
    const { page, wxMock } = loadPage("miniprogram/pages/activity/register/register.ts");
    page.setData({ id: "a1", linkedPlayer: null });

    await page.onRegister();
    expect(wxMock.showToast).toHaveBeenCalledWith(expect.objectContaining({ title: "请先在个人中心绑定球员" }));
  });

  test("activity detail share path points to register page", (): void => {
    jest.doMock("../miniprogram/utils/db", () => ({
      getActivityDetail: jest.fn(),
      getActivityRegistrations: jest.fn(),
      closeActivityRegistration: jest.fn()
    }));
    const { page } = loadPage("miniprogram/pages/activity/detail/detail.ts");
    page.setData({
      id: "a1",
      activity: { title: "6月底篮球活动" }
    });

    expect(page.onShareAppMessage()).toEqual({
      title: "6月底篮球活动",
      path: "/pages/activity/register/register?id=a1"
    });
  });

  test("activity detail routes to grouping page", (): void => {
    jest.doMock("../miniprogram/utils/db", () => ({
      getActivityDetail: jest.fn(),
      getActivityRegistrations: jest.fn(),
      closeActivityRegistration: jest.fn()
    }));
    const { page, wxMock } = loadPage("miniprogram/pages/activity/detail/detail.ts");
    page.setData({ id: "a1" });
    page.onGoGrouping();
    expect(wxMock.navigateTo).toHaveBeenCalledWith({ url: "/pages/activity/grouping/grouping?id=a1" });
  });

  test("activity detail routes to match stats edit page", (): void => {
    jest.doMock("../miniprogram/utils/db", () => ({
      getActivityDetail: jest.fn(),
      getActivityRegistrations: jest.fn(),
      getMatchesByActivity: jest.fn(),
      closeActivityRegistration: jest.fn(),
      generateActivityMatches: jest.fn()
    }));
    const { page, wxMock } = loadPage("miniprogram/pages/activity/detail/detail.ts");
    page.onGoMatchStats({ currentTarget: { dataset: { id: "m1" } } } as MatchStatsEvent);
    expect(wxMock.navigateTo).toHaveBeenCalledWith({ url: "/pages/match/stats/edit?id=m1" });
  });
});
