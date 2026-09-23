/**
 * Analytics utilities for goal insights
 * Analyzes goal completion patterns, trends, and performance
 */

import type { Language, Translations } from '../i18n/translations';
import type { Goal, GoalCategory, TimePeriod } from '../types';
import { formatNumber } from './number-formatting';

export interface CategoryAnalytics {
  category: GoalCategory;
  totalGoals: number;
  completedGoals: number;
  completionRate: number;
  totalPoints: number;
  averageProgress: number;
}

export interface PeriodAnalytics {
  period: TimePeriod;
  totalGoals: number;
  completedGoals: number;
  completionRate: number;
  averageCompletionTime?: number; // in days
}

export interface TimeOfDayAnalytics {
  morning: number; // 6am-12pm
  afternoon: number; // 12pm-6pm
  evening: number; // 6pm-12am
  night: number; // 12am-6am
}

export interface CompletionTrend {
  date: string; // YYYY-MM-DD
  count: number;
  points: number;
}

export interface AnalyticsInsights {
  totalGoalsAnalyzed: number;
  completedGoalsAnalyzed: number;
  overallCompletionRate: number;
  categoryPerformance: CategoryAnalytics[];
  periodPerformance: PeriodAnalytics[];
  completionsByTimeOfDay: TimeOfDayAnalytics;
  completionTrend: CompletionTrend[]; // Last 30 days
  bestPerformingCategory: GoalCategory | null;
  worstPerformingCategory: GoalCategory | null;
  /** Weekday with the most completions, 0 = Sunday; null with no completions. */
  bestCompletionDay: number | null;
  averageCompletionTime: number; // in days
  /** Hour of day (0-23) with the most completions; null with no completions. */
  mostProductiveHour: number | null;
}

/**
 * Get hour category for time of day analysis
 */
function getHourCategory(hour: number): keyof TimeOfDayAnalytics {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 24) return 'evening';
  return 'night';
}

/**
 * Analyze goals by category
 */
export function analyzeCategoryPerformance(goals: Goal[]): CategoryAnalytics[] {
  const categories: GoalCategory[] = ['health', 'fitness', 'learning', 'work', 'finance', 'personal', 'social', 'hobby', 'other'];
  
  const analytics: CategoryAnalytics[] = categories.map(category => {
    const categoryGoals = goals.filter(g => g.category === category && !g.parentId);
    const completed = categoryGoals.filter(g => g.isComplete);
    const totalProgress = categoryGoals.reduce((sum, g) => sum + g.progress, 0);
    const totalPoints = completed.reduce((sum, g) => sum + g.points, 0);
    
    return {
      category,
      totalGoals: categoryGoals.length,
      completedGoals: completed.length,
      completionRate: categoryGoals.length > 0 ? (completed.length / categoryGoals.length) * 100 : 0,
      totalPoints,
      averageProgress: categoryGoals.length > 0 ? totalProgress / categoryGoals.length : 0,
    };
  });

  return analytics.filter(a => a.totalGoals > 0).sort((a, b) => b.completionRate - a.completionRate);
}

/**
 * Analyze goals by time period
 */
export function analyzePeriodPerformance(goals: Goal[]): PeriodAnalytics[] {
  const periods: TimePeriod[] = ['daily', 'weekly', 'monthly', 'yearly', 'custom', 'ongoing'];
  
  const analytics: PeriodAnalytics[] = periods.map(period => {
    const periodGoals = goals.filter(g => g.period === period && !g.parentId);
    const completed = periodGoals.filter(g => g.isComplete && g.completedAt && g.periodStartDate);
    
    // Calculate average completion time for completed goals with dates
    let averageCompletionTime: number | undefined;
    if (completed.length > 0) {
      const totalTime = completed.reduce((sum, g) => {
        if (g.completedAt && g.periodStartDate) {
          const days = (g.completedAt - g.periodStartDate) / (1000 * 60 * 60 * 24);
          return sum + days;
        }
        return sum;
      }, 0);
      averageCompletionTime = totalTime / completed.length;
    }
    
    return {
      period,
      totalGoals: periodGoals.length,
      completedGoals: completed.length,
      completionRate: periodGoals.length > 0 ? (completed.length / periodGoals.length) * 100 : 0,
      averageCompletionTime,
    };
  });

  return analytics.filter(a => a.totalGoals > 0).sort((a, b) => b.completionRate - a.completionRate);
}

/**
 * Analyze completion times by hour of day
 */
export function analyzeTimeOfDay(goals: Goal[]): TimeOfDayAnalytics {
  const completedGoals = goals.filter(g => g.isComplete && g.completedAt);
  
  const timeAnalytics: TimeOfDayAnalytics = {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
  };

  completedGoals.forEach(goal => {
    if (goal.completedAt) {
      const date = new Date(goal.completedAt);
      const hour = date.getHours();
      const category = getHourCategory(hour);
      timeAnalytics[category]++;
    }
  });

  return timeAnalytics;
}

/**
 * `YYYY-MM-DD` for the date's *local* calendar day.
 *
 * `toISOString()` formats in UTC, so east of Greenwich local midnight is still
 * the previous day in UTC and every label came out a day early (at UTC+3,
 * Sep 23 was labelled 2026-09-22) - even though the buckets themselves were
 * correctly local.
 */
function toLocalDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Analyze completion trend over last 30 days
 */
export function analyzeCompletionTrend(goals: Goal[], days: number = 30): CompletionTrend[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const trend: CompletionTrend[] = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStart = date.getTime();
    const dateEnd = dateStart + 24 * 60 * 60 * 1000;
    
    const completedThisDay = goals.filter(g => 
      g.isComplete && 
      g.completedAt && 
      g.completedAt >= dateStart && 
      g.completedAt < dateEnd
    );
    
    const points = completedThisDay.reduce((sum, g) => sum + g.points, 0);
    
    trend.push({
      date: toLocalDateKey(date),
      count: completedThisDay.length,
      points,
    });
  }
  
  return trend;
}

/**
 * The weekday (0 = Sunday) with the most completions, or null if none.
 *
 * Returns an index rather than a name: the name used to be hardcoded English,
 * which the analytics screen then showed to Arabic users. The screen localises
 * it with `t.schedule.weekdayLong`.
 */
export function findBestCompletionDay(goals: Goal[]): number | null {
  return mostFrequent(goals, (date) => date.getDay());
}

/**
 * The hour of day (0-23) with the most completions, or null if none.
 *
 * Returns the hour rather than "3:00 PM" so the screen can format it for the
 * user's language with `formatHourOfDay`.
 */
export function findMostProductiveHour(goals: Goal[]): number | null {
  return mostFrequent(goals, (date) => date.getHours());
}

/**
 * The most common value of `key` across completed goals' completion times.
 * Ties go to the value seen first.
 */
function mostFrequent(goals: Goal[], key: (date: Date) => number): number | null {
  const counts = new Map<number, number>();
  for (const goal of goals) {
    if (goal.isComplete && goal.completedAt) {
      const value = key(new Date(goal.completedAt));
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }

  let best: number | null = null;
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}

/**
 * An hour of day as "3:00 PM" / "٣:٠٠ م".
 *
 * Built by hand rather than with toLocaleTimeString: ICU output differs between
 * Hermes, Node and ICU versions (newer ICU puts a narrow no-break space before
 * the AM/PM marker), which makes it neither predictable nor testable.
 */
export function formatHourOfDay(
  hour: number,
  t: Pick<Translations['analytics'], 'am' | 'pm'>,
  language: Language
): string {
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const marker = hour >= 12 ? t.pm : t.am;
  return `${formatNumber(displayHour, language)}:${formatNumber('00', language)} ${marker}`;
}

/**
 * Calculate average completion time across all completed goals
 */
export function calculateAverageCompletionTime(goals: Goal[]): number {
  const completedGoals = goals.filter(g => 
    g.isComplete && 
    g.completedAt && 
    g.periodStartDate &&
    !g.parentId
  );
  
  if (completedGoals.length === 0) return 0;
  
  const totalTime = completedGoals.reduce((sum, g) => {
    if (g.completedAt && g.periodStartDate) {
      const days = (g.completedAt - g.periodStartDate) / (1000 * 60 * 60 * 24);
      return sum + days;
    }
    return sum;
  }, 0);
  
  return totalTime / completedGoals.length;
}

/**
 * Generate comprehensive analytics insights
 */
export function generateAnalyticsInsights(goals: Goal[]): AnalyticsInsights {
  // Filter out subgoals and archived goals for main analytics
  const mainGoals = goals.filter(g => !g.parentId && !g.isArchived);
  const completedGoals = mainGoals.filter(g => g.isComplete);
  
  const categoryPerformance = analyzeCategoryPerformance(mainGoals);
  const periodPerformance = analyzePeriodPerformance(mainGoals);
  const completionsByTimeOfDay = analyzeTimeOfDay(mainGoals);
  const completionTrend = analyzeCompletionTrend(mainGoals);
  
  const bestPerformingCategory = categoryPerformance.length > 0 
    ? categoryPerformance[0].category 
    : null;
    
  const worstPerformingCategory = categoryPerformance.length > 0 
    ? categoryPerformance[categoryPerformance.length - 1].category 
    : null;
  
  const bestCompletionDay = findBestCompletionDay(mainGoals);
  const averageCompletionTime = calculateAverageCompletionTime(mainGoals);
  const mostProductiveHour = findMostProductiveHour(mainGoals);
  
  return {
    totalGoalsAnalyzed: mainGoals.length,
    completedGoalsAnalyzed: completedGoals.length,
    overallCompletionRate: mainGoals.length > 0 
      ? (completedGoals.length / mainGoals.length) * 100 
      : 0,
    categoryPerformance,
    periodPerformance,
    completionsByTimeOfDay,
    completionTrend,
    bestPerformingCategory,
    worstPerformingCategory,
    bestCompletionDay,
    averageCompletionTime,
    mostProductiveHour,
  };
}

/**
 * The analytics screen's summary sentences, in the user's language.
 *
 * Takes the translations rather than importing them, like every src/utils
 * function that produces display text. This used to return hardcoded English.
 */
export function getInsightsSummary(
  insights: AnalyticsInsights,
  t: Pick<Translations, 'analytics' | 'templates' | 'schedule'>,
  language: Language
): string[] {
  const messages = t.analytics.insightMessages;
  const percent = (value: number) => formatNumber(Math.round(value), language);

  if (insights.completedGoalsAnalyzed === 0) {
    return [t.analytics.startCompletingGoals];
  }

  const summary: string[] = [];

  const rate = percent(insights.overallCompletionRate);
  if (insights.overallCompletionRate >= 80) {
    summary.push(messages.excellent.replace('{rate}', rate));
  } else if (insights.overallCompletionRate >= 50) {
    summary.push(messages.good.replace('{rate}', rate));
  } else {
    summary.push(messages.keepPushing.replace('{rate}', rate));
  }

  if (insights.bestPerformingCategory) {
    const best = insights.categoryPerformance.find(
      (c) => c.category === insights.bestPerformingCategory
    );
    if (best && best.completionRate > 0) {
      const categories = t.templates.categories as Record<string, string>;
      summary.push(
        messages.bestCategory
          .replace('{category}', categories[best.category] ?? best.category)
          .replace('{rate}', percent(best.completionRate))
      );
    }
  }

  const time = insights.completionsByTimeOfDay;
  const peak = Math.max(time.morning, time.afternoon, time.evening, time.night);
  if (peak > 0) {
    if (time.morning === peak) summary.push(messages.morning);
    else if (time.afternoon === peak) summary.push(messages.afternoon);
    else if (time.evening === peak) summary.push(messages.evening);
    else summary.push(messages.night);
  }

  if (insights.bestCompletionDay !== null) {
    summary.push(messages.bestDay.replace('{day}', t.schedule.weekdayLong[insights.bestCompletionDay]));
  }

  if (insights.averageCompletionTime > 0) {
    const days = Math.round(insights.averageCompletionTime);
    summary.push(
      messages.averageTime
        .replace('{days}', formatNumber(days, language))
        .replace('{unit}', days === 1 ? t.analytics.day : t.analytics.days)
    );
  }

  return summary;
}
