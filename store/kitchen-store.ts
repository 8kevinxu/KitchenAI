import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  Ingredient,
  INGREDIENTS,
  RECIPES,
  SAVED_RECIPE_IDS,
  SCANNED_ITEMS,
} from '@/data/kitchen';
import * as api from '@/lib/api';

const warn = (e: unknown) => console.warn('[kitchen-store] supabase sync failed', e);

type KitchenState = {
  /** Current pantry inventory. */
  inventory: Ingredient[];
  /** Saved recipe ids. */
  savedRecipeIds: string[];
  /** Which grocery-list items have been checked off. */
  groceryChecked: Record<string, boolean>;
  /** True once persisted state has been read from disk. */
  hasHydrated: boolean;
  /** True once we've reconciled with Supabase (or confirmed it's unconfigured). */
  serverSynced: boolean;

  isSaved: (id: string) => boolean;
  toggleSaved: (id: string) => void;
  toggleGrocery: (id: string) => void;
  /** Simulate a receipt scan: add any not-yet-stocked items. Returns count added. */
  addScannedItems: () => number;
  /** Mark a cooked recipe's on-hand ingredients as running low. */
  consumeRecipe: (recipeId: string) => void;
  /** Pull from Supabase on launch; seed the server if it's empty. */
  syncFromServer: () => Promise<void>;
  /** Restore the seeded demo inventory and clear progress. */
  resetAll: () => void;
};

const seed = () => ({
  inventory: INGREDIENTS.map((i) => ({ ...i })),
  savedRecipeIds: [...SAVED_RECIPE_IDS],
  groceryChecked: {} as Record<string, boolean>,
});

export const useKitchen = create<KitchenState>()(
  persist(
    (set, get) => ({
      ...seed(),
      hasHydrated: false,
      serverSynced: false,

      isSaved: (id) => get().savedRecipeIds.includes(id),

      toggleSaved: (id) => {
        const willSave = !get().savedRecipeIds.includes(id);
        set((s) => ({
          savedRecipeIds: willSave
            ? [...s.savedRecipeIds, id]
            : s.savedRecipeIds.filter((x) => x !== id),
        }));
        api.setSaved(id, willSave).catch(warn);
      },

      toggleGrocery: (id) => {
        const next = !get().groceryChecked[id];
        set((s) => ({ groceryChecked: { ...s.groceryChecked, [id]: next } }));
        api.setGroceryChecked(id, next).catch(warn);
      },

      addScannedItems: () => {
        const have = new Set(get().inventory.map((i) => i.id));
        const additions = SCANNED_ITEMS.filter((i) => !have.has(i.id)).map((i) => ({ ...i }));
        if (additions.length) {
          set((s) => ({ inventory: [...s.inventory, ...additions] }));
          api.upsertItems(additions).catch(warn);
        }
        return additions.length;
      },

      consumeRecipe: (recipeId) => {
        const recipe = RECIPES.find((r) => r.id === recipeId);
        if (!recipe) return;
        const text = recipe.ingredients
          .flatMap((g) => g.items)
          .join(' ')
          .toLowerCase();
        const changed: Ingredient[] = [];
        set((s) => ({
          inventory: s.inventory.map((item) => {
            if (item.lowStock || !text.includes(item.name.toLowerCase())) return item;
            const next = { ...item, lowStock: true };
            changed.push(next);
            return next;
          }),
        }));
        api.upsertItems(changed).catch(warn);
      },

      syncFromServer: async () => {
        try {
          const server = await api.fetchAll();
          if (server) {
            // Server has data → it's the source of truth.
            set({
              inventory: server.inventory,
              savedRecipeIds: server.savedRecipeIds,
              groceryChecked: server.groceryChecked,
            });
          } else {
            // Configured but empty → seed it from the current local state.
            const { inventory, savedRecipeIds, groceryChecked } = get();
            await api.seed({ inventory, savedRecipeIds, groceryChecked });
          }
        } catch (e) {
          warn(e);
        }
        set({ serverSynced: true });
      },

      resetAll: () => set({ ...seed() }),
    }),
    {
      name: 'kitchen-store',
      // On the server (web static prerender) there is no window/localStorage,
      // so fall back to a no-op store; the real client uses AsyncStorage.
      storage: createJSONStorage(() =>
        typeof window === 'undefined'
          ? {
              getItem: async () => null,
              setItem: async () => {},
              removeItem: async () => {},
            }
          : AsyncStorage,
      ),
      partialize: ({ inventory, savedRecipeIds, groceryChecked }) => ({
        inventory,
        savedRecipeIds,
        groceryChecked,
      }),
      onRehydrateStorage: () => () => {
        useKitchen.setState({ hasHydrated: true });
      },
    },
  ),
);
