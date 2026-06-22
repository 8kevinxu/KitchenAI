import { RecipeDetail, RecipeProvider, RecipeSummary } from '@/lib/recipes/types';

const BASE = 'https://www.themealdb.com/api/json/v1/1';
const PREFIX = 'themealdb:';

// How many inventory ingredients to probe, and how many candidates to expand
// into full recipes — keeps request volume reasonable.
const MAX_PROBES = 10;
const MAX_CANDIDATES = 18;

type FilterMeal = { idMeal: string; strMeal: string; strMealThumb: string };
type LookupMeal = {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
  strInstructions: string;
  strCategory?: string;
  strArea?: string;
  [key: string]: string | undefined;
};

const detailCache = new Map<string, RecipeDetail | null>();

async function getJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function parseIngredients(meal: LookupMeal): { name: string; measure: string }[] {
  const out: { name: string; measure: string }[] = [];
  for (let i = 1; i <= 20; i++) {
    const name = (meal[`strIngredient${i}`] ?? '').trim();
    const measure = (meal[`strMeasure${i}`] ?? '').trim();
    if (name) out.push({ name, measure });
  }
  return out;
}

function toDetail(meal: LookupMeal): RecipeDetail {
  const ingredients = parseIngredients(meal);
  const instructions = (meal.strInstructions ?? '')
    .split(/\r?\n+/)
    .map((s) => s.replace(/^\s*\d+[.)]\s*/, '').trim())
    .filter(Boolean);
  return {
    id: PREFIX + meal.idMeal,
    source: 'themealdb',
    title: meal.strMeal,
    image: meal.strMealThumb,
    ingredientNames: ingredients.map((i) => i.name),
    ingredients,
    instructions,
    category: meal.strCategory,
    area: meal.strArea,
  };
}

export const theMealDb: RecipeProvider = {
  source: 'themealdb',

  async findByIngredients(ingredients) {
    // 1. Probe each ingredient; tally how many of the user's items hit each meal.
    const hits = new Map<string, { meal: FilterMeal; count: number }>();
    const probes = ingredients.slice(0, MAX_PROBES);

    await Promise.all(
      probes.map(async (ing) => {
        const q = encodeURIComponent(ing.trim().replace(/\s+/g, '_'));
        const data = await getJSON<{ meals: FilterMeal[] | null }>(
          `${BASE}/filter.php?i=${q}`,
        );
        for (const meal of data?.meals ?? []) {
          const entry = hits.get(meal.idMeal);
          if (entry) entry.count += 1;
          else hits.set(meal.idMeal, { meal, count: 1 });
        }
      }),
    );

    // 2. Take the best candidates and expand them into full recipes (for the
    //    precise ingredient list the matcher needs).
    const candidates = [...hits.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, MAX_CANDIDATES);

    const detailed = await Promise.all(
      candidates.map((c) => this.getRecipe(PREFIX + c.meal.idMeal)),
    );

    return detailed.filter((r): r is RecipeDetail => r !== null);
  },

  async getRecipe(id) {
    const realId = id.startsWith(PREFIX) ? id.slice(PREFIX.length) : id;
    if (detailCache.has(realId)) return detailCache.get(realId)!;
    const data = await getJSON<{ meals: LookupMeal[] | null }>(
      `${BASE}/lookup.php?i=${encodeURIComponent(realId)}`,
    );
    const meal = data?.meals?.[0] ?? null;
    const detail = meal ? toDetail(meal) : null;
    detailCache.set(realId, detail);
    return detail;
  },
};
