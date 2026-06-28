module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts?$': 'babel-jest',
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
  transformIgnorePatterns: [
    'dist',
    'node_modules',
  ],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
    },
  },
}
