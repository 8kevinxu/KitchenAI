import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  Ingredient,
  INGREDIENTS,
  SAVED_RECIPE_IDS,
  SCANNED_ITEMS,
} from '@/data/kitchen';
import * as api from '@/lib/api';
import { ParsedItem } from '@/lib/scan';

const warn = (e: unknown) => console.warn('[kitchen-store] supabase sync failed', e);

export type GroceryItem = {
  id: string;
  name: string;
  emoji: string;
  /** Title of the recipe this item was added for, if any. */
  recipe?: string;
};

type KitchenState = {
  /** Current pantry inventory. */
  inventory: Ingredient[];
  /** Saved recipe ids. */
  savedRecipeIds: string[];
  /** Grocery items selected for the shared list. Absent id = selected (default on). */
  groceryChecked: Record<string, boolean>;
  /** User-added grocery items (not auto-detected from inventory). */
  customGrocery: GroceryItem[];
  /** Ids of auto-generated grocery items the user removed from the list. */
  dismissedGrocery: string[];
  /** Ids of items the user dismissed from the expiry alert (acknowledged, keeping). */
  dismissedExpiry: string[];
  /** True once persisted state has been read from disk. */
  hasHydrated: boolean;
  /** True once we've reconciled with Supabase (or confirmed it's unconfigured). */
  serverSynced: boolean;

  isSaved: (id: string) => boolean;
  toggleSaved: (id: string) => void;
  /** An item is selected for the shared list unless explicitly turned off. */
  isGrocerySelected: (id: string) => boolean;
  toggleGrocery: (id: string) => void;
  /** Add a custom grocery item (selected by default), optionally tagged with
   *  the recipe it's for. */
  addGroceryItem: (name: string, recipe?: string) => void;
  /** Remove an item from the grocery list (dismiss auto item or delete custom). */
  removeGroceryItem: (id: string) => void;
  /** Simulate a receipt scan: add any not-yet-stocked items. Returns count added. */
  addScannedItems: () => number;
  /** Parsed items awaiting review after a receipt scan (transient, not persisted). */
  pendingScan: ParsedItem[];
  setPendingScan: (items: ParsedItem[]) => void;
  /** Add reviewed items to inventory, merging with anything already on hand. */
  addInventoryItems: (items: Ingredient[]) => void;
  /** Mark on-hand ingredients used by a cooked recipe as running low. */
  consumeIngredients: (ingredientNames: string[]) => void;
  /** Mark a single item as used up / tossed — goes out of stock (and onto the
   *  grocery list as out). Clears it from the expiry alert. */
  markUsedUp: (id: string) => void;
  /** Acknowledge an expiring item without changing stock (hide the nudge). */
  dismissExpiringAlert: (id: string) => void;
  /** Pull from Supabase on launch; seed the server if it's empty. */
  syncFromServer: () => Promise<void>;
  /** Restore the seeded demo inventory and clear progress. */
  resetAll: () => void;
};

const seed = () => ({
  inventory: INGREDIENTS.map((i) => ({ ...i })),
  savedRecipeIds: [...SAVED_RECIPE_IDS],
  groceryChecked: {} as Record<string, boolean>,
  customGrocery: [] as GroceryItem[],
  dismissedGrocery: [] as string[],
  dismissedExpiry: [] as string[],
});

export const useKitchen = create<KitchenState>()(
  persist(
    (set, get) => ({
      ...seed(),
      hasHydrated: false,
      serverSynced: false,
      pendingScan: [],

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

      isGrocerySelected: (id) => get().groceryChecked[id] !== false,

      toggleGrocery: (id) => {
        const next = !(get().groceryChecked[id] !== false);
        set((s) => ({ groceryChecked: { ...s.groceryChecked, [id]: next } }));
        api.setGroceryChecked(id, next).catch(warn);
      },

      addGroceryItem: (name, recipe) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const item: GroceryItem = {
          id: `custom:${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: trimmed,
          emoji: '🛒',
          ...(recipe ? { recipe } : {}),
        };
        set((s) => ({ customGrocery: [...s.customGrocery, item] }));
      },

      removeGroceryItem: (id) => {
        set((s) => {
          const groceryChecked = { ...s.groceryChecked };
          delete groceryChecked[id];
          return id.startsWith('custom:')
            ? { customGrocery: s.customGrocery.filter((i) => i.id !== id), groceryChecked }
            : { dismissedGrocery: [...new Set([...s.dismissedGrocery, id])], groceryChecked };
        });
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

      setPendingScan: (items) => set({ pendingScan: items }),

      addInventoryItems: (items) => {
        const changed: Ingredient[] = [];
        set((s) => {
          const byId = new Map(s.inventory.map((i) => [i.id, i]));
          for (const it of items) {
            const existing = byId.get(it.id);
            // Re-stocking an item we already have: mark fresh, clear low/out flags.
            const merged = existing
              ? { ...existing, status: 'new' as const, lowStock: false }
              : it;
            byId.set(it.id, merged);
            changed.push(merged);
          }
          return { inventory: [...byId.values()] };
        });
        api.upsertItems(changed).catch(warn);
      },

      consumeIngredients: (ingredientNames) => {
        const text = ingredientNames.join(' ').toLowerCase();
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

      markUsedUp: (id) => {
        let changed: Ingredient | undefined;
        set((s) => ({
          inventory: s.inventory.map((it) => {
            if (it.id !== id) return it;
            changed = { ...it, status: 'out' as const, lowStock: false };
            return changed;
          }),
          // It's been handled, so drop any lingering "keep" dismissal.
          dismissedExpiry: s.dismissedExpiry.filter((x) => x !== id),
        }));
        if (changed) api.upsertItems([changed]).catch(warn);
      },

      dismissExpiringAlert: (id) =>
        set((s) => ({ dismissedExpiry: [...new Set([...s.dismissedExpiry, id])] })),

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
      partialize: ({
        inventory,
        savedRecipeIds,
        groceryChecked,
        customGrocery,
        dismissedGrocery,
        dismissedExpiry,
      }) => ({
        inventory,
        savedRecipeIds,
        groceryChecked,
        customGrocery,
        dismissedGrocery,
        dismissedExpiry,
      }),
      onRehydrateStorage: () => () => {
        useKitchen.setState({ hasHydrated: true });
      },
    },
  ),
);
