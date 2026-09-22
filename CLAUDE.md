# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

Pathly is a React Native + Expo (SDK 57, New Architecture) goal-tracking app. Offline-first:
all state lives in AsyncStorage, there is no backend. English + Arabic with RTL, light/dark/system
theming.

## Commands

```bash
npm start            # Expo dev server
npm run android      # native Android build
npm run ios          # native iOS build
npm test             # Jest, all suites
npm run test:watch   # Jest watch mode
npm run typecheck    # tsc --noEmit  -- MUST pass before committing
npm run lint         # expo lint    -- MUST have 0 errors before committing
npm run verify       # typecheck + lint + test together
```

`npm run verify` is the gate. Run it before you claim work is done.

## Non-negotiables

1. **Zero TypeScript errors.** The repo was at 6 for months because nobody ran `tsc`. Don't add
   to it, don't silence it with `any` or `@ts-expect-error`. Fix the type.
2. **Zero ESLint errors.** Warnings are tolerated; errors are not. The React Compiler's
   `set-state-in-effect` rule is deliberately set to `warn` in `eslint.config.js` — the
   remaining hits are intentional prop-to-state mirrors. Don't add new ones.
3. **Never call a hook outside a component body.** This repo has already shipped one
   `useGoals()`-inside-a-`useCallback` crash. Destructure from the top-level hook call.
4. **No dead routes.** Every file in `app/` is a live route. If nothing navigates to it, delete it
   rather than leaving it to rot.
5. **Don't add a dependency without using it.** Check `package.json` before reaching for a new one —
   several libraries already here went unused for months.

## Architecture

### Routing
Expo Router, file-based. `app/_layout.tsx` nests providers in a fixed order:

```
SafeAreaProvider > LanguageProvider > ThemeProvider > GoalsProvider > RewardsProvider
```

Theme depends on Language (RTL), Goals and Rewards depend on both. Don't reorder.

### State
Two React Contexts, both AsyncStorage-backed:

- `src/context/GoalsContext.tsx` — goals, subgoals, lifetime points. Persists via `src/utils/storage.ts`.
- `src/context/RewardsContext.tsx` — rewards and redemptions. Persists via `src/utils/rewards-storage.ts`.

**State mutation rule:** all mutators use the functional `setGoals(prev => ...)` form and persist
from inside that updater. Never read `goals` from the closure to compute the next state — it makes
the callback depend on `goals`, which changes the context value on every keystroke and re-renders
every consumer in the app. This was the single biggest source of sluggishness; don't reintroduce it.

**Persistence is debounced** (`scheduleSave` in GoalsContext). State updates are synchronous and
instant; the AsyncStorage write lands ~400ms later. Never `await` a save to update the UI.

### Business logic
Pure functions in `src/utils/`, each unit-tested. Keep them pure — no React, no AsyncStorage:

| File | Owns |
|---|---|
| `goal-calculations.ts` | progress %, time remaining, end dates |
| `goal-scheduling.ts` | which days a goal is active |
| `recurring-goals.ts` | period resets, streaks |
| `statistics.ts` | dashboard stats, achievement unlocking |
| `analytics.ts` | insight generation |
| `review-statistics.ts` | weekly/monthly review |
| `validation.ts` | form validation |
| `export-data.ts` | JSON import/export (CSV import unsupported) |
| `notifications.ts` | expo-notifications scheduling |

If you add logic to one of these, add a test in the sibling `__tests__/` directory.

### Points model
Available points = lifetime earned − spent. Lifetime points **never decrease** — they're stored
under their own AsyncStorage key, separate from goals. Subgoals only award points when the parent
sets `subgoalsAwardPoints`.

## Performance rules

This app got slow by ignoring these. They are the house style now:

1. **Memoized list rows need stable props.** `GoalCard` is `memo()`'d. Passing
   `onPress={() => f(id)}` from `renderItem` creates a new function every render and defeats it
   entirely. Pass the id down and let the row build its own handler (`GoalCard` takes `id` and
   `onPress: (id) => void`).
2. **`ListHeaderComponent` takes an element, not a function.** Passing a function that closes over
   state remounts the whole header — including any `TextInput` — on every state change.
   Pass `<Foo />`, not `() => <Foo />`.
3. **Don't compute per-row derived data inside `renderItem`.** Precompute it in a `useMemo` keyed on
   the source array and look it up by id. `renderItem` runs on every scroll frame.
4. **No O(n) lookups inside `renderItem`.** No `.find()`, no `.findIndex()`. Build a `Map` once.
5. **Debounce text input that drives filtering.** See `useDebouncedValue` in `src/hooks/`.
6. **FlatLists get windowing props** — `removeClippedSubviews`, `initialNumToRender`,
   `maxToRenderPerBatch`, `windowSize`.

## Animations

`react-native-reanimated` v4 with `react-native-worklets`. Shared conventions live in
`src/constants/animation.ts` — use `DURATION` and `EASING` from there rather than inventing timings.

- Animate on the UI thread. `useSharedValue` + `useAnimatedStyle`, never `setState` in a frame loop.
- `Layout`/`FadeIn`/`FadeOut` from `reanimated` handle list add/remove.
- Respect `useReducedMotion()` — `src/hooks/use-app-animations.ts` wraps this.
- Do **not** add `react-native-reanimated/plugin` to `babel.config.js`. `babel-preset-expo`
  injects the worklets plugin automatically when `react-native-worklets` is installed; adding
  it manually applies it twice.

## Styling

- `StyleSheet.create` only. **NativeWind is not configured** — `className` props silently do
  nothing. Don't use them.
- Colors come from `useTheme()` (`src/context/ThemeContext.tsx` → `constants/theme.ts`). Never
  hardcode a hex that varies between light and dark.
- Status/gesture bars: use `SafeAreaView` from `react-native-safe-area-context` with explicit
  `edges`, or `useSafeAreaInsets()`. Never a magic `paddingTop: 60`. Edge-to-edge is enabled, so
  the system bars overlay the app.

## i18n

- All user-facing strings go in `src/i18n/translations.ts` under both `en` and `ar`.
- Never hardcode English in a component. Use `const { t } = useLanguage()`.
- Functions in `src/utils/` that produce display strings take a `t` argument — they don't import
  translations directly (keeps them pure and testable).
- Numbers go through `formatNumber(value, language)` for Arabic-Indic digits.

## Testing

Jest + `@testing-library/react-native`. Unit tests next to the code in `__tests__/`, integration
tests in the root `__tests__/integration/`. Add tests for new `src/utils/` logic; UI tests are
nice-to-have, not required.

## Gotchas

- Android edge-to-edge is **always on** from SDK 55 (the `edgeToEdgeEnabled` flag was removed
  from the config schema), so the system bars overlay the app and
  `expo-navigation-bar`'s `setVisibilityAsync` / `setBehaviorAsync` are no-ops. Don't call them.
- **Never import from `@react-navigation/*`.** Since SDK 56 expo-router forbids it. Use the
  `expo-router/js-*` entrypoints — the tab bar imports `createMaterialTopTabNavigator` from
  `expo-router/js-top-tabs`. That entrypoint needs `react-native-tab-view` installed, which
  nothing else pulls in; removing it breaks the app at runtime with no build-time error.
- `expo-router` types `MaterialTopTabBarProps` as `any & {...}`, which collapses to `any`.
  `app/(tabs)/_layout.tsx` declares the props it uses locally to keep the file checked.
- Guard optional strings with a ternary, not `&&` — `{icon && <Text/>}` renders a bare `''`
  into a View when the string is empty, which throws on native.
- `app.json` ships a real bundle id / package name. Changing them after a store release breaks
  updates for existing installs.
- `expo-notifications` no longer supports remote push in Expo Go — local scheduled notifications
  (all this app uses) work fine, but test them in a dev build.
- The tab bar is a `MaterialTopTabNavigator` pinned to the bottom, not a real bottom tab navigator.
  That's what makes the tabs swipeable.

## Commits

Conventional commits (`feat:`, `fix:`, `perf:`, `refactor:`, `chore:`). Run `npm run verify` first.
