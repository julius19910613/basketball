declare module "wx-server-sdk" {
  export const DYNAMIC_CURRENT_ENV: string;

  export interface WXContext {
    OPENID?: string;
    APPID?: string;
    UNIONID?: string;
    ENV?: string;
  }

  export function init(options?: { env?: string }): void;
  export function getWXContext(): WXContext;
}
