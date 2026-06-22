import { Ingredient, IngredientStatus } from '@/data/kitchen';
import { CURRENT_USER_ID, isSupabaseConfigured, supabase } from '@/lib/supabase';

const uid = CURRENT_USER_ID;

type InventoryRow = {
  user_id: string;
  id: string;
  name: string;
  emoji: string;
  status: string | null;
  low_stock: boolean;
  category: string;
};

const toRow = (i: Ingredient): InventoryRow => ({
  user_id: uid,
  id: i.id,
  name: i.name,
  emoji: i.emoji,
  status: i.status ?? null,
  low_stock: !!i.lowStock,
  category: i.category,
});

const fromRow = (r: InventoryRow): Ingredient => ({
  id: r.id,
  name: r.name,
  emoji: r.emoji,
  status: (r.status as IngredientStatus) ?? undefined,
  lowStock: r.low_stock,
  category: r.category as Ingredient['category'],
});

export type ServerState = {
  inventory: Ingredient[];
  savedRecipeIds: string[];
  groceryChecked: Record<string, boolean>;
};

/** Read the full dataset for the current user, or null if not configured/empty. */
export async function fetchAll(): Promise<ServerState | null> {
  if (!isSupabaseConfigured) return null;

  const [inv, saved, grocery] = await Promise.all([
    supabase.from('inventory').select('*').eq('user_id', uid),
    supabase.from('saved_recipes').select('recipe_id').eq('user_id', uid),
    supabase.from('grocery_checked').select('item_id, checked').eq('user_id', uid),
  ]);

  if (inv.error) throw inv.error;
  if (saved.error) throw saved.error;
  if (grocery.error) throw grocery.error;

  // No inventory rows yet → treat as an unseeded server.
  if (!inv.data || inv.data.length === 0) return null;

  return {
    inventory: (inv.data as InventoryRow[]).map(fromRow),
    savedRecipeIds: (saved.data ?? []).map((r) => r.recipe_id),
    groceryChecked: Object.fromEntries(
      (grocery.data ?? []).map((r) => [r.item_id, r.checked]),
    ),
  };
}

/** Seed an empty server with the given starting state. */
export async function seed(state: ServerState): Promise<void> {
  if (!isSupabaseConfigured) return;
  await supabase.from('inventory').upsert(state.inventory.map(toRow));
  if (state.savedRecipeIds.length) {
    await supabase
      .from('saved_recipes')
      .upsert(state.savedRecipeIds.map((recipe_id) => ({ user_id: uid, recipe_id })));
  }
}

export async function upsertItems(items: Ingredient[]): Promise<void> {
  if (!isSupabaseConfigured || items.length === 0) return;
  const { error } = await supabase.from('inventory').upsert(items.map(toRow));
  if (error) throw error;
}

export async function setSaved(recipeId: string, saved: boolean): Promise<void> {
  if (!isSupabaseConfigured) return;
  if (saved) {
    await supabase.from('saved_recipes').upsert({ user_id: uid, recipe_id: recipeId });
  } else {
    await supabase
      .from('saved_recipes')
      .delete()
      .eq('user_id', uid)
      .eq('recipe_id', recipeId);
  }
}

export async function setGroceryChecked(itemId: string, checked: boolean): Promise<void> {
  if (!isSupabaseConfigured) return;
  await supabase
    .from('grocery_checked')
    .upsert({ user_id: uid, item_id: itemId, checked });
}
