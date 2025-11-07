/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
    '**/__tests__/integration/**/*.test.tsx',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react',
        },
      },
    ],
  },
  collectCoverageFrom: [
    'src/utils/**/*.{ts,tsx}',
    'src/constants/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/types/**',
    '!src/context/**',
    '!src/i18n/template-translations.ts', // Skip large translation file
    '!src/constants/goal-templates.ts',   // Skip large template file
    '!src/constants/reward-templates.ts', // Skip large template file
    '!src/utils/storage.ts',              // External dependency (AsyncStorage)
    '!src/utils/rewards-storage.ts',      // External dependency (AsyncStorage)
    '!src/utils/notifications.ts',        // External dependency (expo-notifications)
    '!src/utils/analytics.ts',            // External dependency (expo-file-system)
    '!src/utils/export-data.ts',          // External dependency (expo-file-system)
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@react-navigation)/)',
  ],
};
