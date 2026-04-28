const shared = require("./jest.shared");

module.exports = {
  ...shared,
  displayName: "component",
  testEnvironment: "jsdom",
  setupFiles: ["<rootDir>/jest.setup.js"],
  testMatch: ["<rootDir>/tests/**/*.component.test.js"]
};
