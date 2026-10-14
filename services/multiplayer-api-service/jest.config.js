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
  ],
  setupFilesAfterEnv: [
    '<rootDir>/__tests__/helper/setupTests.ts',
  ],
  testTimeout: 15000,
  moduleNameMapper: {
    '^axios$': require.resolve('axios'),
  },
}
