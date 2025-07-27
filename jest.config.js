module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/src/__tests__/client.test.ts',
        '<rootDir>/src/__tests__/error-handling.test.ts',
        '<rootDir>/src/__tests__/filtering-pagination.test.ts',
        '<rootDir>/src/__tests__/interceptors.test.ts',
        '<rootDir>/src/__tests__/client-caching.test.ts'
      ],
    },
    {
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/src/__tests__/cache.test.ts'
      ],
    },
  ],
};
