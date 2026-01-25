# Pathly Agent Notes

These notes are a quick map of the app to help new agents get oriented before deep changes.

## Overview
- React Native + Expo Router app for goal tracking with rewards, stats, analytics, and review flows.
- Core domains: goals (including ultimate goals and subgoals), recurring goals, points, rewards, achievements.
- i18n supports English and Arabic with RTL, plus light/dark/system theming.

## Navigation and Entry
- `app/_layout.tsx` sets providers (Language -> Theme -> Goals -> Rewards) and stack routes.
- `app/index.tsx` redirects to `/(tabs)/home`.
- `app/(tabs)/_layout.tsx` uses `MaterialTopTabNavigator` as a bottom tab bar with a custom tab bar.

## Screens and Flows
- Home: `app/(tabs)/home.tsx` lists goals by sections (ultimate, by period, completed), filters by schedule/status, supports search and manual reordering.
- Add Goal: `app/(tabs)/add-goal.tsx` uses `components/AddGoalForm.tsx` and `components/TemplatesModal.tsx`.
- Goal Detail: `app/goal/[id].tsx` is the main management hub (progress updates, edit, pause, archive, extend, subgoals, dependencies, notes, notifications, save template).
- Rewards: `app/(tabs)/rewards.tsx` manages reward CRUD and redemption; templates in `components/RewardTemplatesModal.tsx`.
- Stats: `app/(tabs)/statistics.tsx` plus `app/analytics.tsx` and `app/review.tsx` for deeper insights and review periods.
- Settings: `app/(tabs)/settings.tsx` handles theme, language, import/export, and archived goals.
- `app/goal/add.tsx` is a minimal add-goal modal route (NativeWind), separate from the main AddGoalForm flow.

## State and Persistence
- Goals state: `src/context/GoalsContext.tsx` with AsyncStorage via `src/utils/storage.ts`.
- Rewards state: `src/context/RewardsContext.tsx` with AsyncStorage via `src/utils/rewards-storage.ts`.
- Lifetime points are tracked separately in `AsyncStorage` and never decrease.
- Recurring goals reset on load (`processRecurringGoals`) and update streaks (`updateGoalStreaks`).

## Data Model
- See `src/types/index.ts` for `Goal`, `Reward`, `GoalSchedule`, `GoalNote`, `Achievement`, and `Statistics`.
- Important fields: `parentId` + `subGoals` for subgoals, `isUltimate`, `subgoalsAwardPoints`, `dependsOn`, `schedule`, `isArchived`, `sortOrder`, `notifications*`, `linkedRewardId`.

## Business Logic
- Progress + time remaining: `src/utils/goal-calculations.ts`.
- Scheduling (goal appears only on certain days): `src/utils/goal-scheduling.ts`.
- Recurring logic + streaks: `src/utils/recurring-goals.ts`.
- Stats and achievements: `src/utils/statistics.ts` + `src/constants/achievements.ts`.
- Analytics insights: `src/utils/analytics.ts`.
- Review stats: `src/utils/review-statistics.ts`.
- Import/export: `src/utils/export-data.ts` (CSV import is not supported yet).
- Notifications: `src/utils/notifications.ts`.

## i18n and RTL
- Translations live in `src/i18n/translations.ts` and template translations in `src/i18n/template-translations.ts`.
- RTL toggle is handled in `src/context/LanguageContext.tsx`.
- Some UI strings are still hardcoded English (for example schedule picker and some analytics/review labels).

## Theming
- `src/context/ThemeContext.tsx` reads `constants/theme.ts` (light/dark colors and fonts).
- There is leftover Expo template theming (`components/themed-*`, `hooks/use-theme-color.ts`) that expects a `Colors` export not present in `constants/theme.ts`. These components are not used in the main flow.

## Points and Rewards Rules
- Available points = lifetime points earned - spent points (redeemed rewards).
- Subgoals award points only if the parent goal sets `subgoalsAwardPoints`.
- Linked rewards can auto-redeem on goal completion.

## Tests
- Unit tests for utils and constants in `src/utils/__tests__` and `src/constants/__tests__`.
- Integration tests in `__tests__/integration/*`.
- Jest config in `jest.config.js` excludes large templates and storage/notification helpers from coverage.

## Gotchas to Keep in Mind
- `GoalSchedulePicker` and `getScheduleDescription` return English strings; if you extend i18n, update these.
- `app/goal/add.tsx` uses NativeWind and a smaller form than `AddGoalForm` (verify which flow you are touching).
- `hooks/use-theme-color.ts` and `components/ui/collapsible.tsx` reference `Colors` from `constants/theme.ts`, which is not exported there.
