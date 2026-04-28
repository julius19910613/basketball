const shared = require("./jest.shared");

module.exports = {
  ...shared,
  displayName: "page",
  testEnvironment: "node",
  setupFiles: ["<rootDir>/jest.setup.js"],
  testMatch: [
    "<rootDir>/tests/**/*.page.test.js",
    "<rootDir>/tests/**/*.workflow.test.js",
    "<rootDir>/tests/**/*.self-test.test.js"
  ]
};
