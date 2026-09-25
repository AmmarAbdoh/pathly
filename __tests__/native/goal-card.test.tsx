/**
 * GoalCard: what screen readers hear, and where taps land.
 */

import GoalCard from '@/components/GoalCard';
import { STORAGE_KEYS } from '@/src/constants/storage-keys';
import { LanguageProvider, useLanguage } from '@/src/context/LanguageContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { translations } from '@/src/i18n/translations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

const en = translations.en;
const ar = translations.ar;

type CardProps = React.ComponentProps<typeof GoalCard>;

/** Resolves once the language stored for the test has been loaded. */
async function renderCard(props: Partial<CardProps> = {}, language: 'en' | 'ar' = 'en') {
  await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
  let current = '';
  function Probe() {
    current = useLanguage().language;
    return null;
  }

  render(
    <LanguageProvider>
      <ThemeProvider>
        <Probe />
        <GoalCard id={1} title="Read" progress={40} points={50} onPress={jest.fn()} {...props} />
      </ThemeProvider>
    </LanguageProvider>
  );
  await waitFor(() => expect(current).toBe(language));
}

/** The whole-card tap target: the only element with the "open" hint. */
const cardButton = (hint = en.goalCard.openHint) =>
  screen.getByHintText(hint, { includeHiddenElements: true });

type Element = ReturnType<typeof screen.getByText>;

/** The pointerEvents a host element's own style gives it. */
function pointerEventsOf(element: Element) {
  return StyleSheet.flatten(element.props.style)?.pointerEvents;
}

/** The nearest host View above `element`. */
function viewAbove(element: Element): Element {
  let node = element.parent;
  // Host elements' type is the component name; composite ones' is a function.
  while (node && (node.type as string) !== 'View') node = node.parent;
  return node!;
}

/** The View that draws a piece of text. */
const containerOf = (text: string) =>
  viewAbove(screen.getByText(text, { includeHiddenElements: true }));

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('accessibility label', () => {
  it('summarises the card in English', async () => {
    await renderCard({
      isRecurring: true,
      currentStreak: 3,
      timeRemaining: '2 days left',
      subgoalCount: 4,
      completedSubgoalCount: 1,
    });

    expect(cardButton().props.accessibilityLabel).toBe(
      'Read, 40% complete, 50 points, 1 of 4 subgoals complete, 2 days left, 3 week streak'
    );
  });

  // Regression: every streak said "week", so a daily goal showed "3 week
  // streak" (and "سلسلة أسبوعية" in Arabic) after three days.
  it.each([
    ['daily', 'en', `3 ${en.goalCard.periodStreak.daily}`],
    ['monthly', 'en', `3 ${en.goalCard.periodStreak.monthly}`],
    ['daily', 'ar', `٣ ${ar.goalCard.periodStreak.daily}`],
  ] as const)('counts a %s streak in its own periods (%s)', async (period, language, text) => {
    await renderCard({ isRecurring: true, currentStreak: 3, period }, language);

    expect(screen.getByText(text, { includeHiddenElements: true })).toBeTruthy();
  });

  // Regression: the badges are hidden from screen readers, and the label left
  // them out - nobody using one could tell a goal was blocked, paused,
  // expired or done.
  it.each([
    [{ isComplete: true }, en.goalCard.completed],
    [{ isPaused: true }, en.goalCard.paused],
    [{ isBlocked: true }, en.goalCard.blocked],
    [{ isExpired: true }, en.time.expired],
    [{ isUltimate: true }, en.goalCard.a11yUltimate],
  ] as [Partial<CardProps>, string][])('includes the status %o', async (status, word) => {
    await renderCard(status);

    expect(cardButton().props.accessibilityLabel).toContain(word);
  });

  it('shows only "completed" once a goal is done, as the badges do', async () => {
    await renderCard({ isComplete: true, isPaused: true, isBlocked: true, isExpired: true });
    const label: string = cardButton().props.accessibilityLabel;

    expect(label).toContain(en.goalCard.completed);
    expect(label).not.toContain(en.goalCard.paused);
    expect(label).not.toContain(en.goalCard.blocked);
    expect(label).not.toContain(en.time.expired);
  });

  // Regression: the label was a hardcoded English sentence with Western digits.
  it('is in Arabic, with Arabic digits, when the app is', async () => {
    await renderCard({ title: 'قراءة', isComplete: true }, 'ar');
    const label: string = cardButton(ar.goalCard.openHint).props.accessibilityLabel;

    expect(label).toContain(ar.goalCard.completed);
    expect(label).toContain('٤٠');
    expect(label).not.toMatch(/[A-Za-z0-9]/);
  });
});

describe('taps', () => {
  // Regression: after the tap target became a sibling beneath the content,
  // the badges still took touches themselves - and a touch on a plain View
  // only bubbles to its ancestors, never to a sibling. Tapping a badge did
  // nothing.
  it.each([
    [{ isComplete: true }, `✓ ${en.goalCard.completed}`],
    [{ isUltimate: true }, en.goalCard.ultimate],
    [{ isPaused: true }, `⏸️ ${en.goalCard.paused}`],
    [{ isBlocked: true }, `🔒 ${en.goalCard.blocked}`],
    [{ isExpired: true }, `⚠️ ${en.time.expired}`],
  ] as [Partial<CardProps>, string][])('lets a tap on the %o badge through to the card', async (status, text) => {
    await renderCard(status);

    expect(pointerEventsOf(containerOf(text))).toBe('none');
  });

  it('lets a tap on a disabled arrow through to the card, but not an enabled one', async () => {
    await renderCard({ onMoveUp: jest.fn(), onMoveDown: jest.fn(), canMoveUp: false, canMoveDown: true });

    expect(pointerEventsOf(screen.getByLabelText(en.goalCard.moveUp))).toBe('none');
    expect(pointerEventsOf(screen.getByLabelText(en.goalCard.moveDown))).toBeUndefined();
    // The column around them passes the gaps through, keeping its children tappable.
    expect(pointerEventsOf(viewAbove(containerOf('▲')))).toBe('box-none');
  });
});
