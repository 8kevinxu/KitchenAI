import { RankedRecipe, RecipeSummary } from '@/lib/recipes/types';

/** Generic words that shouldn't, on their own, count as an ingredient match
 *  (otherwise "soy sauce" would match "oyster sauce" via "sauce"). */
const STOPWORDS = new Set([
  'sauce', 'powder', 'fresh', 'ground', 'dried', 'large', 'small',
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
 * Build a predicate that tells whether a single recipe ingredient is satisfied
 * by the given inventory. Uses the same token matching as the ranker, so the
 * per-ingredient indicators stay consistent with recipe ranking.
 */
export function inventoryMatcher(inventory: string[]): (ingredient: string) => boolean {
  const invSets = inventory.map(tokens).filter((s) => s.size > 0);
  return (ingredient: string) => isSatisfied(ingredient, invSets);
}

/**
 * Build a predicate telling whether a recipe ingredient's *best* inventory
 * match is one of the `expiring` items. "Best" = most shared tokens, so
 * "chicken bouillon" resolves to the bouillon you have rather than to expiring
 * "chicken". A tie that includes an expiring item still flags it.
 */
export function expiringMatcher(
  inventory: string[],
  expiring: string[],
): (ingredient: string) => boolean {
  const expiringSet = new Set(expiring.map((n) => n.toLowerCase()));
  const items = inventory
    .map((name) => ({ expiring: expiringSet.has(name.toLowerCase()), set: tokens(name) }))
    .filter((i) => i.set.size > 0);

  return (ingredient: string) => {
    const ing = tokens(ingredient);
    if (ing.size === 0) return false;
    let best = 0;
    let bestExpiring = false;
    for (const it of items) {
      let overlap = 0;
      for (const t of it.set) if (ing.has(t)) overlap += 1;
      if (overlap === 0) continue;
      if (overlap > best) {
        best = overlap;
        bestExpiring = it.expiring;
      } else if (overlap === best && it.expiring) {
        bestExpiring = true;
      }
    }
    return best > 0 && bestExpiring;
  };
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
