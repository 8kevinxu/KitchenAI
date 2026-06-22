import { RecipeDetail, RecipeProvider, RecipeSummary } from '@/lib/recipes/types';

const KEY = process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY;
const BASE = 'https://api.spoonacular.com';
const PREFIX = 'spoonacular:';

export const isSpoonacularConfigured = Boolean(KEY);

// App cuisine label -> Spoonacular cuisine. Spoonacular has no "Filipino"
// (TheMealDB covers that); the rest — including Korean/American/Persian that
// TheMealDB lacks — map here.
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

async function getJSON<T>(path: string): Promise<T | null> {
  try {
    const sep = path.includes('?') ? '&' : '?';
    const res = await fetch(`${BASE}${path}${sep}apiKey=${KEY}`);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

const measureOf = (i: SpoonIngredient) => {
  const m = i.measures?.us;
  if (!m) return '';
  const amount = Number.isInteger(m.amount) ? `${m.amount}` : m.amount.toFixed(2).replace(/\.?0+$/, '');
  return `${amount} ${m.unitShort}`.trim();
};

function summaryFrom(id: number, title: string, image: string, names: string[]): RecipeSummary {
  return { id: PREFIX + id, source: 'spoonacular', title, image, ingredientNames: names };
}

export const spoonacular: RecipeProvider = {
  source: 'spoonacular',

  async findByIngredients(ingredients) {
    if (!isSpoonacularConfigured || ingredients.length === 0) return [];
    const list = encodeURIComponent(ingredients.join(','));
    const data = await getJSON<
      {
        id: number;
        title: string;
        image: string;
        usedIngredients: { name: string }[];
        missedIngredients: { name: string }[];
      }[]
    >(`/recipes/findByIngredients?ingredients=${list}&number=15&ranking=2&ignorePantry=true`);
    if (!data) return [];
    return data.map((r) =>
      summaryFrom(r.id, r.title, r.image, [
        ...r.usedIngredients.map((i) => i.name),
        ...r.missedIngredients.map((i) => i.name),
      ]),
    );
  },

  async findByCuisine(cuisine) {
    if (!isSpoonacularConfigured) return [];
    const c = CUISINE[cuisine.toUpperCase()];
    if (!c) return [];
    const data = await getJSON<{
      results: { id: number; title: string; image: string; extendedIngredients?: SpoonIngredient[] }[];
    }>(
      `/recipes/complexSearch?cuisine=${encodeURIComponent(c)}&number=15&addRecipeInformation=true&fillIngredients=true`,
    );
    if (!data?.results) return [];
    return data.results.map((r) =>
      summaryFrom(r.id, r.title, r.image, (r.extendedIngredients ?? []).map((i) => i.name)),
    );
  },

  async getRecipe(id) {
    if (!isSpoonacularConfigured) return null;
    const realId = id.startsWith(PREFIX) ? id.slice(PREFIX.length) : id;
    if (detailCache.has(realId)) return detailCache.get(realId)!;

    const data = await getJSON<{
      id: number;
      title: string;
      image: string;
      extendedIngredients?: SpoonIngredient[];
      instructions?: string;
      analyzedInstructions?: { steps: { step: string }[] }[];
    }>(`/recipes/${encodeURIComponent(realId)}/information`);

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
