import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  projects: [
    "<rootDir>/jest.unit.config.ts",
    "<rootDir>/jest.page.config.ts",
    "<rootDir>/jest.component.config.ts"
  ]
};

export default config;
