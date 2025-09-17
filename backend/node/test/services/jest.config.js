// Raksha & Harshit
// backend/node/test/jest.config.js
export default {
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".js"],   // ✅ makes Jest treat .js as ESM
  roots: ["<rootDir>/services"],     // your test/services folder
  transform: {},                     // ✅ no Babel transform
  moduleFileExtensions: ["js", "json"],
  collectCoverage: true,
  collectCoverageFrom: [
    "../services/**/*.js",
    "!**/node_modules/**",
    "!**/vendor/**"
  ],
  coverageDirectory: "coverage",
  verbose: true
};
