import type { Config } from "@jest/types";
import shared = require("./jest.shared");

const config: Config.InitialOptions = {
  ...shared,
  displayName: "unit",
  testEnvironment: "node",
  testMatch: [
    "<rootDir>/tests/**/*.unit.test.ts",
    "<rootDir>/tests/**/*.unit.test.js",
    "<rootDir>/tests/smoke.test.ts",
    "<rootDir>/tests/smoke.test.js"
  ]
};

export = config;
