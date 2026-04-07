const cloud = require('wx-server-sdk')

// 使用当前云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  // 这里的 OPENID 和 UNIONID 是微信云开发自动注入的
  // 只有当小程序绑定了开放平台账号且当前用户关注了同主体的公众号或使用了其他同主体应用时，才会返回 UNIONID
  return {
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID || null,
    env: wxContext.ENV,
  }
}