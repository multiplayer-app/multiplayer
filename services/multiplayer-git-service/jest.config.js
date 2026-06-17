module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'babel-jest',
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
  transformIgnorePatterns: [
    '<rootDir>/libs/(?!dist/.*)',
  ],
  moduleNameMapper: {
    'axios': require.resolve('axios'),
  },
}
