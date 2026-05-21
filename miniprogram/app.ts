/// <reference path="../typings/index.d.ts" />
import env from "./config/env";

// app.js

type EnvVersion = "develop" | "trial" | "release";

declare const __wxConfig: {
  envVersion?: EnvVersion;
};

interface UserProfile extends WechatMiniprogram.IAnyObject {
  _openid?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

interface GlobalData {
  userInfo: UserProfile | null;
  openid: string | null;
  unionid: string | null;
  isLoggedIn: boolean;
}

interface LoginResult {
  openid: string;
  unionid?: string;
}

interface GetOpenIdCallFunctionResult extends ICloud.CallFunctionResult {
  result: LoginResult;
}

interface AppCustomProperties {
  globalData: GlobalData;
  userInfoReadyCallback?: (userInfo: UserProfile) => void;
  checkLogin: () => Promise<GlobalData | null>;
  getOpenIdWithRetry: (retries?: number) => Promise<GetOpenIdCallFunctionResult>;
  loadUserProfile: (openid: string) => Promise<void>;
  updateUserInfo: (userInfo: UserProfile) => void;
  getOpenId: () => Promise<string>;
}

type AppInstance = WechatMiniprogram.App.Instance<AppCustomProperties>;

interface EnvModule {
  getCollection: (name: string) => string;
}

const appConfig: WechatMiniprogram.App.Options<AppCustomProperties> = {
  globalData: {
    userInfo: null,
    openid: null,
    unionid: null,
    isLoggedIn: false
  },

  onLaunch: function (this: AppInstance): void {
    // 初始化云开发
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        env: "fanchen-2gkerrmcf3aee832",
        traceUser: true
      });
    }

    // 打印当前环境
    const envVersion =
      (typeof __wxConfig !== "undefined" && __wxConfig.envVersion) || "develop";
    console.log(`[ENV] 当前运行版本: ${envVersion}`);

    // 异步执行静默登录
    this.checkLogin();
  },

  // 统一登录检查入口
  checkLogin: async function (this: AppInstance): Promise<GlobalData | null> {
    // 1. 尝试从内存获取
    if (this.globalData.isLoggedIn && this.globalData.openid) {
      return this.globalData;
    }

    // 2. 尝试从本地缓存获取
    const cachedOpenid = wx.getStorageSync("openid") as string | null;
    const cachedUserInfo = wx.getStorageSync("userInfo") as UserProfile | null;
    if (cachedOpenid && cachedUserInfo) {
      this.globalData.openid = cachedOpenid;
      this.globalData.userInfo = cachedUserInfo;
      this.globalData.isLoggedIn = true;
      return this.globalData;
    }

    // 3. 执行云函数登录
    try {
      const res = await this.getOpenIdWithRetry();
      const openid = res.result.openid;
      const unionid = res.result.unionid || null;

      this.globalData.openid = openid;
      this.globalData.unionid = unionid;
      wx.setStorageSync("openid", openid);

      // 加载用户资料
      await this.loadUserProfile(openid);

      return this.globalData;
    } catch (err: unknown) {
      console.error("登录失败:", err);
      return null;
    }
  },

  // 获取用户 OpenID（带重试）
  getOpenIdWithRetry: function (
    this: AppInstance,
    retries = 3
  ): Promise<GetOpenIdCallFunctionResult> {
    return new Promise((resolve, reject) => {
      const attempt = (n: number): void => {
        wx.cloud.callFunction({
          name: "getOpenId", // 统一使用 getOpenId
          success: (res) => {
            resolve(res as GetOpenIdCallFunctionResult);
          },
          fail: (err: unknown) => {
            if (n > 1) {
              console.warn(`登录重试中... 剩余次数: ${n - 1}`);
              attempt(n - 1);
            } else {
              reject(err);
            }
          }
        });
      };
      attempt(retries);
    });
  },

  // 加载用户资料
  loadUserProfile: async function (
    this: AppInstance,
    openid: string
  ): Promise<void> {
    if (!openid) return;

    const { getCollection } = env;
    const db = wx.cloud.database();

    try {
      const res = await db
        .collection(getCollection("users"))
        .where({
          _openid: openid
        })
        .get();

      if (res.data && res.data.length > 0) {
        const userInfo = res.data[0] as UserProfile;
        this.globalData.userInfo = userInfo;
        this.globalData.isLoggedIn = true;
        wx.setStorageSync("userInfo", userInfo);

        if (this.userInfoReadyCallback) {
          this.userInfoReadyCallback(userInfo);
        }
      } else {
        // 自动创建空记录
        await db.collection(getCollection("users")).add({
          data: {
            _openid: openid,
            createdAt: db.serverDate(),
            updatedAt: db.serverDate()
          }
        });
        console.log("新用户已自动创建");
      }
    } catch (err: unknown) {
      console.error("加载用户资料失败:", err);
    }
  },

  // 更新全局用户信息
  updateUserInfo: function (
    this: AppInstance,
    userInfo: UserProfile
  ): void {
    this.globalData.userInfo = userInfo;
    this.globalData.isLoggedIn = true;
    wx.setStorageSync("userInfo", userInfo);
  },

  // 兼容旧版本的 getOpenId 方法
  getOpenId: function (this: AppInstance): Promise<string> {
    return new Promise((resolve, reject) => {
      this.checkLogin()
        .then((data) => {
          if (data && data.openid) {
            resolve(data.openid);
          } else {
            reject(new Error("登录失败"));
          }
        })
        .catch(reject);
    });
  }
};

App(appConfig);
