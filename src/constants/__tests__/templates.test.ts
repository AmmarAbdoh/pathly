/**
 * Tests for the goal and reward template catalogues and their translations.
 */

import {
  getGoalTemplateTranslation,
  getRewardTemplateTranslation,
  goalTemplateTranslations,
  rewardTemplateTranslations,
} from '../../i18n/template-translations';
import {
  GOAL_TEMPLATES,
  getGoalTemplates,
  getTemplateById,
  getTemplatesByCategory,
} from '../goal-templates';
import {
  REWARD_TEMPLATES,
  getRewardTemplateById,
  getRewardTemplates,
  getRewardTemplatesByCategory,
} from '../reward-templates';

const catalogues = [
  { name: 'goal', templates: GOAL_TEMPLATES, translations: goalTemplateTranslations },
  { name: 'reward', templates: REWARD_TEMPLATES, translations: rewardTemplateTranslations },
] as const;

describe.each(catalogues)('$name templates', ({ templates, translations }) => {
  it('has unique ids', () => {
    const ids = templates.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // Regression: the `concert` reward had no entry (its translation lived under
  // a stale `concert_ticket` key), so it displayed as the raw id in both
  // languages.
  it('has an English and an Arabic title for every template', () => {
    const missing = templates
      .filter((t) => !translations[t.id]?.en?.title || !translations[t.id]?.ar?.title)
      .map((t) => t.id);
    expect(missing).toEqual([]);
  });

  // 47 entries had accumulated for templates that no longer exist - one of
  // them (`concert_ticket`) was the live `concert` template's translation
  // under a stale key.
  it('has no translation entries for templates that do not exist', () => {
    const ids = new Set(templates.map((t) => t.id));
    expect(Object.keys(translations).filter((key) => !ids.has(key))).toEqual([]);
  });

  it('gives every template a title, icon and category', () => {
    for (const template of templates) {
      expect(template.title).toBeTruthy();
      expect(template.icon).toBeTruthy();
      expect(template.category).toBeTruthy();
    }
  });
});

describe('goal templates', () => {
  it('filters by category', () => {
    const fitness = getTemplatesByCategory('fitness');
    expect(fitness.length).toBeGreaterThan(0);
    expect(fitness.every((t) => t.category === 'fitness')).toBe(true);
  });

  it('returns nothing for an unknown category', () => {
    expect(getTemplatesByCategory('no-such-category')).toEqual([]);
  });

  it('translates titles and descriptions into Arabic', () => {
    const [en] = getGoalTemplates('en');
    const ar = getGoalTemplates('ar').find((t) => t.id === en.id)!;

    expect(ar.title).toBe(goalTemplateTranslations[en.id].ar.title);
    expect(ar.title).not.toBe(en.title);
    expect(ar.target).toBe(en.target); // only the text is translated
  });

  it('defaults to English', () => {
    expect(getGoalTemplates()[0].title).toBe(getGoalTemplates('en')[0].title);
  });

  it('looks a template up by id, in either language', () => {
    const id = GOAL_TEMPLATES[0].id;
    expect(getTemplateById(id)?.id).toBe(id);
    expect(getTemplateById(id, 'ar')?.title).toBe(goalTemplateTranslations[id].ar.title);
    expect(getTemplateById('no-such-id')).toBeUndefined();
  });
});

describe('reward templates', () => {
  it('filters by category', () => {
    const [first] = REWARD_TEMPLATES;
    const same = getRewardTemplatesByCategory(first.category);
    expect(same.every((t) => t.category === first.category)).toBe(true);
    expect(getRewardTemplatesByCategory('no-such-category')).toEqual([]);
  });

  it('translates into Arabic and defaults to English', () => {
    const [en] = getRewardTemplates('en');
    const ar = getRewardTemplates('ar').find((t) => t.id === en.id)!;
    expect(ar.title).toBe(rewardTemplateTranslations[en.id].ar.title);
    expect(getRewardTemplates()[0].title).toBe(en.title);
  });

  it('looks a template up by id', () => {
    const id = REWARD_TEMPLATES[0].id;
    expect(getRewardTemplateById(id)?.id).toBe(id);
    expect(getRewardTemplateById(id, 'ar')?.title).toBe(rewardTemplateTranslations[id].ar.title);
    expect(getRewardTemplateById('no-such-id')).toBeUndefined();
  });
});

describe('missing translations', () => {
  // Regression: the lookup returned `{ title: templateId }`, and a truthy id
  // defeated the getters' `translation.title || template.title` fallback.
  it('fall back to empty text rather than the raw id', () => {
    expect(getGoalTemplateTranslation('no-such-id', 'ar')).toEqual({ title: '', description: '' });
    expect(getRewardTemplateTranslation('no-such-id', 'en')).toEqual({ title: '', description: '' });
  });
});
