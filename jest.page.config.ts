import type { Config } from "@jest/types";
import shared = require("./jest.shared");

const config: Config.InitialOptions = {
  ...shared,
  displayName: "page",
  testEnvironment: "node",
  setupFiles: ["<rootDir>/jest.setup.js"],
  testMatch: [
    "<rootDir>/tests/**/*.page.test.ts",
    "<rootDir>/tests/**/*.page.test.js",
    "<rootDir>/tests/**/*.workflow.test.ts",
    "<rootDir>/tests/**/*.workflow.test.js",
    "<rootDir>/tests/**/*.self-test.test.ts",
    "<rootDir>/tests/**/*.self-test.test.js"
  ]
};

export = config;
