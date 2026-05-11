import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  projects: [
    "<rootDir>/jest.unit.config.ts",
    "<rootDir>/jest.page.config.js",
    "<rootDir>/jest.component.config.js"
  ]
};

export = config;
