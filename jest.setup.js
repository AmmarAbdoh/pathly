// Jest setup for React Native Testing Library
// Matchers are now built-in to @testing-library/react-native v12.4+

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    // Screens gate back-navigation on this; without it the first UI test
    // written against them fails with "canGoBack is not a function".
    canGoBack: jest.fn(() => true),
  }),
  useLocalSearchParams: () => ({}),
  Stack: ({ children }) => children,
  Tabs: ({ children }) => children,
}));

// Reanimated 4 runs on react-native-worklets, whose real entrypoint boots a
// native module. Its mock has to be in place first, or the Reanimated mock below
// fails with "Cannot read properties of undefined (reading 'loadUnpackers')".
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  // Reanimated's own mock omits this ("ADD ME IF NEEDED"), so anything that
  // respects the OS reduce-motion setting could not be rendered in a test.
  Reanimated.useReducedMotion = () => false;
  return Reanimated;
});

// Set up setImmediate
global.setImmediate = global.setImmediate || ((fn, ...args) => global.setTimeout(fn, 0, ...args));
