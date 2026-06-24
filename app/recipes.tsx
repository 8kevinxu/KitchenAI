import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Screen } from '@/components/screen';
import { Colors, Fonts, Radius } from '@/constants/theme';
import {
  recommendByCuisine,
  recommendRecipes,
  recommendUsingIngredients,
  RankedRecipe,
  RecipeFilters,
} from '@/lib/recipes';
import { comingUp, needsAttention, withFreshness } from '@/data/kitchen';
import { useKitchen } from '@/store/kitchen-store';

type ChipKey = 'vegetarian' | 'vegan' | 'glutenFree' | 'dairyFree' | 'quick';

const CHIPS: { key: ChipKey; label: string }[] = [
  { key: 'vegetarian', label: 'Vegetarian' },
  { key: 'vegan', label: 'Vegan' },
  { key: 'glutenFree', label: 'Gluten-free' },
  { key: 'dairyFree', label: 'Dairy-free' },
  { key: 'quick', label: 'Quick' },
];

/** Turn the selected chips into provider filters. */
function chipsToFilters(active: Set<ChipKey>): RecipeFilters {
  const f: RecipeFilters = {};
  if (active.has('vegan')) f.diet = 'vegan';
  else if (active.has('vegetarian')) f.diet = 'vegetarian';
  const intolerances: string[] = [];
  if (active.has('glutenFree')) intolerances.push('gluten');
  if (active.has('dairyFree')) intolerances.push('dairy');
  if (intolerances.length) f.intolerances = intolerances;
  if (active.has('quick')) f.maxReadyTime = 30;
  return f;
}

export default function RecipesScreen() {
  const { cuisine, use } = useLocalSearchParams<{ cuisine?: string; use?: string }>();
  const inventory = useKitchen((s) => s.inventory);
  const dismissedExpiry = useKitchen((s) => s.dismissedExpiry);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [recipes, setRecipes] = useState<RankedRecipe[]>([]);
  const [active, setActive] = useState<Set<ChipKey>>(new Set());

  const expiringMode = use === 'expiring';

  // The bundle of expiring items to cook from — matches the /expiring screen.
  const targets = useMemo(() => {
    if (!expiringMode) return [];
    const skip = new Set(dismissedExpiry);
    return inventory
      .map(withFreshness)
      .filter((i) => !skip.has(i.id) && (needsAttention(i) || comingUp(i)))
      .map((i) => i.name);
  }, [expiringMode, inventory, dismissedExpiry]);
  const targetsKey = targets.join(',');

  const filters = useMemo(() => chipsToFilters(active), [active]);
  const filtered = active.size > 0;
  // Stable dependency so the effect re-runs only when filters actually change.
  const filterKey = JSON.stringify(filters);

  const toggleChip = (key: ChipKey) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
        // Vegetarian and Vegan are mutually exclusive.
        if (key === 'vegetarian') next.delete('vegan');
        if (key === 'vegan') next.delete('vegetarian');
      }
      return next;
    });

  useEffect(() => {
    let isActive = true;
    setStatus('loading');
    const names = inventory.map((i) => i.name);
    const request = expiringMode
      ? recommendUsingIngredients(targets, names, 20, filters)
      : cuisine
        ? recommendByCuisine(cuisine, names, 30, filters)
        : recommendRecipes(names, 20, filters);
    request
      .then((r) => {
        if (!isActive) return;
        setRecipes(r);
        setStatus('ready');
      })
      .catch(() => isActive && setStatus('error'));
    return () => {
      isActive = false;
    };
  }, [inventory, cuisine, filterKey, expiringMode, targetsKey]);

  const title = expiringMode
    ? 'Recipes to use up your expiring items'
    : cuisine
      ? `${cuisine} dishes you can make with your ingredients`
      : 'Recommended recipes based on your ingredients and preferences...';

  return (
    <Screen showBack>
      <Text style={styles.intro}>{title}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipBar}
        style={styles.chipScroll}>
        {CHIPS.map(({ key, label }) => {
          const on = active.has(key);
          return (
            <TouchableOpacity
              key={key}
              style={[styles.chip, on && styles.chipOn]}
              activeOpacity={0.8}
              onPress={() => toggleChip(key)}>
              {on && <Ionicons name="checkmark" size={13} color={Colors.text} />}
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {status === 'ready' && recipes.length > 0 && (
        <View style={styles.legend}>
          <Ionicons name="information-circle-outline" size={14} color={Colors.text} />
          <Text style={styles.legendText}>missing ingredient(s)</Text>
        </View>
      )}

      {status === 'loading' && (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.text} />
          <Text style={styles.centerText}>Finding dishes you can cook…</Text>
        </View>
      )}

      {status === 'error' && (
        <View style={styles.center}>
          <Text style={styles.centerText}>
            Couldn’t reach the recipe service. Check your connection and try again.
          </Text>
        </View>
      )}

      {status === 'ready' && recipes.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.centerText}>
            {expiringMode
              ? 'No recipes for your expiring items right now.'
              : filtered
                ? 'No recipes match these filters — try removing one.'
                : cuisine
                  ? `No ${cuisine.toLowerCase()} recipes in our recipe base yet — more are coming as we add sources.`
                  : 'No matches yet — add a few more ingredients to your inventory.'}
          </Text>
        </View>
      )}

      {status === 'ready' &&
        recipes.map((recipe) => (
          <TouchableOpacity
            key={recipe.id}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() =>
              router.push({ pathname: '/recipe/[id]', params: { id: recipe.id } })
            }>
            <Image source={{ uri: recipe.image }} style={styles.cardImage} contentFit="cover" />
            <View style={styles.cardOverlay} />
            {recipe.missing.length > 0 && (
              <View style={styles.cardBadge}>
                <Ionicons name="information-circle-outline" size={20} color={Colors.text} />
              </View>
            )}
            <Text style={styles.cardTitle}>{recipe.title}</Text>
            <View style={styles.cardMeta}>
              <Text style={styles.metaText}>
                {expiringMode && recipe.usedExpiring
                  ? `uses ${recipe.usedExpiring.length} expiring item${
                      recipe.usedExpiring.length === 1 ? '' : 's'
                    }${recipe.missing.length > 0 ? ` · missing ${recipe.missing.length}` : ''}`
                  : `uses ${recipe.used.length} of your ingredients${
                      recipe.missing.length > 0
                        ? ` · missing ${recipe.missing.length}`
                        : ' · ready to cook'
                    }`}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    fontFamily: Fonts.serifItalic,
    fontSize: 17,
    color: Colors.text,
    marginTop: 4,
    marginBottom: 8,
  },
  chipScroll: { flexGrow: 0, marginBottom: 14 },
  chipBar: { gap: 8, paddingRight: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.field,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    height: 32,
  },
  chipOn: { backgroundColor: Colors.yellow, borderColor: Colors.yellow },
  chipText: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.muted },
  chipTextOn: { color: Colors.text },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 16 },
  legendText: { fontFamily: Fonts.serifItalic, fontSize: 11, color: Colors.text },
  center: { alignItems: 'center', paddingTop: 80, gap: 14 },
  centerText: {
    fontFamily: Fonts.serifItalic,
    fontSize: 15,
    color: Colors.muted,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  card: {
    minHeight: 176,
    borderRadius: Radius.card,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginBottom: 24,
  },
  cardImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.20)',
  },
  cardBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 12,
  },
  cardTitle: {
    fontFamily: Fonts.serifBold,
    fontSize: 30,
    color: Colors.text,
    paddingHorizontal: 16,
    textShadowColor: 'rgba(255,255,255,0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  cardMeta: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.yellow,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 14,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  metaText: { fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.text },
});
