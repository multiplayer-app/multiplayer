module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'babel-jest',
  },
  testMatch: [
    '**/__tests__/**/*.test.ts',
  ],
  transformIgnorePatterns: [
    '<rootDir>/libs/(?!dist/.*)',
    'jest.config.js',
    'node_modules/(?\!yjs|y-indexeddb|lib0)',
  ],
  setupFilesAfterEnv: [
    '<rootDir>/__tests__/helper/setupTests.ts',
  ],
  testTimeout: 15000,
  moduleNameMapper: {
    'axios': require.resolve('axios'),
  },
}
