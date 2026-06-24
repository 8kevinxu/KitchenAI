import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '@/components/screen';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { comingUp, needsAttention, RECIPES, withFreshness } from '@/data/kitchen';
import { expiringMatcher, getRecipeDetail, inventoryMatcher } from '@/lib/recipes';
import { useKitchen } from '@/store/kitchen-store';

/** Unified shape both local recipes and provider recipes render through. */
type Display = {
  id: string;
  title: string;
  groups: { heading?: string; items: string[] }[];
  directions: string[];
  ingredientNames: string[];
};

/** Leading quantity units to strip when turning a recipe line into a grocery item. */
const UNIT =
  /^(cups?|tbsps?|tbs|tablespoons?|tsps?|teaspoons?|ounces?|oz|lbs?|pounds?|grams?|g|kg|ml|l|cloves?|pieces?|stalks?|cans?|pinch(?:es)?|dash(?:es)?|sprinkle|drops?|slices?|sticks?|packages?|pkgs?|bunch(?:es)?|handfuls?|of)$/i;

/**
 * Turn a recipe ingredient line ("1/2 cup frozen peas") into a tidy grocery
 * item ("Frozen peas") by stripping leading amounts/units and parentheticals.
 */
function toGroceryName(raw: string): string {
  const words = raw
    .replace(/\([^)]*\)/g, ' ') // drop "(diced)" etc.
    .trim()
    .split(/\s+/);
  while (words.length > 1) {
    const w = words[0].toLowerCase().replace(/[.,]$/, '');
    if (/^[\d¼½¾⅓⅔⅛⅜⅝⅞/.-]+$/.test(w) || UNIT.test(w)) words.shift();
    else break;
  }
  const name = words.join(' ').trim();
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : raw.trim();
}

function SectionLabel({ children }: { children: string }) {
  return (
    <View style={styles.sectionLabelRow}>
      <View style={styles.dash} />
      <Text style={styles.sectionLabel}>{children}</Text>
      <View style={styles.dash} />
    </View>
  );
}

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tab, setTab] = useState<'ingredients' | 'directions'>('ingredients');
  const [display, setDisplay] = useState<Display | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'notfound'>('loading');
  const [groceryAdded, setGroceryAdded] = useState<'idle' | 'added' | 'exists'>('idle');

  const saved = useKitchen((s) => (display ? s.savedRecipeIds.includes(display.id) : false));
  const toggleSaved = useKitchen((s) => s.toggleSaved);
  const consumeIngredients = useKitchen((s) => s.consumeIngredients);
  const inventory = useKitchen((s) => s.inventory);
  const customGrocery = useKitchen((s) => s.customGrocery);
  const addGroceryItem = useKitchen((s) => s.addGroceryItem);

  const hasIngredient = useMemo(
    () => inventoryMatcher(inventory.map((i) => i.name)),
    [inventory],
  );
  // Flag recipe ingredients worth using up first — those whose best inventory
  // match is expiring/expired or coming up soon.
  const isExpiring = useMemo(() => {
    const enriched = inventory.map(withFreshness);
    const expiring = enriched
      .filter((i) => needsAttention(i) || comingUp(i))
      .map((i) => i.name);
    return expiringMatcher(
      enriched.map((i) => i.name),
      expiring,
    );
  }, [inventory]);
  const allItems = useMemo(
    () => (display ? display.groups.flatMap((g) => g.items) : []),
    [display],
  );
  const missingItems = useMemo(
    () => allItems.filter((i) => !hasIngredient(i)),
    [allItems, hasIngredient],
  );
  const haveCount = allItems.length - missingItems.length;
  const totalCount = allItems.length;
  const expiringCount = useMemo(
    () => allItems.filter((i) => isExpiring(i)).length,
    [allItems, isExpiring],
  );

  useEffect(() => {
    let active = true;

    const local = RECIPES.find((r) => r.id === id);
    if (local) {
      setDisplay({
        id: local.id,
        title: local.title,
        groups: local.ingredients,
        directions: local.directions,
        ingredientNames: local.ingredients.flatMap((g) => g.items),
      });
      setStatus('ready');
      return;
    }

    setStatus('loading');
    getRecipeDetail(id)
      .then((d) => {
        if (!active) return;
        if (!d) {
          setStatus('notfound');
          return;
        }
        setDisplay({
          id: d.id,
          title: d.title,
          groups: [{ items: d.ingredients.map((i) => `${i.measure} ${i.name}`.trim()) }],
          directions: d.instructions,
          ingredientNames: d.ingredientNames,
        });
        setStatus('ready');
      })
      .catch(() => active && setStatus('notfound'));

    return () => {
      active = false;
    };
  }, [id]);

  const onAddMissingToGrocery = () => {
    const existing = new Set(customGrocery.map((g) => g.name.trim().toLowerCase()));
    let added = 0;
    for (const item of missingItems) {
      const name = toGroceryName(item);
      const key = name.toLowerCase();
      if (existing.has(key)) continue;
      existing.add(key);
      addGroceryItem(name, display?.title);
      added += 1;
    }
    setGroceryAdded(added ? 'added' : 'exists');
  };

  // Briefly show the "added" confirmation, then return the button to normal.
  useEffect(() => {
    if (groceryAdded === 'idle') return;
    const t = setTimeout(() => setGroceryAdded('idle'), 2500);
    return () => clearTimeout(t);
  }, [groceryAdded]);

  const onUpdateInventory = () => {
    if (display) consumeIngredients(display.ingredientNames);
    Alert.alert(
      'Inventory updated',
      'Ingredients used in this recipe were marked as running low and added to your grocery list.',
    );
  };

  if (status === 'loading') {
    return (
      <Screen showBack>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.text} />
          <Text style={styles.centerText}>Loading recipe…</Text>
        </View>
      </Screen>
    );
  }

  if (status === 'notfound' || !display) {
    return (
      <Screen showBack>
        <View style={styles.center}>
          <Text style={styles.centerText}>Sorry, this recipe couldn’t be loaded.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen showBack>
      <Text style={styles.title}>{display.title}</Text>

      {tab === 'ingredients' ? (
        <View style={styles.body}>
          <SectionLabel>Ingredients</SectionLabel>

          <View style={styles.legend}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.fresh} />
            <Text style={styles.legendText}>in your kitchen</Text>
            <Ionicons
              name="add-circle-outline"
              size={14}
              color={Colors.expiring}
              style={{ marginLeft: 12 }}
            />
            <Text style={styles.legendText}>need to buy</Text>
            {expiringCount > 0 && (
              <>
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={Colors.soon}
                  style={{ marginLeft: 12 }}
                />
                <Text style={styles.legendText}>use soon</Text>
              </>
            )}
            <Text style={styles.haveCount}>
              {haveCount}/{totalCount}
            </Text>
          </View>

          <View style={styles.ingredientBlock}>
            {display.groups.map((group, gi) => (
              <View key={group.heading ?? gi} style={styles.group}>
                {group.heading && <Text style={styles.groupHeading}>{group.heading}</Text>}
                {group.items.map((item, ii) => {
                  const have = hasIngredient(item);
                  const expiring = isExpiring(item);
                  return (
                    <View key={`${item}-${ii}`} style={styles.itemRow}>
                      <Ionicons
                        name={have ? 'checkmark-circle' : 'add-circle-outline'}
                        size={18}
                        color={have ? Colors.fresh : Colors.expiring}
                        style={styles.itemIcon}
                      />
                      <Text style={[styles.groupItem, !have && styles.groupItemMissing]}>
                        {item}
                      </Text>
                      {expiring && (
                        <View style={styles.useSoonTag}>
                          <Ionicons name="time-outline" size={12} color={Colors.soon} />
                          <Text style={styles.useSoonTagText}>use soon</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

          {missingItems.length > 0 &&
            (groceryAdded === 'idle' ? (
              <TouchableOpacity
                style={[styles.actionPill, styles.groceryPill]}
                activeOpacity={0.85}
                onPress={onAddMissingToGrocery}>
                <Ionicons name="cart-outline" size={18} color={Colors.text} />
                <Text style={styles.groceryPillText}>
                  ADD {missingItems.length} MISSING TO GROCERY LIST
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.actionPill, styles.groceryAddedPill]}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.greenText} />
                <Text style={styles.groceryAddedText}>
                  {groceryAdded === 'added'
                    ? 'ADDED TO GROCERY LIST'
                    : 'ALREADY ON YOUR LIST'}
                </Text>
              </View>
            ))}

          <TouchableOpacity
            style={styles.sideTab}
            activeOpacity={0.85}
            onPress={() => setTab('directions')}>
            <Text style={styles.sideTabText}>D I R E C T I O N S</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.body}>
          <SectionLabel>Directions</SectionLabel>

          <View style={styles.directions}>
            {display.directions.map((step, i) => (
              <View key={i} style={styles.step}>
                <Text style={styles.stepNum}>{i + 1}.</Text>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.actionPill, styles.savePill]}
            activeOpacity={0.85}
            onPress={() => toggleSaved(display.id)}>
            <Text style={styles.savePillText}>
              {saved ? 'RECIPE SAVED' : 'SAVE THIS RECIPE'}
            </Text>
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={Colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionPill, styles.updatePill]}
            activeOpacity={0.85}
            onPress={onUpdateInventory}>
            <Text style={styles.updatePillText}>UPDATE YOUR INVENTORY</Text>
            <MaterialCommunityIcons
              name="help-circle-outline"
              size={18}
              color={Colors.greenText}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backToIngredients}
            onPress={() => setTab('ingredients')}>
            <Text style={styles.backToIngredientsText}>← back to ingredients</Text>
          </TouchableOpacity>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: Fonts.serif,
    fontSize: 38,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 20,
  },
  body: { flex: 1, marginTop: 16 },
  center: { alignItems: 'center', paddingTop: 100, gap: 14 },
  centerText: {
    fontFamily: Fonts.serifItalic,
    fontSize: 15,
    color: Colors.muted,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 18,
  },
  dash: { width: 16, height: 1, backgroundColor: Colors.text },
  sectionLabel: { fontFamily: Fonts.sansMedium, fontSize: 20, color: Colors.text },

  legend: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 14 },
  legendText: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.muted },
  haveCount: { fontFamily: Fonts.sansSemiBold, fontSize: 12, color: Colors.text, marginLeft: 'auto' },
  ingredientBlock: { paddingLeft: 4, paddingRight: 56 },
  group: { marginBottom: 18 },
  groupHeading: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 17,
    color: Colors.text,
    textDecorationLine: 'underline',
    marginBottom: 6,
  },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
  itemIcon: { marginTop: 4 },
  groupItem: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 17,
    color: Colors.text,
    lineHeight: 24,
  },
  groupItemMissing: { color: Colors.muted },
  useSoonTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
    marginLeft: 6,
  },
  useSoonTagText: { fontFamily: Fonts.sansMedium, fontSize: 11, color: Colors.soon },

  sideTab: {
    position: 'absolute',
    right: -24,
    top: 120,
    backgroundColor: Colors.yellow,
    width: 45,
    height: 305,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideTabText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.text,
    transform: [{ rotate: '90deg' }],
    width: 200,
    textAlign: 'center',
  },

  directions: { marginBottom: 24 },
  step: { flexDirection: 'row', marginBottom: 10, gap: 8 },
  stepNum: { fontFamily: Fonts.sans, fontSize: 16, color: Colors.text, width: 24 },
  stepText: { flex: 1, fontFamily: Fonts.sans, fontSize: 16, color: Colors.text, lineHeight: 22 },

  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 36,
    borderRadius: Radius.pill,
    alignSelf: 'center',
    paddingHorizontal: 20,
    marginTop: 14,
  },
  savePill: { backgroundColor: Colors.yellow },
  savePillText: { fontFamily: Fonts.sansMedium, fontSize: 15, color: Colors.text },
  updatePill: { backgroundColor: Colors.green },
  updatePillText: { fontFamily: Fonts.sansMedium, fontSize: 15, color: Colors.greenText },
  groceryPill: { backgroundColor: Colors.yellow, marginTop: 8, marginRight: 56 },
  groceryPillText: { fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.text },
  groceryAddedPill: { backgroundColor: Colors.green, marginTop: 8, marginRight: 56 },
  groceryAddedText: { fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.greenText },

  backToIngredients: { alignSelf: 'center', marginTop: 18 },
  backToIngredientsText: { fontFamily: Fonts.serifItalic, fontSize: 13, color: Colors.muted },
});
