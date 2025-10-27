/**
 * Shared icon constants for goals and rewards
 * Curated collection of commonly used emojis
 */

// Curated emoji set (reduced and easier to navigate)
export const ICON_CATEGORIES: Record<string, string[]> = {
  achievements: ['🏆', '🎖️', '🥇', '🎯', '⭐'],
  health: ['💪', '🏃‍♂️', '🏊‍♀️', '🚴‍♀️', '🧘‍♀️', '🍎', '🥗'],
  learning: ['📚', '📝', '🎓', '📖', '🧠'],
  work: ['💼', '🧾', '📈', '🗂️', '🖥️'],
  finance: ['💰', '📊', '💳', '🪙'],
  time: ['⏰', '📅', '🕒', '⏳'],
  food: ['🍎', '🍔', '🍕', '🍣', '☕', '🍩'],
  fun: ['🎮', '🎬', '🎲', '🎧', '🎤'],
  sports: ['⚽', '🏀', '🏈', '🎾', '🏸'],
  travel: ['✈️', '🗺️', '🏝️', '🚗', '🧳'],
  nature: ['🌳', '🌞', '🌧️', '🌊', '🌸'],
  animals: ['🐶', '🐱', '🦊', '🐼', '🦁'],
  celebrations: ['🎉', '🎂', '🎁', '🥳'],
  hobbies: ['🎨', '🎸', '🧩', '📷'],
  tech: ['📱', '💻', '🖱️', '🔌'],
  home: ['🏠', '🛋️', '🧹', '🏡'],
  symbols: ['✅', '🔔', '⚠️', '❌', '➕'],
};

// Flattened master list used by the UI (keeps order predictable)
export const GOAL_REWARD_ICONS: string[] = Object.values(ICON_CATEGORIES).flat();

// Defaults
export const DEFAULT_GOAL_ICON = '🎯';
export const DEFAULT_REWARD_ICON = '🎁';

// Icon categories for search/filter
// (old placeholder categories removed)

/**
 * Get a random icon from the list
 */
export function getRandomIcon(): string {
  return GOAL_REWARD_ICONS[Math.floor(Math.random() * GOAL_REWARD_ICONS.length)];
}

/**
 * Search icons by keyword
 */
export function searchIcons(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return GOAL_REWARD_ICONS;

  // If user types a category name, return that category
  const byCategory: string[] = [];
  Object.entries(ICON_CATEGORIES).forEach(([category, icons]) => {
    if (category.includes(q)) {
      byCategory.push(...icons);
    }
  });
  if (byCategory.length > 0) return byCategory;

  // Otherwise, filter the master list by emoji character or short description match
  // We match by emoji character (so typing an emoji also works) and also
  // by matching a few common keyword aliases (category name substrings).
  const filtered = GOAL_REWARD_ICONS.filter((icon) => icon.includes(query) || icon.toLowerCase().includes(q));
  return filtered.length > 0 ? filtered : GOAL_REWARD_ICONS;
}
