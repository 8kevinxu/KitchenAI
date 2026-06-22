import { Ingredient } from '@/data/kitchen';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export type ParsedItem = {
  name: string;
  category: Ingredient['category'];
  quantity?: string;
};

const EMOJI_BY_KEYWORD: [string, string][] = [
  ['chicken', '🐔'], ['beef', '🐄'], ['steak', '🥩'], ['pork', '🐷'], ['bacon', '🥓'],
  ['shrimp', '🦐'], ['salmon', '🐟'], ['fish', '🐟'], ['egg', '🥚'], ['milk', '🥛'],
  ['cheese', '🧀'], ['yogurt', '🥛'], ['tofu', '🧈'], ['banana', '🍌'], ['apple', '🍎'],
  ['lettuce', '🥬'], ['spinach', '🥬'], ['tomato', '🍅'], ['carrot', '🥕'], ['onion', '🧅'],
  ['potato', '🥔'], ['pepper', '🫑'], ['mushroom', '🍄'], ['broccoli', '🥦'], ['avocado', '🥑'],
  ['rice', '🍚'], ['bread', '🍞'], ['pasta', '🍝'], ['noodle', '🍜'], ['cereal', '🥣'],
  ['oil', '🫗'], ['sauce', '🥫'], ['salt', '🧂'], ['sugar', '🍬'], ['garlic', '🧄'],
  ['butter', '🧈'], ['flour', '🌾'],
];
const CATEGORY_EMOJI: Record<Ingredient['category'], string> = {
  Proteins: '🥩',
  Vegetables: '🥦',
  Carbs: '🍞',
  Seasonings: '🧂',
};

function guessEmoji(name: string, category: Ingredient['category']) {
  const n = name.toLowerCase();
  for (const [kw, emoji] of EMOJI_BY_KEYWORD) if (n.includes(kw)) return emoji;
  return CATEGORY_EMOJI[category] ?? '🛒';
}

const slugify = (name: string) =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item';

/** Turn a parsed receipt line into an inventory ingredient (marked new). */
export function parsedToIngredient(p: ParsedItem): Ingredient {
  return {
    id: slugify(p.name),
    name: p.name.toLowerCase(),
    emoji: guessEmoji(p.name, p.category),
    status: 'new',
    abundance: 'medium',
    category: p.category,
  };
}

/**
 * Send a base64 receipt photo to the scan-receipt edge function and get back
 * normalized grocery items. Returns null on any failure (caller shows an error).
 */
export async function scanReceipt(
  image: string,
  mediaType = 'image/jpeg',
): Promise<ParsedItem[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.functions.invoke('scan-receipt', {
      body: { image, mediaType },
    });
    if (error || !data || data.error) return null;
    const items = Array.isArray(data.items) ? (data.items as ParsedItem[]) : [];
    // Keep only well-formed items.
    return items.filter((i) => i && typeof i.name === 'string' && i.name.trim());
  } catch {
    return null;
  }
}
