module.exports = {
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.json",
    },
  },
  moduleFileExtensions: ["ts", "js"],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  testMatch: ["**/test/**/*.spec.(ts|js)"],
  testEnvironment: "node",
  restoreMocks: true,
  coveragePathIgnorePatterns: [
    "node_modules",
    "src/config",
    "src/app.js",
    "tests",
  ],
  coverageReporters: ["text", "lcov", "clover", "html"],
};
