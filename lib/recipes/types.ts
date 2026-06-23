/** Source-agnostic recipe types. Every provider adapts its API into these,
 *  so the rest of the app (and the inventory matcher) never sees vendor JSON. */

export type RecipeSource = 'themealdb' | 'spoonacular' | 'local';

/** Lightweight recipe used for discovery/listing. `id` is source-prefixed,
 *  e.g. "themealdb:52772". */
export type RecipeSummary = {
  id: string;
  source: RecipeSource;
  title: string;
  image: string;
  /** Raw ingredient names (no quantities) used for inventory matching. */
  ingredientNames: string[];
};

/** Full recipe for the detail screen. */
export type RecipeDetail = RecipeSummary & {
  ingredients: { name: string; measure: string }[];
  instructions: string[];
  category?: string;
  area?: string;
};

/** A recipe scored against the user's inventory. */
export type RankedRecipe = RecipeSummary & {
  /** Recipe ingredients the user already has. */
  used: string[];
  /** Recipe ingredients the user is missing. */
  missing: string[];
  score: number;
};

/** Optional dietary / time constraints applied to a recipe search. */
export type RecipeFilters = {
  /** Spoonacular diet, e.g. "vegetarian" | "vegan". Mutually exclusive. */
  diet?: string;
  /** Spoonacular intolerances to exclude, e.g. ["gluten", "dairy"]. */
  intolerances?: string[];
  /** Cap on total ready time, in minutes (e.g. 30 for "quick"). */
  maxReadyTime?: number;
};

/** True when at least one constraint is set. */
export const hasActiveFilters = (f?: RecipeFilters): boolean =>
  !!(f && (f.diet || f.intolerances?.length || f.maxReadyTime));

export interface RecipeProvider {
  source: RecipeSource;
  /** Find candidate recipes given the user's inventory ingredient names. */
  findByIngredients(ingredients: string[], filters?: RecipeFilters): Promise<RecipeSummary[]>;
  /** Recipes belonging to a cuisine (app label, e.g. "CHINESE"). Empty if the
   *  provider doesn't carry that cuisine. */
  findByCuisine(cuisine: string, filters?: RecipeFilters): Promise<RecipeSummary[]>;
  /** Full detail for a source-prefixed recipe id, or null if not found. */
  getRecipe(id: string): Promise<RecipeDetail | null>;
}
