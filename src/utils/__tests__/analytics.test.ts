/**
 * Tests for analytics insights.
 *
 * Every date is built with the local-time Date constructor, because the
 * functions under test bucket by local hour and local day. That keeps the
 * suite correct in any timezone.
 */

import { translations } from '../../i18n/translations';
import type { Goal } from '../../types';
import {
  analyzeCategoryPerformance,
  analyzeCompletionTrend,
  analyzePeriodPerformance,
  analyzeTimeOfDay,
  calculateAverageCompletionTime,
  findBestCompletionDay,
  findMostProductiveHour,
  formatHourOfDay,
  generateAnalyticsInsights,
  getInsightsSummary,
  type AnalyticsInsights,
} from '../analytics';

const DAY_MS = 24 * 60 * 60 * 1000;

let nextId = 1;
const goal = (overrides: Partial<Goal> = {}): Goal =>
  ({
    id: nextId++,
    title: 'Goal',
    target: 10,
    current: 0,
    initialValue: 0,
    unit: 'x',
    progress: 0,
    points: 10,
    direction: 'increase',
    period: 'daily',
    periodStartDate: new Date(2026, 0, 1).getTime(),
    createdAt: new Date(2026, 0, 1).getTime(),
    isComplete: false,
    ...overrides,
  }) as Goal;

/** A goal completed at a specific local date and hour. */
const doneAt = (y: number, m: number, d: number, hour = 10, overrides: Partial<Goal> = {}) =>
  goal({
    isComplete: true,
    progress: 100,
    completedAt: new Date(y, m - 1, d, hour).getTime(),
    ...overrides,
  });

beforeEach(() => {
  nextId = 1;
});

describe('analyzeCategoryPerformance', () => {
  it('omits categories with no goals and ranks the rest by completion rate', () => {
    const result = analyzeCategoryPerformance([
      goal({ category: 'health' }),
      doneAt(2026, 1, 5, 10, { category: 'health', points: 30 }),
      doneAt(2026, 1, 5, 10, { category: 'learning', points: 20 }),
    ]);

    expect(result.map((c) => c.category)).toEqual(['learning', 'health']);
    expect(result[0]).toMatchObject({
      totalGoals: 1,
      completedGoals: 1,
      completionRate: 100,
      totalPoints: 20,
    });
    expect(result[1]).toMatchObject({
      totalGoals: 2,
      completedGoals: 1,
      completionRate: 50,
      totalPoints: 30,
    });
  });

  it('averages progress across the category', () => {
    const [health] = analyzeCategoryPerformance([
      goal({ category: 'health', progress: 20 }),
      goal({ category: 'health', progress: 60 }),
    ]);
    expect(health.averageProgress).toBe(40);
  });

  it('ignores subgoals', () => {
    expect(analyzeCategoryPerformance([goal({ category: 'work', parentId: 99 })])).toEqual([]);
  });
});

describe('analyzePeriodPerformance', () => {
  it('reports completion rate and average days to complete per period', () => {
    const start = new Date(2026, 0, 1).getTime();
    const result = analyzePeriodPerformance([
      goal({ period: 'weekly' }),
      goal({
        period: 'weekly',
        isComplete: true,
        periodStartDate: start,
        completedAt: start + 4 * DAY_MS,
      }),
      goal({
        period: 'weekly',
        isComplete: true,
        periodStartDate: start,
        completedAt: start + 2 * DAY_MS,
      }),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ period: 'weekly', totalGoals: 3, completedGoals: 2 });
    expect(result[0].completionRate).toBeCloseTo(66.67, 1);
    expect(result[0].averageCompletionTime).toBe(3);
  });

  it('leaves the average undefined when nothing in the period is complete', () => {
    const [daily] = analyzePeriodPerformance([goal({ period: 'daily' })]);
    expect(daily.averageCompletionTime).toBeUndefined();
  });

  it('does not count a completion that has no timestamp', () => {
    const [daily] = analyzePeriodPerformance([goal({ isComplete: true })]);
    expect(daily.completedGoals).toBe(0);
  });
});

describe('analyzeTimeOfDay', () => {
  it('buckets completions into morning, afternoon, evening and night', () => {
    expect(
      analyzeTimeOfDay([
        doneAt(2026, 1, 1, 6),
        doneAt(2026, 1, 1, 11),
        doneAt(2026, 1, 1, 12),
        doneAt(2026, 1, 1, 18),
        doneAt(2026, 1, 1, 23),
        doneAt(2026, 1, 1, 0),
        doneAt(2026, 1, 1, 5),
        goal(), // incomplete: ignored
      ])
    ).toEqual({ morning: 2, afternoon: 1, evening: 2, night: 2 });
  });
});

describe('analyzeCompletionTrend', () => {
  it('returns one entry per day, oldest first, ending today', () => {
    const trend = analyzeCompletionTrend([], 7);
    expect(trend).toHaveLength(7);
    expect(trend.every((d) => d.count === 0 && d.points === 0)).toBe(true);
  });

  it('defaults to a 30-day window', () => {
    expect(analyzeCompletionTrend([])).toHaveLength(30);
  });

  // Regression: labels were built with toISOString(), i.e. in UTC, so east of
  // Greenwich every day was labelled with the previous date.
  it('labels days with the local calendar date', () => {
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const key = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    const trend = analyzeCompletionTrend([], 3);
    expect(trend[trend.length - 1].date).toBe(key);
  });

  it('counts completions and points into the day they happened', () => {
    const now = new Date();
    const todayAt = (hour: number) =>
      new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour).getTime();

    const trend = analyzeCompletionTrend(
      [
        goal({ isComplete: true, completedAt: todayAt(9), points: 5 }),
        goal({ isComplete: true, completedAt: todayAt(20), points: 7 }),
        goal({ isComplete: true, completedAt: todayAt(9) - DAY_MS, points: 100 }),
      ],
      2
    );

    expect(trend[1]).toMatchObject({ count: 2, points: 12 });
    expect(trend[0]).toMatchObject({ count: 1, points: 100 });
  });
});

describe('findBestCompletionDay', () => {
  it('is null with no completions', () => {
    expect(findBestCompletionDay([goal()])).toBeNull();
  });

  // Returns an index, not a name: the name used to be hardcoded English.
  it('returns the weekday index with the most completions', () => {
    // 2026-01-05 and 2026-01-12 are Mondays; 2026-01-06 is a Tuesday.
    expect(
      findBestCompletionDay([doneAt(2026, 1, 5), doneAt(2026, 1, 12), doneAt(2026, 1, 6)])
    ).toBe(1);
  });

  it('can return Sunday, whose index is 0', () => {
    // 2026-01-04 is a Sunday. A truthiness check on the result would hide it.
    expect(findBestCompletionDay([doneAt(2026, 1, 4)])).toBe(0);
  });
});

describe('findMostProductiveHour', () => {
  it('is null with no completions', () => {
    expect(findMostProductiveHour([])).toBeNull();
  });

  it('returns the hour with the most completions', () => {
    expect(
      findMostProductiveHour([doneAt(2026, 1, 1, 9), doneAt(2026, 1, 2, 15), doneAt(2026, 1, 3, 15)])
    ).toBe(15);
  });

  it('can return midnight, whose hour is 0', () => {
    expect(findMostProductiveHour([doneAt(2026, 1, 1, 0)])).toBe(0);
  });

  it('breaks ties in favour of the first hour seen', () => {
    expect(findMostProductiveHour([doneAt(2026, 1, 1, 9), doneAt(2026, 1, 2, 15)])).toBe(9);
  });
});

describe('formatHourOfDay', () => {
  const en = translations.en.analytics;
  const ar = translations.ar.analytics;

  const english: [number, string][] = [
    [0, '12:00 AM'],
    [9, '9:00 AM'],
    [12, '12:00 PM'],
    [15, '3:00 PM'],
    [23, '11:00 PM'],
  ];

  for (const [hour, label] of english) {
    it(`formats hour ${hour} as ${label} in English`, () => {
      expect(formatHourOfDay(hour, en, 'en')).toBe(label);
    });
  }

  it('uses Arabic digits and markers in Arabic', () => {
    expect(formatHourOfDay(15, ar, 'ar')).toBe('٣:٠٠ م');
    expect(formatHourOfDay(9, ar, 'ar')).toBe('٩:٠٠ ص');
  });
});

describe('calculateAverageCompletionTime', () => {
  it('is 0 with nothing complete', () => {
    expect(calculateAverageCompletionTime([goal()])).toBe(0);
  });

  it('averages days from period start to completion, ignoring subgoals', () => {
    const start = new Date(2026, 0, 1).getTime();
    expect(
      calculateAverageCompletionTime([
        goal({ isComplete: true, periodStartDate: start, completedAt: start + 2 * DAY_MS }),
        goal({ isComplete: true, periodStartDate: start, completedAt: start + 6 * DAY_MS }),
        goal({
          isComplete: true,
          periodStartDate: start,
          completedAt: start + 99 * DAY_MS,
          parentId: 1,
        }),
      ])
    ).toBe(4);
  });
});

describe('generateAnalyticsInsights', () => {
  it('summarises an empty goal list without dividing by zero', () => {
    expect(generateAnalyticsInsights([])).toMatchObject({
      totalGoalsAnalyzed: 0,
      completedGoalsAnalyzed: 0,
      overallCompletionRate: 0,
      bestPerformingCategory: null,
      worstPerformingCategory: null,
      bestCompletionDay: null,
      averageCompletionTime: 0,
      mostProductiveHour: null,
    });
  });

  it('excludes subgoals and archived goals', () => {
    const insights = generateAnalyticsInsights([
      goal(),
      goal({ parentId: 1 }),
      goal({ isArchived: true }),
    ]);
    expect(insights.totalGoalsAnalyzed).toBe(1);
  });

  it('names the best and worst categories', () => {
    const insights = generateAnalyticsInsights([
      doneAt(2026, 1, 5, 10, { category: 'fitness' }),
      goal({ category: 'finance' }),
    ]);
    expect(insights.bestPerformingCategory).toBe('fitness');
    expect(insights.worstPerformingCategory).toBe('finance');
    expect(insights.overallCompletionRate).toBe(50);
  });
});

describe('getInsightsSummary', () => {
  const en = translations.en;
  const ar = translations.ar;

  const base: AnalyticsInsights = {
    totalGoalsAnalyzed: 10,
    completedGoalsAnalyzed: 5,
    overallCompletionRate: 50,
    categoryPerformance: [],
    periodPerformance: [],
    completionsByTimeOfDay: { morning: 0, afternoon: 0, evening: 0, night: 0 },
    completionTrend: [],
    bestPerformingCategory: null,
    worstPerformingCategory: null,
    bestCompletionDay: null,
    averageCompletionTime: 0,
    mostProductiveHour: null,
  };

  const summarise = (
    overrides: Partial<AnalyticsInsights> = {},
    t = en,
    language: 'en' | 'ar' = 'en'
  ) => getInsightsSummary({ ...base, ...overrides }, t, language);

  it('asks for completions before offering insights', () => {
    expect(summarise({ completedGoalsAnalyzed: 0 })).toEqual([en.analytics.startCompletingGoals]);
  });

  const grades: [number, string][] = [
    [85, '🏆 Excellent! 85%'],
    [50, '💪 Good progress! 50%'],
    [20, '🎯 20%'],
  ];

  for (const [rate, prefix] of grades) {
    it(`grades a ${rate} percent completion rate`, () => {
      expect(summarise({ overallCompletionRate: rate })[0].startsWith(prefix)).toBe(true);
    });
  }

  it('names the best category by its translated label, only when it has completions', () => {
    const withRate = (rate: number, t = en, language: 'en' | 'ar' = 'en') =>
      summarise(
        {
          bestPerformingCategory: 'fitness',
          categoryPerformance: [
            {
              category: 'fitness',
              totalGoals: 1,
              completedGoals: 1,
              completionRate: rate,
              totalPoints: 0,
              averageProgress: 0,
            },
          ],
        },
        t,
        language
      );

    const label = (en.templates.categories as Record<string, string>).fitness;
    expect(withRate(100).some((line) => line.includes(`${label} (100%)`))).toBe(true);
    expect(withRate(0).some((line) => line.includes(label))).toBe(false);

    const arLabel = (ar.templates.categories as Record<string, string>).fitness;
    expect(withRate(100, ar, 'ar').some((line) => line.includes(arLabel))).toBe(true);
  });

  const peaks: [
    AnalyticsInsights['completionsByTimeOfDay'],
    'morning' | 'afternoon' | 'evening' | 'night',
  ][] = [
    [{ morning: 3, afternoon: 1, evening: 1, night: 1 }, 'morning'],
    [{ morning: 1, afternoon: 3, evening: 1, night: 1 }, 'afternoon'],
    [{ morning: 1, afternoon: 1, evening: 3, night: 1 }, 'evening'],
    [{ morning: 1, afternoon: 1, evening: 1, night: 3 }, 'night'],
  ];

  for (const [completionsByTimeOfDay, key] of peaks) {
    it(`names the peak time of day: ${key}`, () => {
      expect(summarise({ completionsByTimeOfDay })).toContain(en.analytics.insightMessages[key]);
    });
  }

  it('names the best day and pluralises the average completion time', () => {
    const summary = summarise({ bestCompletionDay: 1, averageCompletionTime: 1.2 });
    expect(summary.some((line) => line.includes('Monday is your most productive day'))).toBe(true);
    expect(summary.some((line) => line.endsWith('Average completion time: 1 day'))).toBe(true);

    const plural = summarise({ averageCompletionTime: 3 });
    expect(plural.some((line) => line.endsWith('Average completion time: 3 days'))).toBe(true);
  });

  it('names Sunday, whose index is 0', () => {
    const summary = summarise({ bestCompletionDay: 0 });
    expect(summary.some((line) => line.includes('Sunday is your most productive day'))).toBe(true);
  });

  // Regression: this was hardcoded English, so Arabic users saw English.
  it('produces an Arabic summary with no English in it', () => {
    const summary = summarise(
      {
        overallCompletionRate: 85,
        completionsByTimeOfDay: { morning: 3, afternoon: 0, evening: 0, night: 0 },
        bestCompletionDay: 1,
        averageCompletionTime: 3,
      },
      ar,
      'ar'
    );

    expect(summary).toHaveLength(4);
    expect(summary.join(' ')).not.toMatch(/[A-Za-z]/);
    expect(summary[0]).toContain('٨٥'); // 85 in Arabic-Indic digits
    expect(summary.some((line) => line.includes(ar.schedule.weekdayLong[1]))).toBe(true);
  });
});
