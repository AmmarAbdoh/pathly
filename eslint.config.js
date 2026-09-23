// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const globals = require('globals');

module.exports = defineConfig([
  expoConfig,
  {
    // `.expo` and `coverage` are generated; `dist` is build output. None are
    // editable in source, so linting them only produces unfixable noise.
    ignores: ['dist/*', 'coverage/*', '.expo/*', 'android/*', 'ios/*'],
  },
  {
    /**
     * eslint-config-expo supplies browser + React Native globals only, so the
     * test files' `jest` and `node` globals are otherwise reported as no-undef.
     */
    files: ['jest.setup.js', 'jest.config.js', '**/__tests__/**', '**/*.test.{ts,tsx,js}'],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
  },
  {
    rules: {
      /**
       * React Compiler guidance, promoted to an error in SDK 56.
       *
       * Eight sites currently trip this, in two groups:
       *  - Four provider mount effects (Goals/Theme/Language/Rewards) that load
       *    persisted state from AsyncStorage. An effect is the correct place to
       *    read an external store; the setState is the point.
       *  - Four prop-to-state mirrors (the goal detail slider, the add-goal
       *    template prefill, and the two template modals' open/close resets).
       *
       * Both groups work correctly. React would prefer the second group adjust
       * state during render instead, which is a behavioural refactor worth
       * doing deliberately rather than as upgrade fallout. Kept as warnings so
       * they stay visible; don't add new ones.
       */
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    // Reanimated shared values are mutated through `.value` by design - that is
    // the documented API, not React state, and the compiler's immutability rule
    // cannot tell the difference. This is the only file that writes one outside
    // an effect, which is the only shape the rule flags.
    files: ['src/hooks/use-app-animations.ts'],
    rules: {
      'react-hooks/immutability': 'off',
    },
  },
]);
