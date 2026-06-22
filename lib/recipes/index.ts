import { rankByInventory } from '@/lib/recipes/match';
import { spoonacular } from '@/lib/recipes/spoonacular';
import { theMealDb } from '@/lib/recipes/themealdb';
import { RankedRecipe, RecipeDetail, RecipeProvider } from '@/lib/recipes/types';

export * from '@/lib/recipes/types';

// Active recipe sources. Both speak the same RecipeProvider interface, so the
// matcher and screens are unchanged. Spoonacular no-ops if its key is unset.
const PROVIDERS: RecipeProvider[] = [theMealDb, spoonacular];

/** Recommend dishes the user can cook, ranked by how well they fit inventory. */
export async function recommendRecipes(
  inventory: string[],
  limit = 20,
): Promise<RankedRecipe[]> {
  if (inventory.length === 0) return [];

  const results = await Promise.all(
    PROVIDERS.map((p) => p.findByIngredients(inventory).catch(() => [])),
  );

  // Merge + dedupe by normalized title (same dish from two sources).
  const seen = new Set<string>();
  const merged = results.flat().filter((r) => {
    const key = r.title.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return rankByInventory(merged, inventory).slice(0, limit);
}

/** Recipes for a specific cuisine, ordered by how well they fit the inventory
 *  (but not filtered out when nothing matches — this is a browse view). */
export async function recommendByCuisine(
  cuisine: string,
  inventory: string[],
  limit = 30,
): Promise<RankedRecipe[]> {
  const results = await Promise.all(
    PROVIDERS.map((p) => p.findByCuisine(cuisine).catch(() => [])),
  );

  const seen = new Set<string>();
  const merged = results.flat().filter((r) => {
    const key = r.title.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return rankByInventory(merged, inventory, { minUsed: 0 }).slice(0, limit);
}

/** Fetch full detail for a source-prefixed recipe id. */
export async function getRecipeDetail(id: string): Promise<RecipeDetail | null> {
  const source = id.split(':')[0];
  const provider = PROVIDERS.find((p) => p.source === source);
  if (!provider) return null;
  return provider.getRecipe(id);
}
