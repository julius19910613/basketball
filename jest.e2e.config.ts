import type { Config } from "@jest/types";
import shared from "./jest.shared";

const config: Config.InitialOptions = {
  ...shared,
  displayName: "e2e",
  testEnvironment: "node",
  testMatch: ["**/e2e/**/*.test.js", "**/e2e/**/*.test.ts"],
  maxWorkers: 1,
  testTimeout: 120000,
  setupFilesAfterEnv: ["<rootDir>/e2e/setup.ts"],
  verbose: true,
  collectCoverage: false,
  coveragePathIgnorePatterns: ["/node_modules/", "/e2e/"]
};

export default config;
