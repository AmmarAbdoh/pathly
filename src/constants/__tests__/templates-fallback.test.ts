/**
 * What an untranslated template shows.
 *
 * Every shipped template is translated (templates.test.ts enforces that), so
 * the fallback is exercised here with the translation table emptied out.
 */

// jest.mock calls are hoisted above imports, so the mocks below apply to them.
import { GOAL_TEMPLATES, getGoalTemplates } from '../goal-templates';
import { REWARD_TEMPLATES, getRewardTemplates } from '../reward-templates';

jest.mock('../../i18n/template-translations', () => ({
  getGoalTemplateTranslation: () => ({ title: '', description: '' }),
  getRewardTemplateTranslation: () => ({ title: '', description: '' }),
}));

// Regression: the lookup used to return the raw id as the title, which
// defeated this fallback - the `concert` reward displayed as "concert".
it('shows the English title and description of an untranslated goal template', () => {
  const [shown] = getGoalTemplates('ar');
  expect(shown.title).toBe(GOAL_TEMPLATES[0].title);
  expect(shown.description).toBe(GOAL_TEMPLATES[0].description);
});

it('shows the English title and description of an untranslated reward template', () => {
  const [shown] = getRewardTemplates('ar');
  expect(shown.title).toBe(REWARD_TEMPLATES[0].title);
  expect(shown.description).toBe(REWARD_TEMPLATES[0].description);
});
