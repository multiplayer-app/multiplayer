module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts?$': 'babel-jest',
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
  transformIgnorePatterns: [
    '<rootDir>/libs/(?!dist/.*)',
    'dist',
    'node_modules',
  ],
}
