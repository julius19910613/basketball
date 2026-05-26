import * as path from "path";

describe("player detail rating summary", () => {
  test("loads long-term player rating summary", async () => {
    jest.resetModules();
    let pageConfig: any = null;
    const getPlayerRatingSummary = jest.fn(async () => ({
      playerId: "p1",
      ratingCount: 3,
      averageScore: 8.7,
      averageStar: 4.4
    }));

    jest.doMock("../miniprogram/utils/db", () => ({
      __esModule: true,
      default: {
        getPlayerSeasonStats: jest.fn(async () => ({ games: 0 })),
        getPlayerRatingSummary
      }
    }));

    (global as any).wx = {
      cloud: {
        database: jest.fn(() => ({
          collection: jest.fn(() => ({
            doc: jest.fn(() => ({ get: jest.fn() }))
          })),
          serverDate: jest.fn(),
          command: { remove: jest.fn() }
        }))
      }
    };
    (global as any).Page = (config: any): any => {
      pageConfig = config;
      return config;
    };

    require(path.resolve(__dirname, "../miniprogram/pages/players/detail/detail.ts"));
    const page = {
      data: JSON.parse(JSON.stringify(pageConfig.data)),
      setData(next: Record<string, unknown>): void {
        this.data = Object.assign({}, this.data, next);
      }
    } as any;
    Object.keys(pageConfig).forEach((key) => {
      if (typeof pageConfig[key] === "function") page[key] = pageConfig[key].bind(page);
    });

    await page.loadPlayerRatingSummary("p1");
    expect(getPlayerRatingSummary).toHaveBeenCalledWith("p1");
    expect(page.data.ratingSummary.averageScore).toBe(8.7);
  });

  test("degrades to empty summary when summary loading fails", async () => {
    jest.resetModules();
    let pageConfig: any = null;
    jest.doMock("../miniprogram/utils/db", () => ({
      __esModule: true,
      default: {
        getPlayerSeasonStats: jest.fn(async () => ({ games: 0 })),
        getPlayerRatingSummary: jest.fn(async () => {
          throw Object.assign(new Error("DATABASE_COLLECTION_NOT_EXIST"), { errCode: -502005 });
        })
      }
    }));

    (global as any).wx = {
      cloud: {
        database: jest.fn(() => ({
          collection: jest.fn(() => ({
            doc: jest.fn(() => ({ get: jest.fn() }))
          })),
          serverDate: jest.fn(),
          command: { remove: jest.fn() }
        }))
      }
    };
    (global as any).Page = (config: any): any => {
      pageConfig = config;
      return config;
    };

    require(path.resolve(__dirname, "../miniprogram/pages/players/detail/detail.ts"));
    const page = {
      data: JSON.parse(JSON.stringify(pageConfig.data)),
      setData(next: Record<string, unknown>): void {
        this.data = Object.assign({}, this.data, next);
      }
    } as any;
    Object.keys(pageConfig).forEach((key) => {
      if (typeof pageConfig[key] === "function") page[key] = pageConfig[key].bind(page);
    });

    await page.loadPlayerRatingSummary("p1");
    expect(page.data.ratingSummary).toBeNull();
  });
});
