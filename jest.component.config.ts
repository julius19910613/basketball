import type { Config } from "@jest/types";
import shared = require("./jest.shared");

const config: Config.InitialOptions = {
  ...shared,
  displayName: "component",
  testEnvironment: "jsdom",
  setupFiles: ["<rootDir>/jest.setup.ts"],
  testMatch: [
    "<rootDir>/tests/**/*.component.test.ts",
    "<rootDir>/tests/**/*.component.test.js"
  ]
};

export = config;
