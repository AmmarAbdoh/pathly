// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'coverage/*'],
  },
  {
    rules: {
      /**
       * React Compiler guidance, enforced as errors from SDK 56.
       *
       * These flag state that is synchronised from props or from an external
       * source inside an effect. Every remaining instance is a deliberate
       * "mirror this input into editable local state" pattern (the goal detail
       * slider, the add-goal template prefill, the template modal's open/close
       * reset). They work correctly; React's preferred alternative is to adjust
       * state during render instead, which is worth doing but is a behavioural
       * refactor, not part of an SDK upgrade. Kept visible as warnings.
       */
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    // Reanimated shared values are mutated through `.value` by design - that is
    // the documented API, not React state. The compiler's immutability rule
    // cannot tell the difference, so it is a false positive here only.
    files: ['src/hooks/use-app-animations.ts', 'components/AnimatedCounter.tsx'],
    rules: {
      'react-hooks/immutability': 'off',
    },
  },
]);
