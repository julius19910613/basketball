// jest.setup.js - Jest 设置文件
const path = require('path');

// 模拟全局对象
global.Page = function(pageConfig) {
  // 页面配置保存到全局，供测试使用
  return pageConfig;
};

global.App = function(appConfig) {
  return appConfig;
};

global.getApp = function() {
  return {};
};

global.getCurrentPages = function() {
  return [];
};

global.requirePlugin = function(name) {
  return {};
};

global.requireMiniProgram = function() {
  return {};
};

global.atob = function(str) {
  return Buffer.from(str, 'base64').toString('binary');
};

global.btoa = function(str) {
  return Buffer.from(str, 'binary').toString('base64');
};

global.__wxConfig = {};
global.__wxRoute = '';
global.__wxExposedFunctions = {};
global.__webpack_require__ = function(moduleName) {
  return require(moduleName);
};

// 确保wx对象存在
if (!global.wx) {
  global.wx = {};
}

// 添加常用的wx方法
if (!wx.cloud) {
  wx.cloud = {};
}
