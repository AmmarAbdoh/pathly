# 🎯 Pathly

**Track your progress, step by step**

Pathly is a goal-tracking mobile app built with React Native and Expo. Set goals, break them into
subgoals, track progress, earn points, and cash them in for rewards you set yourself. Fully offline —
your data never leaves your device.

![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-blue)
![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB?logo=react)
![Expo](https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript)

---

## ✨ Features

### 🎯 Goal Management
- **Ultimate Goals** — long-term objectives that act as your north star
- **Recurring Goals** — daily, weekly, monthly, yearly or custom periods that reset automatically
- **Scheduling** — have a goal appear only on chosen weekdays, dates, or a monthly date range
- **Goal Templates** — 50+ pre-built templates across 9 categories
- **Subgoals** — break a big goal into steps; parent progress rolls up automatically
- **Dependencies** — block a goal until its prerequisites are complete
- **Notes** — keep a running log against any goal
- **Reminders** — local notifications on the days and time you pick
- **Custom Icons** — 500+ emoji
- **Flexible Units** — books, km, workouts, hours and 30+ more
- **Increase or decrease** — track weight loss just as easily as books read

### 🏆 Gamification
- **Points** for completing goals and (optionally) subgoals
- **Rewards Store** — define your own rewards and redeem them with earned points
- **Linked rewards** — auto-redeem a reward when its goal completes
- **Achievements** — 10 to unlock
- **Streaks** — current and longest, for recurring goals

### 💾 Backup & Restore
- Export everything as JSON (or CSV for spreadsheets)
- Import a backup by **merging** it with your current data or **replacing** it — every goal and
  reward comes back whole: progress, history, streaks, notes, schedules and links
- If data can't be saved, you're told straight away, with a Retry

### 📊 Insights
- Progress dashboard with completion rate and lifetime points
- Analytics screen with generated insights
- Weekly and monthly review screens

### 🌍 Internationalization
- Full English and Arabic translations, including RTL layout
- Arabic-Indic numerals throughout

### 🎨 Theming & Motion
- Light, dark and system themes
- Spring press feedback, animated progress fills, staggered entrances
- Honours the OS "reduce motion" setting

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- An Android emulator / iOS simulator, or the Expo Go app

### Setup

```bash
git clone https://github.com/ammarabdoh/pathly.git
cd pathly
npm install
npx expo start
```

Then press `a` for Android, `i` for iOS, or scan the QR code with Expo Go.

> **Note on notifications:** Expo Go no longer supports remote push. The local scheduled reminders
> this app uses do work there, but test them in a development build if you're changing that code.

---

## 🧰 Scripts

| Script | What it does |
|---|---|
| `npm start` | Expo dev server |
| `npm run android` / `npm run ios` | native build and run |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `eslint .` — the whole repo, not just Expo's default paths |
| `npm test` | Jest suite |
| `npm run test:coverage` | Jest with coverage |
| `npm run verify` | typecheck + lint + test — run before committing |

---

## 📱 Project Structure

```
pathly/
├── app/                     # Expo Router screens (file-based routes)
│   ├── (tabs)/              # home, add-goal, statistics, rewards, settings
│   ├── goal/[id].tsx        # goal detail & management hub
│   ├── analytics.tsx        # deeper insights
│   └── review.tsx           # weekly / monthly review
├── components/              # reusable UI
├── constants/               # theme definitions
├── src/
│   ├── constants/           # templates, icons, achievements, animation tokens
│   ├── context/             # Goals, Rewards, Theme, Language providers
│   ├── hooks/               # shared hooks (debounce, animations)
│   ├── i18n/                # translations
│   ├── types/               # TypeScript interfaces
│   └── utils/               # pure business logic (unit-tested)
└── __tests__/
    ├── integration/         # storage-level integration tests
    └── native/              # contexts, hooks and RN-dependent utils (jest-expo)
```

---

## 🛠️ Tech Stack

- **React Native 0.86** + **Expo SDK 57** (New Architecture)
- **TypeScript** in strict mode
- **Expo Router** for file-based navigation
- **React Context** + **AsyncStorage** for state and persistence
- **Reanimated 4.5** for UI-thread animations
- **Jest** + **@testing-library/react-native** — 831 tests, ~97% coverage with no files excluded

---

## 🏗️ Architecture Notes

State lives in two contexts, `GoalsContext` and `RewardsContext`, both backed by AsyncStorage.
Business logic is kept in pure functions under `src/utils/` so it can be unit-tested without
mounting components.

Writes to storage are **debounced** — mutations update state immediately and persist shortly after,
coalescing bursts like slider drags into a single write. Pending writes are flushed when the app
backgrounds.

See [CLAUDE.md](CLAUDE.md) for the performance and styling conventions this codebase follows.

---

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes and run `npm run verify`
4. Commit (`git commit -m 'feat: add amazing feature'`)
5. Push and open a Pull Request

---

## 👨‍💻 Author

**Ammar Abdo** — [@ammarabdoh](https://github.com/ammarabdoh)

---

## 📞 Support

For issues and feature requests, use the [Issues](https://github.com/ammarabdoh/pathly/issues) page.
