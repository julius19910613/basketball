const path = require("path");
const http = require("http");
const https = require("https");
const { URL } = require("url");

const DEBUG_ENDPOINT = "http://127.0.0.1:7833/ingest/7901a233-946d-4c78-a131-c48434f5c472";
const DEBUG_SESSION = "d74edc";
const DEBUG_RUN_ID = "self-test-v1";

if (typeof fetch !== "function") {
  global.fetch = function (url, options = {}) {
    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const lib = parsed.protocol === "https:" ? https : http;
      const req = lib.request(
        parsed,
        {
          method: options.method || "GET",
          headers: options.headers || {}
        },
        (res) => {
          res.on("data", () => {});
          res.on("end", () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode }));
        }
      );
      req.on("error", reject);
      if (options.body) req.write(options.body);
      req.end();
    });
  };
}

function debugLog(hypothesisId, location, message, data = {}) {
  // #region agent log
  typeof fetch === "function" &&
    fetch(DEBUG_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": DEBUG_SESSION },
      body: JSON.stringify({
        sessionId: DEBUG_SESSION,
        runId: DEBUG_RUN_ID,
        hypothesisId,
        location,
        message,
        data,
        timestamp: Date.now()
      })
    }).catch(() => {});
  // #endregion
}

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
  const dbMock = options.dbMock || {};
  const wxMock = {
    cloud: {
      database: () => dbMock
    },
    showToast: jest.fn(),
    showLoading: jest.fn(),
    hideLoading: jest.fn(),
    navigateBack: jest.fn(),
    navigateTo: jest.fn(),
    stopPullDownRefresh: jest.fn()
  };
  global.wx = wxMock;
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

  return { page, wxMock };
}

describe("player module self-check", () => {
  test("H1: create page仅允许5个标准位置", () => {
    const addMock = jest.fn().mockResolvedValue({ _id: "p1" });
    const dbMock = { collection: () => ({ add: addMock }), serverDate: () => "serverDate" };
    const { page } = loadPage("miniprogram/pages/players/create/create.js", { dbMock });
    debugLog("H1", "player-module.self-test.test.js:create", "positions snapshot", {
      positions: page.data.positions
    });
    expect(page.data.positions).toEqual(["PG", "SG", "SF", "PF", "C"]);
  });

  test("H2: create page校验年龄身高体重并写入规范字段", async () => {
    const addMock = jest.fn().mockResolvedValue({ _id: "p2" });
    const dbMock = { collection: () => ({ add: addMock }), serverDate: () => "serverDate" };
    const { page, wxMock } = loadPage("miniprogram/pages/players/create/create.js", { dbMock });

    page.onFieldInput({ currentTarget: { dataset: { field: "nickname" } }, detail: { value: "小飞" } });
    page.onFieldInput({ currentTarget: { dataset: { field: "realName" } }, detail: { value: "张飞" } });
    page.onFieldInput({ currentTarget: { dataset: { field: "age" } }, detail: { value: "24" } });
    page.onFieldInput({ currentTarget: { dataset: { field: "height" } }, detail: { value: "188" } });
    page.onFieldInput({ currentTarget: { dataset: { field: "weight" } }, detail: { value: "80" } });
    page.onPositionChange({ detail: { value: "2" } });
    await page.onSubmit();

    const payload = addMock.mock.calls[0][0].data;
    debugLog("H2", "player-module.self-test.test.js:create", "submit payload", payload);

    expect(payload).toMatchObject({
      nickname: "小飞",
      realName: "张飞",
      position: "SF",
      age: 24,
      height: 188,
      weight: 80
    });
    expect(wxMock.showToast).toHaveBeenCalled();
  });

  test("H3: list page展示字段兼容并倒序读取", async () => {
    const getMock = jest.fn().mockResolvedValue({
      data: [
        { _id: "a", name: "旧字段名", position: "PG" },
        { _id: "b", nickname: "新昵称", realName: "李雷", position: "C", age: 22, height: 201, weight: 98 }
      ]
    });
    const dbMock = {
      collection: () => ({ orderBy: () => ({ get: getMock }) })
    };
    const { page } = loadPage("miniprogram/pages/players/list/list.js", { dbMock });
    await page.loadPlayers();

    debugLog("H3", "player-module.self-test.test.js:list", "list mapped result", {
      first: page.data.players[0],
      second: page.data.players[1]
    });

    expect(page.data.players[0].displayNickname).toBe("旧字段名");
    expect(page.data.players[1].displayNickname).toBe("新昵称");
  });

  test("H4: detail page缺少id时返回可见错误信息", () => {
    const dbMock = { collection: () => ({ doc: () => ({ get: jest.fn() }) }) };
    const { page } = loadPage("miniprogram/pages/players/detail/detail.js", { dbMock });
    page.onLoad({});
    debugLog("H4", "player-module.self-test.test.js:detail", "detail missing id state", {
      errorMessage: page.data.errorMessage
    });
    expect(page.data.errorMessage).toBe("缺少球员ID");
  });

  test("H5: detail page可加载并格式化详情字段", async () => {
    const getMock = jest.fn().mockResolvedValue({
      data: {
        _id: "p1",
        nickname: "Ace",
        realName: "王强",
        position: "PF",
        age: 26,
        height: 196,
        weight: 92,
        createdAt: "2026-04-10T12:00:00.000Z"
      }
    });
    const dbMock = { collection: () => ({ doc: () => ({ get: getMock }) }) };
    const { page } = loadPage("miniprogram/pages/players/detail/detail.js", { dbMock });
    page.onLoad({ id: "p1" });
    await new Promise((resolve) => setImmediate(resolve));
    debugLog("H5", "player-module.self-test.test.js:detail", "detail loaded state", {
      player: page.data.player
    });

    expect(page.data.player.nickname).toBe("Ace");
    expect(page.data.player.realName).toBe("王强");
    expect(page.data.player.position).toBe("PF");
  });
});
