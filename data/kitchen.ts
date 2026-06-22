/**
 * Mock data for the Virtual Kitchen app. Mirrors the content shown in the
 * Figma prototype (Amy Vo's inventory + three recommended recipes).
 */

export type IngredientStatus = 'ok' | 'expired' | 'out' | 'new';

export type Ingredient = {
  id: string;
  name: string;
  emoji: string;
  status?: IngredientStatus;
  /** Staple that has dropped below the user's restock threshold. */
  lowStock?: boolean;
  category: 'Proteins' | 'Vegetables' | 'Carbs' | 'Seasonings';
};

export type IngredientDetail = {
  status: string;
  expiration: string;
  purchased: string;
  pastUses: string;
};

export type Recipe = {
  id: string;
  title: string;
  image: string;
  missingIngredients: boolean;
  ingredients: { heading: string; items: string[] }[];
  directions: string[];
};

export type Cuisine = { name: string; emoji: string };

export const USER = { name: 'AMY VO', email: 'support@aivirtualkitchen.com' };

export const INGREDIENTS: Ingredient[] = [
  { id: 'steak', name: 'steak', emoji: '🥩', category: 'Proteins' },
  { id: 'ground-beef', name: 'ground beef', emoji: '🐄', category: 'Proteins' },
  { id: 'shrimp', name: 'shrimp', emoji: '🦐', category: 'Proteins' },
  { id: 'pork', name: 'pork', emoji: '🐷', category: 'Proteins' },
  { id: 'chicken', name: 'chicken', emoji: '🐔', category: 'Proteins' },
  { id: 'eggs', name: 'eggs', emoji: '🥚', category: 'Proteins' },

  { id: 'lettuce', name: 'lettuce', emoji: '🥬', status: 'expired', category: 'Vegetables' },
  { id: 'spinach', name: 'spinach', emoji: '🌿', category: 'Vegetables' },
  { id: 'peas', name: 'peas', emoji: '🫛', status: 'out', category: 'Vegetables' },
  { id: 'carrots', name: 'carrots', emoji: '🥕', status: 'out', category: 'Vegetables' },
  { id: 'green-onion', name: 'green onion', emoji: '🧅', status: 'out', category: 'Vegetables' },

  { id: 'rice', name: 'rice', emoji: '🍚', lowStock: true, category: 'Carbs' },

  { id: 'oil', name: 'oil', emoji: '🫗', category: 'Seasonings' },
  { id: 'sesame-oil', name: 'sesame oil', emoji: '🧴', category: 'Seasonings' },
  { id: 'oyster-sauce', name: 'oyster sauce', emoji: '🍶', category: 'Seasonings' },
  { id: 'salt', name: 'salt', emoji: '🧂', category: 'Seasonings' },
  { id: 'chicken-bouillon', name: 'chicken bouillon', emoji: '🧊', category: 'Seasonings' },
  { id: 'pepper', name: 'pepper', emoji: '🌶️', category: 'Seasonings' },
  { id: 'soy-sauce', name: 'soy sauce', emoji: '🥢', lowStock: true, category: 'Seasonings' },
  { id: 'garlic-powder', name: 'garlic powder', emoji: '🧄', category: 'Seasonings' },
];

export const INGREDIENT_DETAILS: Record<string, IngredientDetail> = {
  steak: {
    status: 'Abundant (2lbs)',
    expiration: '3/19/25',
    purchased: 'purchased 4 lbs on 3/10/25',
    pastUses: 'Steak & Potatoes (2lbs) 3/12/25',
  },
};

export const CATEGORY_ORDER: Ingredient['category'][] = [
  'Proteins',
  'Vegetables',
  'Carbs',
  'Seasonings',
];

export const CUISINES: Cuisine[] = [
  { name: 'CHINESE', emoji: '🍚' },
  { name: 'JAPANESE', emoji: '🍣' },
  { name: 'MEXICAN', emoji: '🌮' },
  { name: 'FILIPINO', emoji: '🐷' },
  { name: 'VIETNAMESE', emoji: '🍜' },
  { name: 'ITALIAN', emoji: '🍕' },
  { name: 'PERSIAN', emoji: '🍢' },
  { name: 'KOREAN', emoji: '🍲' },
  { name: 'AMERICAN', emoji: '🍔' },
];

export const RECIPES: Recipe[] = [
  {
    id: 'beef-fried-rice',
    title: 'Beef Fried Rice',
    image:
      'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&q=80',
    missingIngredients: true,
    ingredients: [
      { heading: 'Rice:', items: ['1 cup of one day old rice'] },
      {
        heading: 'Sauce:',
        items: [
          '1 tbsp soy sauce',
          '1 tbsp oyster sauce',
          '1 tsp sesame oil',
          '1 tsp chicken bouillon',
          '1 tsp garlic powder',
        ],
      },
      {
        heading: 'Stir Fry:',
        items: [
          '2 tbsp oil',
          '1/2 lb rib-eye steak',
          'sprinkle of salt & pepper',
          '2 eggs whisked',
          '3 pieces of garlic (diced)',
          '1/2 cup frozen peas',
          '1/2 cup frozen carrots',
          '1/4 cup green onions (diced)',
        ],
      },
    ],
    directions: [
      'Cut the beef into small strips and tenderize it with a mallet. Also mix the ingredients for the sauce.',
      'Heat up the wok of medium-high heat. Whisk the 2 eggs.',
      'Add 1 tbsp of oil into the wok and the whisked eggs.',
      'Cook the eggs and remove it from the wok into a bowl.',
      'Add another 1 tbsp of oil into the wok. Add the diced garlic into the wok, cook for 30 seconds.',
      'Then add the beef into the wok. Stir the beef around for 3-4 minutes.',
      'Now add 1 cup of day old rice into the wok. Use a spatula to break the rice apart.',
      'After separating the rice, add the 1/2 cup of frozen peas and carrots. Let it cook for 2-3 minutes.',
      'Add back the eggs in and the sauce. Let it cook for 3-4 more minutes.',
      'Finally add the diced green onions on top. SERVE!',
    ],
  },
  {
    id: 'char-siu-pork',
    title: 'Char Siu Pork',
    image:
      'https://images.unsplash.com/photo-1623653387945-2fd25214f8fc?w=600&q=80',
    missingIngredients: true,
    ingredients: [
      { heading: 'Meat:', items: ['1.5 lb of pork shoulder or pork butt'] },
      {
        heading: 'Marinate:',
        items: [
          '1 tbsp garlic salt',
          '3 tbsp brown sugar',
          '1.5 tbsp oyster sauce',
          '1.5 tbsp soy sauce',
          '1 tbsp hoisin sauce',
          '1 tbsp Shaoxing wine',
          '1 tbsp five spice powder',
        ],
      },
      {
        heading: 'Basting:',
        items: ['1.5 tbsp honey', '1.5 tbsp water', '1 drop of red food coloring'],
      },
    ],
    directions: [
      'Combine all the marinate ingredients and coat the pork thoroughly.',
      'Marinate the pork in the fridge for at least 4 hours, ideally overnight.',
      'Preheat the oven to 400°F (200°C).',
      'Roast the pork for 25 minutes on a rack over a tray of water.',
      'Mix the basting ingredients together.',
      'Flip the pork, baste it, and roast for another 15 minutes.',
      'Baste again and broil for 3-5 minutes until caramelized. SERVE!',
    ],
  },
  {
    id: 'egg-drop-soup',
    title: 'Egg Drop Soup',
    image:
      'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80',
    missingIngredients: true,
    ingredients: [
      {
        heading: 'Soup Base:',
        items: [
          '4 cups of chicken stock',
          '1/2 tsp sesame oil',
          '1 tsp salt',
          '1/8 tsp sugar',
          '1/8 tsp white pepper',
          '1/2 tsp turmeric (optional)',
          '3 eggs (lightly beaten)',
          '1 stalk of green onions (diced)',
          '1/2 tsp MSG or chicken bouillon',
        ],
      },
      { heading: 'Thickener:', items: ['3 tbsp cornstarch', '1/3 cup water'] },
    ],
    directions: [
      'Bring the chicken stock to a boil in a pot.',
      'Add sesame oil, salt, sugar, white pepper, and turmeric.',
      'Mix the cornstarch and water, then stir into the soup to thicken.',
      'Lightly beat the eggs in a bowl.',
      'Slowly drizzle the eggs in while gently stirring to create ribbons.',
      'Turn off the heat and add the diced green onions. SERVE!',
    ],
  },
];

export const SAVED_RECIPE_IDS = ['beef-fried-rice'];

export type GroceryReason = 'Out of stock' | 'Expired' | 'Running low';

export type GroceryGroup = {
  reason: GroceryReason;
  items: Ingredient[];
};

/**
 * Auto-generates a shopping list from the current inventory: anything out,
 * expired, or below its restock threshold. In a real build this would also
 * fold in ingredients missing from saved/planned recipes.
 */
export function buildGroceryList(): GroceryGroup[] {
  const groups: { reason: GroceryReason; match: (i: Ingredient) => boolean }[] = [
    { reason: 'Out of stock', match: (i) => i.status === 'out' },
    { reason: 'Expired', match: (i) => i.status === 'expired' },
    { reason: 'Running low', match: (i) => !!i.lowStock },
  ];
  return groups
    .map(({ reason, match }) => ({ reason, items: INGREDIENTS.filter(match) }))
    .filter((g) => g.items.length > 0);
}
