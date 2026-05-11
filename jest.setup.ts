/// <reference path="./typings/index.d.ts" />

// jest.setup.ts - Jest 设置文件

type PageMock = <TData extends WechatMiniprogram.Page.DataOption, TCustom extends WechatMiniprogram.Page.CustomOption>(
  pageConfig: WechatMiniprogram.Page.Options<TData, TCustom>
) => WechatMiniprogram.Page.Options<TData, TCustom>;

type AppMock = <T extends WechatMiniprogram.IAnyObject>(
  appConfig: WechatMiniprogram.App.Options<T>
) => WechatMiniprogram.App.Options<T>;

type GetAppMock = <T extends WechatMiniprogram.IAnyObject = WechatMiniprogram.IAnyObject>(
  opts?: WechatMiniprogram.App.GetAppOption
) => WechatMiniprogram.App.Instance<T>;

type TestGlobal = typeof globalThis & {
  Page: PageMock;
  App: AppMock;
  getApp: GetAppMock;
  getCurrentPages: () => WechatMiniprogram.Page.TrivialInstance[];
  requirePlugin: (name: string) => WechatMiniprogram.IAnyObject;
  requireMiniProgram: () => WechatMiniprogram.IAnyObject;
  atob: (str: string) => string;
  btoa: (str: string) => string;
  __wxConfig: WechatMiniprogram.IAnyObject;
  __wxRoute: string;
  __wxExposedFunctions: WechatMiniprogram.IAnyObject;
  __webpack_require__: (moduleName: string) => unknown;
  wx?: WechatMiniprogram.Wx;
};

const testGlobal = global as TestGlobal;

// 模拟全局对象
testGlobal.Page = function <TData extends WechatMiniprogram.Page.DataOption, TCustom extends WechatMiniprogram.Page.CustomOption>(
  pageConfig: WechatMiniprogram.Page.Options<TData, TCustom>
): WechatMiniprogram.Page.Options<TData, TCustom> {
  // 页面配置保存到全局，供测试使用
  return pageConfig;
};

testGlobal.App = function <T extends WechatMiniprogram.IAnyObject>(
  appConfig: WechatMiniprogram.App.Options<T>
): WechatMiniprogram.App.Options<T> {
  return appConfig;
};

testGlobal.getApp = function <T extends WechatMiniprogram.IAnyObject = WechatMiniprogram.IAnyObject>(
  _opts?: WechatMiniprogram.App.GetAppOption
): WechatMiniprogram.App.Instance<T> {
  return {} as WechatMiniprogram.App.Instance<T>;
};

testGlobal.getCurrentPages = function (): WechatMiniprogram.Page.TrivialInstance[] {
  return [];
};

testGlobal.requirePlugin = function (_name: string): WechatMiniprogram.IAnyObject {
  return {};
};

testGlobal.requireMiniProgram = function (): WechatMiniprogram.IAnyObject {
  return {};
};

testGlobal.atob = function (str: string): string {
  return Buffer.from(str, "base64").toString("binary");
};

testGlobal.btoa = function (str: string): string {
  return Buffer.from(str, "binary").toString("base64");
};

testGlobal.__wxConfig = {};
testGlobal.__wxRoute = "";
testGlobal.__wxExposedFunctions = {};
testGlobal.__webpack_require__ = function (moduleName: string): unknown {
  return require(moduleName);
};

// 确保wx对象存在
if (!testGlobal.wx) {
  testGlobal.wx = {} as WechatMiniprogram.Wx;
}

const wxObject = testGlobal.wx as WechatMiniprogram.Wx & {
  cloud?: {
    [key: string]: unknown;
  };
};

// 添加常用的wx方法
if (!wxObject.cloud) {
  wxObject.cloud = {} as typeof wxObject.cloud;
}
