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

function loadPage(relativePath, options = {}) {
  jest.resetModules();
  let pageConfig = null;
  const wxMock = options.wxMock || {
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
  const appMock = options.appMock || { globalData: { openid: "openid-1" } };

  global.wx = wxMock;
  global.getApp = jest.fn(() => appMock);
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
    if (typeof pageConfig[key] === "function") {
      page[key] = pageConfig[key].bind(page);
    } else if (key !== "data") {
      page[key] = pageConfig[key];
    }
  });

  return { page, wxMock, appMock };
}

describe("activity phase 1 pages", () => {
  test("activity create page blocks invalid publish", async () => {
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

  test("activity create page saves draft and redirects to detail", async () => {
    const createActivity = jest.fn(async () => "activity-1");
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

  test("activity register page requires linked player before registration", async () => {
    jest.doMock("../miniprogram/utils/db", () => ({
      getActivityDetail: jest.fn(async () => ({ _id: "a1", title: "活动", status: "registration_open" })),
      getActivityRegistrations: jest.fn(async () => []),
      registerForActivity: jest.fn()
    }));
    const { page, wxMock } = loadPage("miniprogram/pages/activity/register/register.js");
    page.setData({ id: "a1", linkedPlayer: null });

    await page.onRegister();
    expect(wxMock.showToast).toHaveBeenCalledWith(expect.objectContaining({ title: "请先在个人中心绑定球员" }));
  });

  test("activity detail share path points to register page", () => {
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

  test("activity detail routes to grouping page", () => {
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

  test("activity detail routes to match stats edit page", () => {
    jest.doMock("../miniprogram/utils/db", () => ({
      getActivityDetail: jest.fn(),
      getActivityRegistrations: jest.fn(),
      getMatchesByActivity: jest.fn(),
      closeActivityRegistration: jest.fn(),
      generateActivityMatches: jest.fn()
    }));
    const { page, wxMock } = loadPage("miniprogram/pages/activity/detail/detail.ts");
    page.onGoMatchStats({ currentTarget: { dataset: { id: "m1" } } });
    expect(wxMock.navigateTo).toHaveBeenCalledWith({ url: "/pages/match/stats/edit?id=m1" });
  });
});
