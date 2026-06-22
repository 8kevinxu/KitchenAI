import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { RecipeDetail, RecipeProvider, RecipeSummary } from '@/lib/recipes/types';

const PREFIX = 'spoonacular:';

// Spoonacular is reached through a Supabase Edge Function ("spoonacular") that
// holds the API key server-side, so no key ships in the client bundle. It's
// available whenever Supabase is configured (and the function is deployed).
export const isSpoonacularConfigured = isSupabaseConfigured;

// App cuisine label -> Spoonacular cuisine. No "Filipino" (TheMealDB covers
// that); the rest — including Korean/American/Persian that TheMealDB lacks.
const CUISINE: Record<string, string | undefined> = {
  CHINESE: 'Chinese',
  JAPANESE: 'Japanese',
  MEXICAN: 'Mexican',
  VIETNAMESE: 'Vietnamese',
  ITALIAN: 'Italian',
  KOREAN: 'Korean',
  AMERICAN: 'American',
  PERSIAN: 'Middle Eastern',
  FILIPINO: undefined,
};

type SpoonIngredient = {
  name: string;
  original?: string;
  measures?: { us?: { amount: number; unitShort: string } };
};

const detailCache = new Map<string, RecipeDetail | null>();

/** Call the Spoonacular proxy edge function. Returns null on any failure. */
async function invoke<T>(
  endpoint: string,
  params: Record<string, string> = {},
  id?: string,
): Promise<T | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.functions.invoke('spoonacular', {
      body: { endpoint, params, id },
    });
    if (error) return null;
    return data as T;
  } catch {
    return null;
  }
}

const measureOf = (i: SpoonIngredient) => {
  const m = i.measures?.us;
  if (!m) return '';
  const amount = Number.isInteger(m.amount)
    ? `${m.amount}`
    : m.amount.toFixed(2).replace(/\.?0+$/, '');
  return `${amount} ${m.unitShort}`.trim();
};

const summaryFrom = (id: number, title: string, image: string, names: string[]): RecipeSummary => ({
  id: PREFIX + id,
  source: 'spoonacular',
  title,
  image,
  ingredientNames: names,
});

export const spoonacular: RecipeProvider = {
  source: 'spoonacular',

  async findByIngredients(ingredients) {
    if (ingredients.length === 0) return [];
    const data = await invoke<
      {
        id: number;
        title: string;
        image: string;
        usedIngredients: { name: string }[];
        missedIngredients: { name: string }[];
      }[]
    >('findByIngredients', {
      ingredients: ingredients.join(','),
      number: '15',
      ranking: '2',
      ignorePantry: 'true',
    });
    if (!Array.isArray(data)) return [];
    return data.map((r) =>
      summaryFrom(r.id, r.title, r.image, [
        ...r.usedIngredients.map((i) => i.name),
        ...r.missedIngredients.map((i) => i.name),
      ]),
    );
  },

  async findByCuisine(cuisine) {
    const c = CUISINE[cuisine.toUpperCase()];
    if (!c) return [];
    const data = await invoke<{
      results: { id: number; title: string; image: string; extendedIngredients?: SpoonIngredient[] }[];
    }>('complexSearch', {
      cuisine: c,
      number: '15',
      addRecipeInformation: 'true',
      fillIngredients: 'true',
    });
    if (!data?.results) return [];
    return data.results.map((r) =>
      summaryFrom(r.id, r.title, r.image, (r.extendedIngredients ?? []).map((i) => i.name)),
    );
  },

  async getRecipe(id) {
    const realId = id.startsWith(PREFIX) ? id.slice(PREFIX.length) : id;
    if (detailCache.has(realId)) return detailCache.get(realId)!;

    const data = await invoke<{
      id: number;
      title: string;
      image: string;
      extendedIngredients?: SpoonIngredient[];
      instructions?: string;
      analyzedInstructions?: { steps: { step: string }[] }[];
    }>('information', {}, realId);

    if (!data) {
      detailCache.set(realId, null);
      return null;
    }

    const ext = data.extendedIngredients ?? [];
    const steps =
      data.analyzedInstructions?.[0]?.steps?.map((s) => s.step) ??
      (data.instructions ?? '')
        .replace(/<[^>]+>/g, '\n')
        .split(/\r?\n+/)
        .map((s) => s.trim())
        .filter(Boolean);

    const detail: RecipeDetail = {
      id: PREFIX + data.id,
      source: 'spoonacular',
      title: data.title,
      image: data.image,
      ingredientNames: ext.map((i) => i.name),
      ingredients: ext.map((i) => ({ name: i.name, measure: measureOf(i) })),
      instructions: steps,
    };
    detailCache.set(realId, detail);
    return detail;
  },
};
