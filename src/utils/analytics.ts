/**
 * Analytics utilities for goal insights
 * Analyzes goal completion patterns, trends, and performance
 */

import type { Goal, GoalCategory, TimePeriod } from '../types';

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
  bestCompletionDay: string; // Day name
  averageCompletionTime: number; // in days
  mostProductiveHour: string; // Hour of day
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
 * Get day name from date
 */
function getDayName(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
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
      date: date.toISOString().split('T')[0],
      count: completedThisDay.length,
      points,
    });
  }
  
  return trend;
}

/**
 * Find best completion day of week
 */
export function findBestCompletionDay(goals: Goal[]): string {
  const completedGoals = goals.filter(g => g.isComplete && g.completedAt);
  
  const dayCount: { [key: string]: number } = {};
  
  completedGoals.forEach(goal => {
    if (goal.completedAt) {
      const date = new Date(goal.completedAt);
      const dayName = getDayName(date);
      dayCount[dayName] = (dayCount[dayName] || 0) + 1;
    }
  });
  
  let bestDay = 'No data';
  let maxCount = 0;
  
  Object.entries(dayCount).forEach(([day, count]) => {
    if (count > maxCount) {
      maxCount = count;
      bestDay = day;
    }
  });
  
  return bestDay;
}

/**
 * Find most productive hour
 */
export function findMostProductiveHour(goals: Goal[]): string {
  const completedGoals = goals.filter(g => g.isComplete && g.completedAt);
  
  const hourCount: { [key: number]: number } = {};
  
  completedGoals.forEach(goal => {
    if (goal.completedAt) {
      const date = new Date(goal.completedAt);
      const hour = date.getHours();
      hourCount[hour] = (hourCount[hour] || 0) + 1;
    }
  });
  
  let mostProductiveHour = 'No data';
  let maxCount = 0;
  
  Object.entries(hourCount).forEach(([hour, count]) => {
    if (count > maxCount) {
      maxCount = count;
      const hourNum = parseInt(hour);
      const period = hourNum >= 12 ? 'PM' : 'AM';
      const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
      mostProductiveHour = `${displayHour}:00 ${period}`;
    }
  });
  
  return mostProductiveHour;
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
 * Get formatted insights summary
 */
export function getInsightsSummary(insights: AnalyticsInsights): string[] {
  const summary: string[] = [];
  
  if (insights.completedGoalsAnalyzed === 0) {
    summary.push("Start completing goals to see insights!");
    return summary;
  }
  
  // Completion rate insight
  if (insights.overallCompletionRate >= 80) {
    summary.push(`🏆 Excellent! ${insights.overallCompletionRate.toFixed(0)}% completion rate!`);
  } else if (insights.overallCompletionRate >= 50) {
    summary.push(`💪 Good progress! ${insights.overallCompletionRate.toFixed(0)}% completion rate.`);
  } else {
    summary.push(`🎯 ${insights.overallCompletionRate.toFixed(0)}% completion rate. Keep pushing!`);
  }
  
  // Best category insight
  if (insights.bestPerformingCategory) {
    const bestCategory = insights.categoryPerformance.find(
      c => c.category === insights.bestPerformingCategory
    );
    if (bestCategory && bestCategory.completionRate > 0) {
      summary.push(`⭐ Best category: ${insights.bestPerformingCategory} (${bestCategory.completionRate.toFixed(0)}%)`);
    }
  }
  
  // Time of day insight
  const timeOfDay = insights.completionsByTimeOfDay;
  const maxTime = Math.max(timeOfDay.morning, timeOfDay.afternoon, timeOfDay.evening, timeOfDay.night);
  if (maxTime > 0) {
    if (timeOfDay.morning === maxTime) {
      summary.push("🌅 You're most productive in the morning!");
    } else if (timeOfDay.afternoon === maxTime) {
      summary.push("☀️ Afternoons are your peak productivity time!");
    } else if (timeOfDay.evening === maxTime) {
      summary.push("🌆 You work best in the evening!");
    } else {
      summary.push("🌙 Night owl! You complete most goals at night.");
    }
  }
  
  // Best day insight
  if (insights.bestCompletionDay !== 'No data') {
    summary.push(`📅 ${insights.bestCompletionDay} is your most productive day!`);
  }
  
  // Average completion time
  if (insights.averageCompletionTime > 0) {
    const days = Math.round(insights.averageCompletionTime);
    summary.push(`⏱️ Average completion time: ${days} day${days !== 1 ? 's' : ''}`);
  }
  
  return summary;
}
