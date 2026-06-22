import { RankedRecipe, RecipeSummary } from '@/lib/recipes/types';

/** Generic words that shouldn't, on their own, count as an ingredient match
 *  (otherwise "soy sauce" would match "oyster sauce" via "sauce"). */
const STOPWORDS = new Set([
  'sauce', 'oil', 'powder', 'fresh', 'ground', 'dried', 'large', 'small',
  'sea', 'extra', 'virgin', 'of', 'and', 'the', 'to', 'taste', 'a', 'an',
  'whole', 'chopped', 'diced', 'sliced', 'minced', 'raw', 'cooked', 'hot',
  'cold', 'warm', 'plain', 'free', 'low', 'light',
]);

const singularize = (w: string) =>
  w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w;

/** Reduce an ingredient name to a set of significant, singularized tokens. */
function tokens(name: string): Set<string> {
  const cleaned = name
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ') // drop parenthetical notes
    .replace(/[^a-z\s]/g, ' '); // punctuation -> space
  const out = new Set<string>();
  for (const raw of cleaned.split(/\s+/)) {
    const t = singularize(raw.trim());
    if (t.length >= 3 && !STOPWORDS.has(t)) out.add(t);
  }
  return out;
}

/** True if a recipe ingredient is satisfied by some inventory item. */
function isSatisfied(ingredient: string, inventoryTokenSets: Set<string>[]) {
  const ing = tokens(ingredient);
  if (ing.size === 0) return false;
  return inventoryTokenSets.some((inv) => {
    for (const t of inv) if (ing.has(t)) return true;
    return false;
  });
}

/**
 * Rank recipes by how well they fit the inventory: prefer recipes that use the
 * most on-hand ingredients while missing the fewest. Recipes using fewer than
 * `minUsed` of the user's ingredients are dropped as noise.
 */
export function rankByInventory(
  recipes: RecipeSummary[],
  inventory: string[],
  { minUsed = 2, missingWeight = 0.6 }: { minUsed?: number; missingWeight?: number } = {},
): RankedRecipe[] {
  const invSets = inventory.map(tokens).filter((s) => s.size > 0);

  return recipes
    .map((r) => {
      const used: string[] = [];
      const missing: string[] = [];
      for (const ing of r.ingredientNames) {
        (isSatisfied(ing, invSets) ? used : missing).push(ing);
      }
      const score = used.length - missingWeight * missing.length;
      return { ...r, used, missing, score };
    })
    .filter((r) => r.used.length >= minUsed)
    .sort((a, b) => b.score - a.score || a.missing.length - b.missing.length);
}
