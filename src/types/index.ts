/**
 * Core type definitions for the Pathly application
 */

export type GoalDirection = 'increase' | 'decrease';

export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export type GoalCategory = 'health' | 'fitness' | 'learning' | 'work' | 'finance' | 'personal' | 'social' | 'hobby' | 'other';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: number;
  requirement: {
    type: 'goals_completed' | 'points_earned' | 'streak_days' | 'ultimate_goals' | 'perfect_week';
    value: number;
  };
}

export interface Statistics {
  totalGoals: number;
  completedGoals: number;
  totalPoints: number;
  spentPoints: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: number;
  completionRate: number;
  achievementsUnlocked: string[];
}

export interface GoalTemplate {
  id: string;
  title: string;
  category: GoalCategory;
  description: string;
  target: number;
  unit: string;
  direction: GoalDirection;
  points: number;
  period: TimePeriod;
  icon: string;
}

export interface Reward {
  id: number;
  title: string;
  description: string;
  pointsCost: number;
  icon: string;
  createdAt: number;
  isRedeemed: boolean;
  redeemedAt?: number;
}

export interface Goal {
  id: number;
  title: string;
  description?: string; // Optional description for the goal
  target: number;
  current: number;
  initialValue: number;
  unit: string;
  progress: number;
  createdAt: number;
  direction: GoalDirection;
  points: number;
  icon?: string; // Icon emoji for the goal
  parentId?: number; // ID of parent goal if this is a subgoal
  subGoals?: number[]; // Array of subgoal IDs
  period: TimePeriod; // Time period for the goal
  customPeriodDays?: number; // Number of days for custom period
  periodStartDate?: number; // Start date for period tracking
  isUltimate?: boolean; // If true, this is an ultimate goal with special design
  isComplete?: boolean; // If true, goal is marked as complete
  category?: GoalCategory; // Goal category for organization
  completedAt?: number; // Timestamp when goal was completed
  isRecurring?: boolean; // If true, goal resets after period ends
  completionHistory?: number[]; // Array of completion timestamps for recurring goals
}

export interface GoalFormData {
  title: string;
  description?: string;
  target: number;
  current: number;
  unit: string;
  direction: GoalDirection;
  points: number;
  icon?: string;
  period: TimePeriod;
  customPeriodDays?: number;
  parentId?: number;
  isUltimate?: boolean;
  category?: GoalCategory;
  isRecurring?: boolean;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export type Language = 'en' | 'ar';

export interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  danger: string;
  border: string;
  tabIconDefault: string;
  tabIconSelected: string;
}

export interface ThemeShadows {
  small: {
    shadowColor: string;
    shadowOpacity: number;
    shadowOffset: { width: number; height: number };
    shadowRadius: number;
    elevation: number;
  };
}

export interface ThemeFonts {
  sans: string;
  serif: string;
  rounded: string;
  mono: string;
}

export interface Theme {
  colors: ThemeColors;
  shadows: ThemeShadows;
  fonts: ThemeFonts;
}
