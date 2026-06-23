import { inventoryMatcher, rankByInventory } from '@/lib/recipes/match';

export { inventoryMatcher, expiringMatcher } from '@/lib/recipes/match';
import { spoonacular } from '@/lib/recipes/spoonacular';
import { theMealDb } from '@/lib/recipes/themealdb';
import {
  hasActiveFilters,
  RankedRecipe,
  RecipeDetail,
  RecipeFilters,
  RecipeProvider,
  RecipeSummary,
} from '@/lib/recipes/types';

export * from '@/lib/recipes/types';

// Active recipe sources. Both speak the same RecipeProvider interface, so the
// matcher and screens are unchanged. Spoonacular no-ops if its key is unset.
const PROVIDERS: RecipeProvider[] = [theMealDb, spoonacular];

/** Merge results from several providers, de-duping the same dish by title. */
function dedupeByTitle(lists: RecipeSummary[][]): RecipeSummary[] {
  const seen = new Set<string>();
  return lists.flat().filter((r) => {
    const key = r.title.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Recommend dishes the user can cook, ranked by how well they fit inventory. */
export async function recommendRecipes(
  inventory: string[],
  limit = 20,
  filters?: RecipeFilters,
): Promise<RankedRecipe[]> {
  if (inventory.length === 0) return [];

  const results = await Promise.all(
    PROVIDERS.map((p) => p.findByIngredients(inventory, filters).catch(() => [])),
  );

  // With a dietary filter active, be more forgiving about inventory overlap —
  // the constraint is the primary intent, so don't drop a compliant dish just
  // because it only uses one on-hand ingredient.
  const minUsed = hasActiveFilters(filters) ? 1 : 2;
  return rankByInventory(dedupeByTitle(results), inventory, { minUsed }).slice(0, limit);
}

/**
 * Recipes that can be assembled from a target set of ingredients (e.g. the
 * items about to expire). Queries providers with the targets so results are
 * biased to use them, keeps only recipes that use at least one target, and
 * ranks by how many targets each uses (then overall inventory fit). Returns an
 * empty list when nothing matches — the caller shows a "no recipes" state.
 */
export async function recommendUsingIngredients(
  targets: string[],
  inventory: string[],
  limit = 20,
  filters?: RecipeFilters,
): Promise<RankedRecipe[]> {
  if (targets.length === 0) return [];

  const results = await Promise.all(
    PROVIDERS.map((p) => p.findByIngredients(targets, filters).catch(() => [])),
  );
  const ranked = rankByInventory(dedupeByTitle(results), inventory, { minUsed: 0 });

  return ranked
    .map((r) => {
      const recipeHas = inventoryMatcher(r.ingredientNames);
      return { ...r, usedExpiring: targets.filter((t) => recipeHas(t)) };
    })
    .filter((r) => r.usedExpiring.length > 0)
    .sort((a, b) => b.usedExpiring.length - a.usedExpiring.length || b.score - a.score)
    .slice(0, limit);
}

/** Recipes for a specific cuisine, ordered by how well they fit the inventory
 *  (but not filtered out when nothing matches — this is a browse view). */
export async function recommendByCuisine(
  cuisine: string,
  inventory: string[],
  limit = 30,
  filters?: RecipeFilters,
): Promise<RankedRecipe[]> {
  const results = await Promise.all(
    PROVIDERS.map((p) => p.findByCuisine(cuisine, filters).catch(() => [])),
  );

  return rankByInventory(dedupeByTitle(results), inventory, { minUsed: 0 }).slice(0, limit);
}

/**
 * Normalize recipe directions from external providers before display. The
 * screen numbers each step itself, so any numbering the source baked into the
 * text ("1.", "1)", "Step 1", or stacked "1. Step 1 …") is redundant and gets
 * stripped. Also splits a single blob that crams several numbered steps onto
 * one line into separate steps, and drops fragments left empty (e.g. a lone
 * "Step 1" label). Idempotent and safe on already-clean directions.
 */
export function cleanDirections(steps: string[]): string[] {
  // A leading step marker: "Step 1", a bare "1", with optional trailing
  // punctuation. Real sentences (starting with a word) never match.
  const LEADING_MARKER = /^\s*(?:step\s*\d{1,3}|\d{1,3})\s*[.):–-]*\s*/i;

  return steps
    // Break a blob like "1. Step 1 2. directions" before each inline marker.
    // (Replace-then-split avoids lookbehind for older JS engines.)
    .flatMap((s) => s.replace(/\s+(?=(?:step\s+)?\d{1,2}[.)]\s)/gi, '\n').split('\n'))
    .map((s) => {
      // Peel off stacked markers ("1. Step 1 …" -> "…") until none remain.
      let out = s.trim();
      let prev = '';
      while (out !== prev) {
        prev = out;
        out = out.replace(LEADING_MARKER, '').trim();
      }
      return out;
    })
    .filter(Boolean);
}

/** Fetch full detail for a source-prefixed recipe id. */
export async function getRecipeDetail(id: string): Promise<RecipeDetail | null> {
  const source = id.split(':')[0];
  const provider = PROVIDERS.find((p) => p.source === source);
  if (!provider) return null;
  const detail = await provider.getRecipe(id);
  return detail
    ? { ...detail, instructions: cleanDirections(detail.instructions) }
    : null;
}
