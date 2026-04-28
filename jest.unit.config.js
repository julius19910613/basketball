const shared = require("./jest.shared");

module.exports = {
  ...shared,
  displayName: "unit",
  testEnvironment: "node",
  testMatch: [
    "<rootDir>/tests/**/*.unit.test.js",
    "<rootDir>/tests/smoke.test.js"
  ]
};
