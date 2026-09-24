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
npm run lint         # eslint .     -- MUST have 0 errors before committing
npm run verify       # typecheck + lint + test together
```

`npm run verify` is the gate. Run it before you claim work is done.

`lint` runs `eslint .`, not `expo lint` — the latter covers a narrower set of paths and let
real errors in `jest.setup.js` sit behind a green check.

## Non-negotiables

1. **Zero TypeScript errors.** The repo was at 6 for months because nobody ran `tsc`. Don't add
   to it, don't silence it with `any` or `@ts-expect-error`. Fix the type.
2. **Zero ESLint errors.** Warnings are tolerated; errors are not. The React Compiler's
   `set-state-in-effect` rule is deliberately set to `warn` in `eslint.config.js` — the
   remaining hits are the four provider mount-loads and four intentional prop-to-state mirrors
   (listed there). Don't add new ones.
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

Theme depends on Language (RTL), Goals and Rewards depend on both, and Rewards listens to Goals
(`onGoalCompleted`), so it must stay inside `GoalsProvider` - in tests too. Don't reorder.

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

**Never write another provider's storage key.** Each context owns its key and holds it in a ref;
a write from outside leaves that ref stale, and the owner's next save writes the stale copy back.
(GoalsContext auto-redeemed rewards this way, and the next reward change un-redeemed them.) To
react to another provider, subscribe: RewardsContext redeems linked rewards via `onGoalCompleted`,
which fires on a goal's first completion by *any* path (`updateGoal` reaching the target, or
`finishGoal`) and only once goals have loaded - a completion that can't be saved redeems nothing.
"First" means never completed before - `hasBeenCompleted` in `recurring-goals.ts`, the one rule
for points and redemption: `completedAt` stays when a goal is set back, so -1 then +1 pays nothing
again; a recurring goal's new period clears it; and it is a number check, not truthiness (0 is a
time too).
Auto-redemption follows the Rewards screen's rule (`getAvailablePoints` in `src/utils/points.ts`,
used by both): a reward the user can't afford stays available.

**Storage failures are surfaced, retried, and never destructive.** `StorageErrorBanner` (mounted in
`app/_layout.tsx`) shows each context's `storageError`.
- The storage helpers **throw** on a failed read. Never return `[]` for unreadable data: the
  caller can't tell it from "nothing saved", and the next save writes over everything.
- Two kinds of read failure. A failed *read* (`'load'`) may work next time: **every write is
  held** - goals, lifetime points, imports - until a reload succeeds; the banner offers Retry.
  Dismissing it only hides it; the next change raises it again. Data that was read but is *not
  a list* (`UnreadableDataError`) never will be: it is kept aside under
  `<key>.unreadable.<timestamp>` and the app starts empty. Blocking on it left no way out but
  clearing the app's data. It is set aside only after *every* read has worked: set aside first,
  a later failed read left a Retry that found no goals and said nothing. It is reported by its
  own flag, `dataSetAside`, which the banner shows *alongside* any error: as one more kind of
  `storageError` it was hidden by other errors, closed with them, and cleared by the next save.
- Writes are also held until the *first* load finishes (`loadState: 'pending'`), not just after
  a failed one.
- A failed goals write stays queued (`'save'`) and is retried. A write the load itself implies
  (period rollover, first lifetime total) failing is a failed save, not a failed load. Queue it
  before awaiting anything else: once loaded, changes are allowed, and queueing the loaded goals
  after one would put them over it.
- **Once loaded, memory is the source of truth: refresh never re-reads storage.** Nothing else
  writes it, so a re-read can only return what was written - or something older, whenever a save
  is queued or in flight. Re-reading raced saves and lost edits. Refresh rolls periods over in
  memory and retries failed saves; so does the app coming back to the foreground (the rollover,
  not the retry) - a daily goal left in the background overnight kept yesterday's period, and a
  completion made in it was paid twice. Only the first load and Retry after a failed load read
  storage, and each discards the save queue. An import is not read back either: that threw
  away changes made while it finished. It goes into memory and is rolled over there.
- What a load or refresh applies (`rollOver`, `archivedRemindersOff`) hands back every goal it
  leaves alone *as it was*, and the save is decided by identity. Keep it that way in anything
  added there: a hand-kept list of changed fields missed each field added later, and a copy
  made when nothing changed writes the goals on every launch.
- An unsaved lifetime total in memory is newer than disk, so a reload must not read it back.
- Rewards changes run **one at a time** (a queue - `useSerialQueue`, which reminder changes use
  too), so a failed one can be undone exactly; the screen reports it. A linked reward that can't
  be redeemed yet (not loaded, write failed) is queued and redeemed on the next load or Retry
  (`'save'`).

**Import keeps records whole, and is all or nothing.** `buildImport` (`src/utils/import-data.ts`)
builds the next state; `useImportBackup` (`src/hooks/`) applies it - rewards first, put back if the
goals then fail (`PartialImportError` if even that fails - its message differs for Merge and
Replace). It builds from `getCurrentGoals()` and the rewards `withRewardsHeld` hands it, at the
moment it applies - never from a screen's render-time copy, which is stale after the file picker,
or empty before loading finishes; both reject until loaded. `withRewardsHeld` holds the rewards
queue for the whole import, so a reward redeemed meanwhile isn't undone by it, and
`withGoalsHeld` the goals: until the import is in, goal changes are refused (`GoalsBusyError`)
and reminder changes wait their turn. Made meanwhile, a change was built on goals the import was
about to replace - an edit was lost, a completion kept its points and redeemed reward though the
goal came back incomplete, and reminders were scheduled that nothing kept.
While the import is written, queued goal saves are held so none can land on top of it, and once
it is written memory holds it at once, so no change made in the meantime is built on the goals
it replaced. Never
import by calling `addGoal` / `addReward` per record — that is what used to drop completion
state, history, notes, schedules and links.

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
| `ids.ts` | collision-free record ids (`Date.now()` alone collides) |
| `import-data.ts` | backup import: merge/replace, id remapping, repairing untrusted fields |
| `points.ts` | spent and available points: the one affordability rule |

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
- Never hardcode English in a component. Use `const { t } = useLanguage()`. That includes
  alerts, accessibility labels and hints, placeholders and abbreviations like "pts".
  `src/i18n/__tests__/hardcoded-text.test.ts` fails on those shapes in `app/` and `components/`.
- Functions in `src/utils/` that produce display strings take a `t` argument — they don't import
  translations directly (keeps them pure and testable). That includes notification text:
  `scheduleGoalNotification(goal, t.notifications)`. It is fixed when scheduled, so after a
  language change or a rename `rescheduleReminders` schedules them again.
- Numbers go through `formatNumber(value, language)` for Arabic-Indic digits - every count,
  total and percentage on screen, not just the headline ones.
- Right after `setLanguage`, `t` in that handler is still the old language. Text about the
  switch comes from `translations[newLanguage]`.
- Put user text into a translation with a function: `.replace('{goal}', () => goal.title)`.
  Passed as a string, `$$` and `$&` in it are replacement patterns.

## Testing

Jest + `@testing-library/react-native`, split into two projects in `jest.config.js`:

- **`unit`** — `ts-jest` on plain Node. Pure logic: `src/utils`, `src/constants`, the template
  translations, and the storage-level suites in `__tests__/integration/`. Cannot load
  `react-native`.
- **`native`** — `jest-expo`, tests in `__tests__/native/`. Anything that needs the RN runtime:
  the contexts and hooks rendered for real with `renderHook`, plus the utils that import
  react-native / expo / Reanimated (`notifications`, `export-data`, `constants/animation`).

Every logic file is in coverage scope — nothing is excluded to flatter the number.
`npm run test:coverage` meets its 90% threshold on all four metrics (~97% statements, ~93%
branches). What remains uncovered is unreachable: `catch` blocks around pure synchronous
updates, and guards that re-check a condition an earlier `filter` guarantees.

Add tests for new `src/utils/` logic in `unit`, and for context/hook/RN-dependent code in
`native`. Run one side with `npx jest --selectProjects native`.

Gotchas:
- **Never `jest.spyOn(...)` an already-mocked function and then `mockRestore()` it.** AsyncStorage's
  methods and, under jest-expo, `AppState.addEventListener` are already `jest.fn`s. `spyOn` returns
  that same function and `mockRestore()` wipes its implementation, silently breaking every later
  test in the file. Use `mockImplementationOnce` / `mockRejectedValueOnce`, or cast and
  `mockClear()`. This has bitten this repo twice.
- `jest.clearAllMocks()` in a `beforeEach` erases calls made at **module load** (e.g. the
  `setNotificationHandler` registration). Capture those at the top of the file.
- `jest.mock` calls are hoisted above imports automatically — keep imports at the top of the file.
  Variables a mock factory references must be prefixed `mock`.
- Jest cannot execute a dynamic `import()`. Import statically.
- Each file must be instrumented by exactly one project (`coveragePathIgnorePatterns`). ts-jest and
  Babel produce different statement maps, and merging them corrupts the coverage report.
- `jest.setup.js` mocks `react-native-worklets` and adds `useReducedMotion` to Reanimated's own
  mock, which omits it. Without those, nothing animated can be rendered in a test.
- To fail storage, key the mock (`if (key === STORAGE_KEYS.GOALS) throw ...`) rather than using a
  one-shot `mockRejectedValueOnce`: every provider reads and writes storage on mount, and whichever
  call comes first consumes the one-shot. `storage-errors.test.tsx` has `failNextLoad` / `failWrites`.
- For races, hold one storage call open with `holdNext` (in `storage-errors.test.tsx`), which
  keeps AsyncStorage's call order, then do the competing thing and release it.
- A regression test only counts once you have seen it fail with the fix removed.
- When a test checks what a library does with our input, run the input through the library's real
  code rather than a mock of it (see `parseTrigger` in the notifications tests) — that is how the
  untyped reminder trigger was caught.

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
- **Guard falsy non-booleans with a ternary, not `&&`.** `{count && <X/>}` renders a literal
  `0` when count is 0 — a string child of a `View`, which **throws on native**. That is the
  real hazard. An empty *string* (`{name && <X/>}`) is skipped by React's reconciler and does
  not crash, but it still produces a hydration error on web, so use a ternary for both.
  Prefer `{count > 0 ? … : null}` and `{name ? … : null}`.
- **Never use `Date.now()` alone as a record id.** Records created in the same millisecond collide
  (import does this in a loop). Use `nextId()` from `src/utils/ids.ts`.
- Plural rules are per-locale. `formatTimeRemaining` only applies Arabic's "11+ takes the
  singular" when the locale's `time.singularAfterTen` is true; applying it globally made English
  read "25 day left".
- **Analytics returns data, not text.** `findBestCompletionDay` returns a weekday index and
  `findMostProductiveHour` an hour; both can legitimately be `0` (Sunday, midnight), so check
  `!== null`, never truthiness. The screen formats them in the user's language.
- **Which goals can recur is one rule: `canRecur` (`recurring-goals.ts`).** A top-level,
  non-ultimate goal whose period ends: `getPeriodEndDate` returns the start date for `'ongoing'`,
  and for `'custom'` without a length, so such a goal would reset on every load - as it would with
  a length of a moment. `isPeriodLength` is the rule: a day or more, fractions allowed, up to
  `MAX_PERIOD_DAYS` (past that the deadline maths runs out of dates). `addGoal`, `editGoal`,
  `buildImport`, the form and loading (`processRecurringGoals`, which turns recurring off for a
  saved goal that breaks it) all call it. Don't write a local copy: two copies that disagreed let recurring
  subgoals in through import. Only a recurring goal keeps a `schedule` - on any other it hid the
  goal on unscheduled days, and the form (which offers it only for recurring) couldn't show why.
- **A recurring goal's deadline is its reset** (`getPeriodEndDate`); a one-off goal's is the end
  of its last day. Pass `isRecurring` to `calculateTimeRemaining` and `formatEndDateTime`:
  without it, a daily goal counted down to the end of tomorrow while it reset at midnight tonight.
- `Number.isFinite`, not `typeof x === 'number'`, for numbers from outside: JSON's `1e999` parses
  as `Infinity`, which `JSON.stringify` saves as `null`.
- A backup file is untrusted input: it can contain duplicate ids, dangling links, missing fields,
  values of the wrong type (an object `icon` crashes every render of the card) and even parent
  cycles (which make progress calculation recurse forever). `buildImport` builds each record
  field by field, checking types, rather than spreading the file; keep it that way.
- Archiving a subgoal removes it from `parent.subGoals` but keeps its `parentId`. So `subGoals`,
  not `parentId`, says what counts toward a parent - don't rebuild one from the other.
- `GoalCard`'s tap target is a sibling *beneath* the content. A touch on a plain View bubbles to
  its ancestors, never a sibling, so anything drawn over the card that isn't a button needs
  `pointerEvents: 'none'` (badges, a disabled arrow) or `'box-none'` (containers).
- `editGoal` sets every field it takes, so leaving an argument out clears it: the detail screen
  once dropped `linkedRewardId` (unlinking the goal's reward on every edit) and never passed the
  schedule at all. It also doesn't touch completion state or the period - reset a recurring goal
  with `resetRecurringGoal`.
- `AddGoalForm` reads `initialValues` only when it mounts. The Add tab stays mounted between
  goals, so `resetForm` must clear *every* field - it once kept the last goal's linked reward
  for the next one - and showing a template again takes a remount (the screen keys the form on it).
- A goal's reminders live in the OS, not in the goal. Anything that takes a goal off the list
  (archive, delete, import) cancels its `notificationIds`, or they keep firing for a goal that
  is gone; loading does the same for an archived goal that still has them. Likewise any id
  scheduled but not stored: `scheduleGoalNotification` cancels what it scheduled if a later day
  fails, and `rescheduleReminders` / `updateNotificationSettings` cancel, rather than store, new
  ids for a goal archived, deleted or imported over while they worked (the settings save then
  rejects, so the screen doesn't say it worked). Those two run one at a time (a queue), or
  overlapping calls each start from the same ids and the first to finish wins - so a screen
  shouldn't await a reschedule to carry on. Reminders that failed part-way (their old ones are
  already cancelled by then) are turned off; a refusal (`NotificationPermissionError`, thrown
  before anything is cancelled) leaves them as they are. `rescheduleReminders` counts both
  (`{ turnedOff, notAllowed }`) for the screen to report; a failed settings save does the same
  turning off, and rejects.
- `app.json` ships a real bundle id / package name. Changing them after a store release breaks
  updates for existing installs.
- `expo-notifications` no longer supports remote push in Expo Go — local scheduled notifications
  (all this app uses) work fine, but test them in a dev build.
- The tab bar is a `MaterialTopTabNavigator` pinned to the bottom, not a real bottom tab navigator.
  That's what makes the tabs swipeable.

## Commits

Conventional commits (`feat:`, `fix:`, `perf:`, `refactor:`, `chore:`). Run `npm run verify` first.
