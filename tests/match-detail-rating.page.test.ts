import * as path from "path";

type JsonObject = Record<string, any>;

function applySetData(target: JsonObject, patch: JsonObject): void {
  Object.keys(patch).forEach((key: string) => {
    if (!key.includes(".")) {
      target[key] = patch[key];
      return;
    }
    const segments = key.split(".");
    let cursor = target;
    for (let i = 0; i < segments.length - 1; i += 1) {
      cursor[segments[i]] = cursor[segments[i]] || {};
      cursor = cursor[segments[i]];
    }
    cursor[segments[segments.length - 1]] = patch[key];
  });
}

function loadPage(
  relativePath: string,
  options: {
    app?: JsonObject;
    dbModule?: JsonObject;
  } = {}
): JsonObject {
  jest.resetModules();
  let pageConfig: JsonObject | null = null;
  let loadError: unknown = null;
  if (options.dbModule) {
    jest.doMock("../miniprogram/utils/db", () => ({
      __esModule: true,
      default: options.dbModule
    }));
  }
  (global as any).wx = {
    cloud: {
      database: jest.fn(() => ({
        command: { in: jest.fn((value) => ({ $in: value })) },
        collection: jest.fn()
      })),
      callFunction: jest.fn()
    },
    showToast: jest.fn()
  };
  (global as any).getApp = jest.fn(() => options.app || ({ globalData: { openid: "openid-1" } }));
  (global as any).Page = (config: JsonObject): JsonObject => {
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
  if (!pageConfig) throw new Error("Page load failed");
  const page: JsonObject = {
    data: JSON.parse(JSON.stringify(pageConfig.data || {})),
    setData(next: JsonObject): void {
      applySetData(this.data, next);
    }
  };
  Object.keys(pageConfig).forEach((key) => {
    if (typeof pageConfig![key] === "function") {
      page[key] = pageConfig![key].bind(page);
    }
  });
  return page;
}

describe("match detail rating panel", () => {
  test("builds rating rows from public summary and current user's ratings", () => {
    const page = loadPage("miniprogram/pages/match/detail/detail.ts");
    page.setData({
      playedPlayers: [
        { playerId: "p1", nickname: "A", position: "PG", points: 20, rebounds: 5, assists: 4 },
        { playerId: "p2", nickname: "B", position: "C", points: 8, rebounds: 10, assists: 1 }
      ]
    });

    const rows = page.buildRatingRows(
      [{ playerId: "p1", ratingCount: 2, averageScore: 9, averageStar: 4.5, tagSummary: [{ tag: "关键先生", count: 2 }] }],
      [{ playerId: "p1", score: 8, tags: ["关键先生"], comment: "稳" }]
    );

    expect(rows[0].summary.averageScore).toBe(9);
    expect(rows[0].myRating.starValue).toBe(4);
    expect(rows[0].ratingTags).toEqual(["关键先生"]);
    expect(rows[1].summary.ratingCount).toBe(0);
  });

  test("keeps ratings disabled before finish and after session close", () => {
    const page = loadPage("miniprogram/pages/match/detail/detail.ts");

    expect(page.isRatingOpen({ matchStatus: "ongoing", ratingSession: { status: "open" } })).toBe(false);
    expect(page.getRatingDisabledReason({ matchStatus: "ongoing", ratingSession: { status: "open" } })).toBe("比赛结束后开放评分");
    expect(page.isRatingOpen({ matchStatus: "finished" })).toBe(true);
    expect(page.isRatingOpen({ matchStatus: "finished", ratingSession: { status: "open" } })).toBe(true);
    expect(page.isRatingOpen({ matchStatus: "finished", ratingSession: { status: "closed" } })).toBe(false);
    expect(page.getRatingDisabledReason({ matchStatus: "finished", ratingSession: { status: "closed" } })).toBe("本场评分已关闭");
  });

  test("does not query personal ratings or submit when openid resolution fails", async () => {
    const getMatchPlayerRatingSummaries = jest.fn(async () => []);
    const getMyMatchRatings = jest.fn(async () => []);
    const submitPlayerRating = jest.fn(async () => ({ success: true }));
    const page = loadPage("miniprogram/pages/match/detail/detail.ts", {
      app: {
        globalData: {},
        getOpenId: jest.fn(async () => {
          throw new Error("openid unavailable");
        })
      },
      dbModule: {
        getMatchPlayerRatingSummaries,
        getMyMatchRatings,
        submitPlayerRating
      }
    });
    page.setData({
      id: "m1",
      match: { matchStatus: "finished" },
      playedPlayers: [{ playerId: "p1", nickname: "A", position: "PG" }],
      ratingRows: [{
        playerId: "p1",
        myRating: { score: 8 },
        ratingTags: [],
        ratingComment: "",
        submitting: false
      }],
      ratingEnabled: true
    });

    await page.initRatingData();
    await page.onSubmitRating({ currentTarget: { dataset: { index: 0 } } });

    expect(getMatchPlayerRatingSummaries).toHaveBeenCalledWith("m1");
    expect(getMyMatchRatings).not.toHaveBeenCalled();
    expect(submitPlayerRating).not.toHaveBeenCalled();
    expect((global as any).wx.showToast).toHaveBeenCalledWith({ title: "无法获取用户身份", icon: "none" });
  });

  test("submits finished match ratings and refreshes summaries", async () => {
    const getMatchPlayerRatingSummaries = jest.fn(async () => []);
    const getMyMatchRatings = jest.fn(async () => []);
    const submitPlayerRating = jest.fn(async () => ({ success: true }));
    const page = loadPage("miniprogram/pages/match/detail/detail.ts", {
      dbModule: {
        getMatchPlayerRatingSummaries,
        getMyMatchRatings,
        submitPlayerRating
      }
    });
    page.setData({
      id: "m1",
      match: { matchStatus: "finished" },
      currentOpenid: "openid-1",
      playedPlayers: [{ playerId: "p1", nickname: "A", position: "PG" }],
      ratingRows: [{
        playerId: "p1",
        myRating: { score: 9 },
        ratingTags: ["关键先生"],
        ratingComment: "稳",
        submitting: false
      }],
      ratingEnabled: true
    });

    await page.onSubmitRating({ currentTarget: { dataset: { index: 0 } } });

    expect(submitPlayerRating).toHaveBeenCalledWith({
      matchId: "m1",
      playerId: "p1",
      score: 9,
      starValue: 4.5,
      tags: ["关键先生"],
      comment: "稳"
    });
    expect(getMatchPlayerRatingSummaries).toHaveBeenCalledWith("m1");
    expect(getMyMatchRatings).toHaveBeenCalledWith("m1", "openid-1");
  });
});
