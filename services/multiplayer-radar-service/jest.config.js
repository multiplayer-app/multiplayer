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
    'node_modules/duration-to-ms',
  ],
  testTimeout: 15000,
  moduleNameMapper: {
    'axios': require.resolve('axios'),
  },
}
