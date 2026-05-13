import type { Config } from "@jest/types";
import shared = require("./jest.shared");

const config: Config.InitialOptions = {
  ...shared,
  displayName: "e2e",
  testEnvironment: "node",
  testMatch: ["**/e2e/**/*.test.js", "**/e2e/**/*.test.ts"],
  maxWorkers: 1,
  testTimeout: 120000,
  setupFilesAfterEnv: ["./e2e/setup"],
  verbose: true,
  collectCoverage: false,
  coveragePathIgnorePatterns: ["/node_modules/", "/e2e/"]
};

export = config;
