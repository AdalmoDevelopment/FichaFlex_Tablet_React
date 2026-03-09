export default {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },
  moduleFileExtensions: ["js", "jsx"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testPathIgnorePatterns: ["/node_modules/"],
  moduleNameMapper: {
    "\\.(png|jpg|jpeg|gif|svg|wav|mp3)$": "<rootDir>/tests/__mocks__/fileMock.js",
    "\\.(css)$": "<rootDir>/tests/__mocks__/styleMock.js",
  },
};
