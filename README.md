# 🎯 Pathly

**Track your progress, step by step**

Pathly is a beautiful, feature-rich goal tracking mobile application built with React Native and Expo. Set goals, track progress, earn rewards, and achieve your dreams with an intuitive and motivating interface.

![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-blue)
![React Native](https://img.shields.io/badge/React%20Native-0.76.3-61DAFB?logo=react)
![Expo](https://img.shields.io/badge/Expo-52.0.11-000020?logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-3178C6?logo=typescript)

---

## ✨ Features

### 🎯 Goal Management
- **Ultimate Goals**: Long-term objectives that serve as your north star
- **Recurring Goals**: Daily, weekly, monthly, yearly, or custom period goals that reset automatically
- **Goal Templates**: 50+ pre-built templates across 9 categories (Health, Fitness, Learning, Work, Finance, Personal, Social, Hobby, Other)
- **Subgoals**: Break down complex goals into manageable steps
- **Custom Icons**: 500+ emojis to personalize your goals
- **Progress Tracking**: Visual progress bars and percentage completion
- **Flexible Units**: Track anything - books, km, workouts, hours, and 30+ more units

### 🏆 Gamification & Motivation
- **Points System**: Earn points for completing goals and subgoals
- **Rewards Store**: Create custom rewards and redeem them with earned points
- **Achievements**: 10 unique achievements to unlock as you progress
- **Streak Tracking**: Monitor daily, weekly, and all-time streaks
- **Motivational Quotes**: Daily inspiration to keep you going

### 📊 Statistics & Insights
- **Progress Dashboard**: Overview of all your goals and achievements
- **Completion Rate**: Track your success percentage
- **Total Points**: See your lifetime earnings
- **Active vs Completed**: Monitor your current workload
- **Streak Stats**: Current and longest streak tracking

### 🌍 Internationalization
- **Bilingual Support**: Full English and Arabic translations
- **RTL Support**: Proper right-to-left layout for Arabic
- **Localized Content**: Templates, achievements, and quotes in both languages

### 🎨 Theming
- **Dark Mode**: Easy on the eyes for night owls
- **Light Mode**: Clean and bright for daytime use
- **System Mode**: Automatically matches your device settings
- **Custom Color Schemes**: Beautiful, consistent design across all screens

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for macOS) or Android Emulator

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ammarabdoh/pathly.git
   cd pathly
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on your device**
   - Scan the QR code with Expo Go app (iOS/Android)
   - Press `i` for iOS simulator
   - Press `a` for Android emulator

---

## 📱 App Structure

```
pathly/
├── app/                      # Expo Router screens
│   ├── (tabs)/              # Tab navigation screens
│   │   ├── home.tsx         # Main dashboard
│   │   ├── add-goal.tsx     # Goal creation
│   │   ├── statistics.tsx   # Stats & achievements
│   │   ├── rewards.tsx      # Rewards store
│   │   └── settings.tsx     # App settings
│   └── goal/                # Goal detail screens
├── components/              # Reusable UI components
├── src/
│   ├── constants/          # App constants & templates
│   ├── context/            # React Context providers
│   ├── i18n/               # Translations
│   ├── types/              # TypeScript interfaces
│   └── utils/              # Helper functions
└── assets/                 # Images & static files
```

---

## 🛠️ Tech Stack

### Core
- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform and tooling
- **TypeScript** - Type-safe JavaScript

### Navigation
- **Expo Router** - File-based routing system

### State Management
- **React Context API** - Global state management
- **AsyncStorage** - Persistent local storage

### UI/UX
- **React Native Elements** - UI component library
- **Custom Theming** - Dark/Light mode support
- **RTL Support** - Right-to-left layout for Arabic

---

## 📦 Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `expo` | ^52.0.11 | Development platform |
| `react-native` | 0.76.3 | Mobile framework |
| `@react-navigation/native` | ^7.0.12 | Navigation |
| `@react-native-async-storage/async-storage` | ^2.1.0 | Persistent storage |
| `expo-router` | ^4.0.9 | File-based routing |

---

## 🎯 Usage Examples

### Creating a Goal
```typescript
// Using a template
const template = GOAL_TEMPLATES.find(t => t.id === 'read_books');
addGoal({ ...template, icon: '📚' });

// Creating from scratch
addGoal({
  title: 'Learn TypeScript',
  description: 'Master TypeScript fundamentals',
  target: 100,
  current: 0,
  unit: 'hours',
  period: 'monthly',
  points: 50,
  icon: '💻',
  isUltimate: false
});
```

### Adding a Reward
```typescript
addReward({
  title: 'Movie Night',
  description: 'Watch a movie of your choice',
  cost: 100,
  icon: '🎬',
  category: 'entertainment'
});
```

---

## 🌟 Screenshots

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 👨‍💻 Author

**Your Name**
- GitHub: [@ammarabdoh](https://github.com/ammarabdoh)

---

## 🙏 Acknowledgments

- Icons from the emoji unicode standard
- Inspired by modern productivity apps
- Built with ❤️ using React Native and Expo

---

## 📞 Support

If you like this project, please give it a ⭐ on GitHub!

For issues and feature requests, please use the [Issues](https://github.com/ammarabdoh/pathly/issues) page.
