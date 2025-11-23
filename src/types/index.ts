/**
 * Core type definitions for the Pathly application
 */

export type GoalDirection = 'increase' | 'decrease';

export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | 'ongoing';

export type GoalCategory = 'health' | 'fitness' | 'learning' | 'work' | 'finance' | 'personal' | 'social' | 'hobby' | 'other';

export interface GoalSchedule {
  // For weekly recurring goals: specific days of the week (0 = Sunday, 1 = Monday, etc.)
  daysOfWeek?: number[];
  // For monthly recurring goals: specific dates (1-31)
  datesOfMonth?: number[];
  // For date range in month: e.g., "20-25" means days 20 through 25
  dateRangeStart?: number;
  dateRangeEnd?: number;
}

export interface GoalNote {
  id: string;
  text: string;
  createdAt: number;
}

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
  lifetimePointsEarned: number; // Total points earned across all time (never decreases, even on goal deletion)
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
  linkedToGoalId?: number; // ID of goal this reward is linked to (auto-redeems on completion)
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
  currentStreak?: number; // Current consecutive completions streak for recurring goals
  longestStreak?: number; // Longest streak ever achieved for this goal
  isPaused?: boolean; // If true, goal is paused and won't count towards statistics
  pausedAt?: number; // Timestamp when goal was paused
  sortOrder?: number; // Custom sort order for manual reordering (lower numbers appear first)
  linkedRewardId?: number; // ID of reward that auto-redeems when goal completes
  subgoalsAwardPoints?: boolean; // If false (default for ultimate goals), subgoals get 0 points and don't award individually
  isArchived?: boolean; // If true, goal is archived and hidden from main list
  archivedAt?: number; // Timestamp when goal was archived
  notes?: GoalNote[]; // Array of notes/journal entries for this goal
  dependsOn?: number[]; // Array of goal IDs that must be completed before this goal can be started
  isBlocked?: boolean; // Computed: true if dependsOn goals are not all complete
  notificationsEnabled?: boolean; // If true, notifications are enabled for this goal
  notificationTime?: number; // Time in minutes from midnight (e.g., 540 = 9:00 AM)
  notificationDays?: number[]; // Days of week for notifications (0 = Sunday, 6 = Saturday)
  notificationIds?: string[]; // Array of scheduled notification IDs for cleanup
  schedule?: GoalSchedule; // Schedule configuration for when goal should be active
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
