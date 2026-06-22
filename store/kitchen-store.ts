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

type KitchenState = {
  /** Current pantry inventory. */
  inventory: Ingredient[];
  /** Saved recipe ids. */
  savedRecipeIds: string[];
  /** Which grocery-list items have been checked off. */
  groceryChecked: Record<string, boolean>;
  /** True once persisted state has been read from disk. */
  hasHydrated: boolean;

  isSaved: (id: string) => boolean;
  toggleSaved: (id: string) => void;
  toggleGrocery: (id: string) => void;
  /** Simulate a receipt scan: add any not-yet-stocked items. Returns count added. */
  addScannedItems: () => number;
  /** Mark a cooked recipe's on-hand ingredients as running low. */
  consumeRecipe: (recipeId: string) => void;
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

      isSaved: (id) => get().savedRecipeIds.includes(id),

      toggleSaved: (id) =>
        set((s) => ({
          savedRecipeIds: s.savedRecipeIds.includes(id)
            ? s.savedRecipeIds.filter((x) => x !== id)
            : [...s.savedRecipeIds, id],
        })),

      toggleGrocery: (id) =>
        set((s) => ({
          groceryChecked: { ...s.groceryChecked, [id]: !s.groceryChecked[id] },
        })),

      addScannedItems: () => {
        const have = new Set(get().inventory.map((i) => i.id));
        const additions = SCANNED_ITEMS.filter((i) => !have.has(i.id));
        if (additions.length) {
          set((s) => ({ inventory: [...s.inventory, ...additions.map((i) => ({ ...i }))] }));
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
        set((s) => ({
          inventory: s.inventory.map((item) =>
            text.includes(item.name.toLowerCase())
              ? { ...item, lowStock: true }
              : item,
          ),
        }));
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
