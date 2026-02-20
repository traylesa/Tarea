module.exports = {
  setupFiles: ['./tests/setup.js'],
  testMatch: ['**/tests/TDD/**/*.js'],
  collectCoverageFrom: [
    'src/extension/**/*.js',
    'src/gas/**/*.js',
    '!src/extension/panel.js',
    '!src/extension/panel-plantillas.js',
    '!src/extension/popup.js',
    '!src/extension/background.js',
    '!src/extension/config-ui.js',
    '!src/extension/help-content.js',
    '!src/extension/lib/**'
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
