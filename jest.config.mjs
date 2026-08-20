import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

/** @type {import('jest').Config} */
const config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  collectCoverageFrom: [
    "app/**/*.{ts,tsx}",
    "lib/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "!**/*.test.{ts,tsx}",
    "!**/*.d.ts",
    "!app/layout.tsx",
    "!lib/validation/schemas/index.ts",
    "!lib/supabase/**",
    "!lib/ai/**",
  ],
  coverageThreshold: {
    global: {
      statements: 75,
      branches: 60,
      functions: 70,
      lines: 75,
    },
  },
};

export default createJestConfig(config);
