import type { Config } from "@jest/types";
import shared from "./jest.shared";

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

export default config;
