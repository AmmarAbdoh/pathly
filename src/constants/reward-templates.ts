/**
 * Pre-defined reward templates for common redemptions
 * Helps users quickly create rewards to spend their points
 */

import { getRewardTemplateTranslation, Language } from '../i18n/template-translations';

export interface RewardTemplate {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  icon: string;
  category: 'food' | 'entertainment' | 'shopping' | 'wellness' | 'experience' | 'hobby' | 'tech' | 'other';
}

const REWARD_TEMPLATES_BASE: RewardTemplate[] = [
  // Food & Drinks (100-400 points)
  {
    id: 'coffee_shop',
    title: 'Coffee Shop Visit',
    description: 'Treat yourself to your favorite coffee',
    pointsCost: 100,
    icon: '☕',
    category: 'food',
  },
  {
    id: 'ice_cream',
    title: 'Ice Cream Treat',
    description: 'Enjoy a delicious ice cream',
    pointsCost: 120,
    icon: '🍦',
    category: 'food',
  },
  {
    id: 'dessert',
    title: 'Dessert Indulgence',
    description: 'Sweet treat from your favorite bakery',
    pointsCost: 150,
    icon: '🍰',
    category: 'food',
  },
  {
    id: 'bubble_tea',
    title: 'Bubble Tea',
    description: 'Refreshing bubble tea drink',
    pointsCost: 130,
    icon: '🧋',
    category: 'food',
  },
  {
    id: 'pizza_night',
    title: 'Pizza Night',
    description: 'Order your favorite pizza',
    pointsCost: 300,
    icon: '🍕',
    category: 'food',
  },
  {
    id: 'sushi',
    title: 'Sushi Dinner',
    description: 'Fresh sushi from local restaurant',
    pointsCost: 400,
    icon: '🍣',
    category: 'food',
  },
  {
    id: 'burger',
    title: 'Gourmet Burger',
    description: 'Premium burger meal',
    pointsCost: 250,
    icon: '🍔',
    category: 'food',
  },
  {
    id: 'brunch',
    title: 'Weekend Brunch',
    description: 'Lazy Sunday brunch outing',
    pointsCost: 350,
    icon: '🥞',
    category: 'food',
  },
  {
    id: 'smoothie',
    title: 'Healthy Smoothie',
    description: 'Fresh fruit smoothie',
    pointsCost: 120,
    icon: '🥤',
    category: 'food',
  },
  {
    id: 'takeout',
    title: 'Takeout Dinner',
    description: 'Order from your favorite restaurant',
    pointsCost: 400,
    icon: '🥡',
    category: 'food',
  },

  // Entertainment (200-1000 points)
  {
    id: 'movie_ticket',
    title: 'Movie Theater',
    description: 'Watch a movie in cinema',
    pointsCost: 300,
    icon: '🎬',
    category: 'entertainment',
  },
  {
    id: 'streaming_month',
    title: 'Streaming Service',
    description: 'One month subscription',
    pointsCost: 250,
    icon: '📺',
    category: 'entertainment',
  },
  {
    id: 'concert',
    title: 'Concert Tickets',
    description: 'Live music experience',
    pointsCost: 800,
    icon: '🎵',
    category: 'entertainment',
  },
  {
    id: 'game_night',
    title: 'Game Night',
    description: 'Board games with friends',
    pointsCost: 200,
    icon: '🎲',
    category: 'entertainment',
  },
  {
    id: 'video_game',
    title: 'New Video Game',
    description: 'Purchase a new game',
    pointsCost: 1000,
    icon: '🎮',
    category: 'entertainment',
  },
  {
    id: 'theater',
    title: 'Theater Show',
    description: 'Watch a live theater performance',
    pointsCost: 700,
    icon: '🎭',
    category: 'entertainment',
  },
  {
    id: 'music_album',
    title: 'Music Album',
    description: 'Buy your favorite album',
    pointsCost: 250,
    icon: '💿',
    category: 'entertainment',
  },
  {
    id: 'karaoke',
    title: 'Karaoke Night',
    description: 'Fun singing session',
    pointsCost: 300,
    icon: '🎤',
    category: 'entertainment',
  },
  {
    id: 'escape_room',
    title: 'Escape Room',
    description: 'Puzzle-solving adventure',
    pointsCost: 500,
    icon: '🔐',
    category: 'entertainment',
  },
  {
    id: 'bowling',
    title: 'Bowling Night',
    description: 'Bowling with friends',
    pointsCost: 350,
    icon: '🎳',
    category: 'entertainment',
  },

  // Shopping (300-1500 points)
  {
    id: 'clothes',
    title: 'New Outfit',
    description: 'Buy new clothes',
    pointsCost: 800,
    icon: '👕',
    category: 'shopping',
  },
  {
    id: 'shoes',
    title: 'New Shoes',
    description: 'Fresh pair of kicks',
    pointsCost: 1000,
    icon: '👟',
    category: 'shopping',
  },
  {
    id: 'accessories',
    title: 'Fashion Accessory',
    description: 'Jewelry, watch, or bag',
    pointsCost: 600,
    icon: '💍',
    category: 'shopping',
  },
  {
    id: 'makeup',
    title: 'Beauty Products',
    description: 'Makeup or skincare items',
    pointsCost: 500,
    icon: '💄',
    category: 'shopping',
  },
  {
    id: 'perfume',
    title: 'Fragrance',
    description: 'New perfume or cologne',
    pointsCost: 700,
    icon: '🧴',
    category: 'shopping',
  },
  {
    id: 'sunglasses',
    title: 'Sunglasses',
    description: 'Stylish sunglasses',
    pointsCost: 600,
    icon: '🕶️',
    category: 'shopping',
  },
  {
    id: 'gift_card',
    title: 'Gift Card',
    description: '$50 gift card',
    pointsCost: 1000,
    icon: '🎁',
    category: 'shopping',
  },
  {
    id: 'home_decor',
    title: 'Home Decoration',
    description: 'Spruce up your space',
    pointsCost: 500,
    icon: '🖼️',
    category: 'shopping',
  },
  {
    id: 'plants',
    title: 'House Plants',
    description: 'Add greenery to your home',
    pointsCost: 300,
    icon: '🪴',
    category: 'shopping',
  },
  {
    id: 'candles',
    title: 'Scented Candles',
    description: 'Premium candles',
    pointsCost: 350,
    icon: '🕯️',
    category: 'shopping',
  },

  // Wellness & Self-Care (200-1200 points)
  {
    id: 'massage',
    title: 'Massage Session',
    description: 'Relaxing massage therapy',
    pointsCost: 1000,
    icon: '💆',
    category: 'wellness',
  },
  {
    id: 'spa_day',
    title: 'Spa Day',
    description: 'Full spa treatment',
    pointsCost: 1200,
    icon: '🧖',
    category: 'wellness',
  },
  {
    id: 'manicure',
    title: 'Manicure/Pedicure',
    description: 'Nail care treatment',
    pointsCost: 600,
    icon: '💅',
    category: 'wellness',
  },
  {
    id: 'haircut',
    title: 'Haircut & Style',
    description: 'Fresh haircut',
    pointsCost: 700,
    icon: '💇',
    category: 'wellness',
  },
  {
    id: 'yoga_class',
    title: 'Yoga Class Pass',
    description: '5 yoga classes',
    pointsCost: 500,
    icon: '🧘',
    category: 'wellness',
  },
  {
    id: 'gym_month',
    title: 'Gym Membership',
    description: 'One month gym access',
    pointsCost: 800,
    icon: '🏋️',
    category: 'wellness',
  },
  {
    id: 'meditation_app',
    title: 'Meditation App',
    description: 'Premium meditation subscription',
    pointsCost: 300,
    icon: '🧠',
    category: 'wellness',
  },
  {
    id: 'skincare',
    title: 'Skincare Routine',
    description: 'Quality skincare products',
    pointsCost: 600,
    icon: '🧴',
    category: 'wellness',
  },
  {
    id: 'bath_products',
    title: 'Bath & Body Set',
    description: 'Luxurious bath products',
    pointsCost: 400,
    icon: '🛁',
    category: 'wellness',
  },
  {
    id: 'fitness_tracker',
    title: 'Fitness Tracker',
    description: 'Activity monitoring device',
    pointsCost: 1500,
    icon: '⌚',
    category: 'wellness',
  },

  // Experiences (400-2000 points)
  {
    id: 'day_trip',
    title: 'Day Trip',
    description: 'Visit nearby city or attraction',
    pointsCost: 800,
    icon: '🚗',
    category: 'experience',
  },
  {
    id: 'theme_park',
    title: 'Theme Park Visit',
    description: 'Amusement park tickets',
    pointsCost: 1000,
    icon: '🎢',
    category: 'experience',
  },
  {
    id: 'museum',
    title: 'Museum Entry',
    description: 'Art or science museum',
    pointsCost: 400,
    icon: '🏛️',
    category: 'experience',
  },
  {
    id: 'aquarium',
    title: 'Aquarium Visit',
    description: 'Marine life experience',
    pointsCost: 500,
    icon: '🐠',
    category: 'experience',
  },
  {
    id: 'zoo',
    title: 'Zoo Trip',
    description: 'Visit the zoo',
    pointsCost: 450,
    icon: '🦁',
    category: 'experience',
  },
  {
    id: 'weekend_getaway',
    title: 'Weekend Getaway',
    description: '2-night hotel stay',
    pointsCost: 2000,
    icon: '🏨',
    category: 'experience',
  },
  {
    id: 'beach_day',
    title: 'Beach Day',
    description: 'Relaxing day at the beach',
    pointsCost: 600,
    icon: '🏖️',
    category: 'experience',
  },
  {
    id: 'hiking',
    title: 'Hiking Adventure',
    description: 'Guided hiking tour',
    pointsCost: 700,
    icon: '⛰️',
    category: 'experience',
  },
  {
    id: 'camping',
    title: 'Camping Trip',
    description: 'Weekend camping',
    pointsCost: 900,
    icon: '🏕️',
    category: 'experience',
  },
  {
    id: 'hot_air_balloon',
    title: 'Hot Air Balloon Ride',
    description: 'Aerial adventure',
    pointsCost: 1500,
    icon: '🎈',
    category: 'experience',
  },

  // Hobbies (200-1500 points)
  {
    id: 'art_supplies',
    title: 'Art Supplies',
    description: 'Paints, brushes, canvas',
    pointsCost: 500,
    icon: '🎨',
    category: 'hobby',
  },
  {
    id: 'photography_gear',
    title: 'Photography Gear',
    description: 'Lens or accessories',
    pointsCost: 1500,
    icon: '📷',
    category: 'hobby',
  },
  {
    id: 'musical_accessory',
    title: 'Music Accessory',
    description: 'Guitar strings, picks, etc',
    pointsCost: 300,
    icon: '🎸',
    category: 'hobby',
  },
  {
    id: 'cookbook',
    title: 'Cookbook',
    description: 'Learn new recipes',
    pointsCost: 400,
    icon: '📖',
    category: 'hobby',
  },
  {
    id: 'cooking_class',
    title: 'Cooking Class',
    description: 'Learn culinary skills',
    pointsCost: 800,
    icon: '👨‍🍳',
    category: 'hobby',
  },
  {
    id: 'craft_kit',
    title: 'Craft Kit',
    description: 'DIY project materials',
    pointsCost: 450,
    icon: '✂️',
    category: 'hobby',
  },
  {
    id: 'gardening_tools',
    title: 'Gardening Tools',
    description: 'Quality garden equipment',
    pointsCost: 600,
    icon: '🌱',
    category: 'hobby',
  },
  {
    id: 'puzzle',
    title: 'Premium Puzzle',
    description: '1000+ piece puzzle',
    pointsCost: 350,
    icon: '🧩',
    category: 'hobby',
  },
  {
    id: 'hobby_book',
    title: 'Hobby Book',
    description: 'Learn your interest',
    pointsCost: 400,
    icon: '📚',
    category: 'hobby',
  },
  {
    id: 'sports_equipment',
    title: 'Sports Equipment',
    description: 'Gear for your sport',
    pointsCost: 1000,
    icon: '⚽',
    category: 'hobby',
  },

  // Technology (500-2500 points)
  {
    id: 'headphones',
    title: 'Wireless Headphones',
    description: 'Quality audio experience',
    pointsCost: 1500,
    icon: '🎧',
    category: 'tech',
  },
  {
    id: 'smart_speaker',
    title: 'Smart Speaker',
    description: 'Voice assistant device',
    pointsCost: 1200,
    icon: '🔊',
    category: 'tech',
  },
  {
    id: 'keyboard',
    title: 'Mechanical Keyboard',
    description: 'Premium typing experience',
    pointsCost: 1800,
    icon: '⌨️',
    category: 'tech',
  },
  {
    id: 'mouse',
    title: 'Gaming Mouse',
    description: 'Precision mouse',
    pointsCost: 800,
    icon: '🖱️',
    category: 'tech',
  },
  {
    id: 'webcam',
    title: 'HD Webcam',
    description: 'High quality camera',
    pointsCost: 1000,
    icon: '📹',
    category: 'tech',
  },
  {
    id: 'power_bank',
    title: 'Power Bank',
    description: 'Portable charger',
    pointsCost: 600,
    icon: '🔋',
    category: 'tech',
  },
  {
    id: 'phone_case',
    title: 'Premium Phone Case',
    description: 'Protect your device',
    pointsCost: 500,
    icon: '📱',
    category: 'tech',
  },
  {
    id: 'tablet',
    title: 'Tablet Device',
    description: 'Portable tablet',
    pointsCost: 2500,
    icon: '📱',
    category: 'tech',
  },
  {
    id: 'smart_watch',
    title: 'Smart Watch',
    description: 'Wearable technology',
    pointsCost: 2000,
    icon: '⌚',
    category: 'tech',
  },
  {
    id: 'led_lights',
    title: 'LED Strip Lights',
    description: 'Room ambiance lighting',
    pointsCost: 500,
    icon: '💡',
    category: 'tech',
  },

  // Other Rewards (100-1000 points)
  {
    id: 'lazy_day',
    title: 'Lazy Day',
    description: 'Guilt-free rest day',
    pointsCost: 100,
    icon: '😴',
    category: 'other',
  },
  {
    id: 'cheat_meal',
    title: 'Cheat Meal',
    description: 'No-guilt indulgence',
    pointsCost: 200,
    icon: '🍟',
    category: 'other',
  },
  {
    id: 'sleep_in',
    title: 'Sleep In',
    description: 'Skip morning alarm',
    pointsCost: 150,
    icon: '⏰',
    category: 'other',
  },
  {
    id: 'charity',
    title: 'Charity Donation',
    description: 'Give to a good cause',
    pointsCost: 500,
    icon: '❤️',
    category: 'other',
  },
  {
    id: 'flowers',
    title: 'Fresh Flowers',
    description: 'Beautiful bouquet',
    pointsCost: 400,
    icon: '💐',
    category: 'other',
  },
  {
    id: 'magazine',
    title: 'Magazine Subscription',
    description: 'Monthly magazine',
    pointsCost: 300,
    icon: '📰',
    category: 'other',
  },
  {
    id: 'parking_pass',
    title: 'Parking Pass',
    description: 'Monthly parking',
    pointsCost: 800,
    icon: '🅿️',
    category: 'other',
  },
  {
    id: 'pet_treat',
    title: 'Pet Treats',
    description: 'Spoil your furry friend',
    pointsCost: 350,
    icon: '🐾',
    category: 'other',
  },
];

/**
 * Get templates by category
 */
export const getRewardTemplatesByCategory = (category: string): RewardTemplate[] => {
  return REWARD_TEMPLATES.filter(template => template.category === category);
};

/**
 * Get translated reward templates based on language
 */
export const getRewardTemplates = (language: Language = 'en'): RewardTemplate[] => {
  return REWARD_TEMPLATES_BASE.map(template => {
    const translation = getRewardTemplateTranslation(template.id, language);
    return {
      ...template,
      title: translation.title || template.title,
      description: translation.description || template.description,
    };
  });
};

// Export default English templates
export const REWARD_TEMPLATES = REWARD_TEMPLATES_BASE;

/**
 * Get a template by ID
 */
export const getRewardTemplateById = (id: string, language: Language = 'en'): RewardTemplate | undefined => {
  const templates = getRewardTemplates(language);
  return templates.find(template => template.id === id);
};
