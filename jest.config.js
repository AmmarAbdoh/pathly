/**
 * Two Jest projects:
 *
 *  - `unit`    Pure TypeScript: src/utils, src/constants, src/i18n helpers, and
 *              the storage-level integration suites. ts-jest on plain Node -
 *              fast, and nothing React Native is loaded.
 *
 *  - `native`  Anything that needs the React Native runtime: the contexts and
 *              hooks rendered for real, plus the utils that import react-native
 *              or expo modules (notifications, export). Runs on jest-expo.
 *
 * Coverage ownership: every source file is instrumented by exactly one
 * project. ts-jest and Babel produce different statement maps for the same
 * file, and merging them corrupts the report - `utils` once read 83% instead
 * of its true 87% for exactly this reason.
 */

/** Files that import react-native / expo / reanimated, so only `native` can load them. */
const NATIVE_UTILS = ['notifications', 'export-data'];
const NATIVE_CONSTANTS = ['animation'];

const shared = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};

/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      ...shared,
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/src', '<rootDir>/__tests__'],
      testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
      testPathIgnorePatterns: ['/node_modules/', '<rootDir>/__tests__/native/'],
      coveragePathIgnorePatterns: [
        '/node_modules/',
        '<rootDir>/src/context/',
        '<rootDir>/src/hooks/',
        ...NATIVE_UTILS.map((name) => `<rootDir>/src/utils/${name}`),
        ...NATIVE_CONSTANTS.map((name) => `<rootDir>/src/constants/${name}`),
      ],
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
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
      transformIgnorePatterns: ['node_modules/(?!(react-native|@react-native|expo|@expo)/)'],
    },
    {
      ...shared,
      displayName: 'native',
      preset: 'jest-expo',
      testMatch: ['<rootDir>/__tests__/native/**/*.test.{ts,tsx}'],
      coveragePathIgnorePatterns: [
        '/node_modules/',
        `<rootDir>/src/constants/(?!(${NATIVE_CONSTANTS.join('|')}))`,
        '<rootDir>/src/i18n/',
        `<rootDir>/src/utils/(?!(${NATIVE_UTILS.join('|')}))`,
      ],
    },
  ],
  collectCoverageFrom: [
    'src/utils/**/*.{ts,tsx}',
    'src/constants/**/*.{ts,tsx}',
    'src/context/**/*.{ts,tsx}',
    'src/hooks/**/*.{ts,tsx}',
    'src/i18n/template-translations.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/types/**',
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};
