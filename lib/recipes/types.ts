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

export interface RecipeProvider {
  source: RecipeSource;
  /** Find candidate recipes given the user's inventory ingredient names. */
  findByIngredients(ingredients: string[]): Promise<RecipeSummary[]>;
  /** Full detail for a source-prefixed recipe id, or null if not found. */
  getRecipe(id: string): Promise<RecipeDetail | null>;
}
