export default {
  testEnvironment: "jsdom", // Simula el navegador
  transform: {
    "^.+\\.jsx?$": "babel-jest", // Permite usar JSX y ESModules
  },
  moduleFileExtensions: ["js", "jsx"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"], // Config extra (matchers, mocks, etc)
};
