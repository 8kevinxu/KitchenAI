import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '@/components/screen';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { RECIPES } from '@/data/kitchen';
import { getRecipeDetail } from '@/lib/recipes';
import { useKitchen } from '@/store/kitchen-store';

/** Unified shape both local recipes and provider recipes render through. */
type Display = {
  id: string;
  title: string;
  groups: { heading?: string; items: string[] }[];
  directions: string[];
  ingredientNames: string[];
};

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

  const saved = useKitchen((s) => (display ? s.savedRecipeIds.includes(display.id) : false));
  const toggleSaved = useKitchen((s) => s.toggleSaved);
  const consumeIngredients = useKitchen((s) => s.consumeIngredients);

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

          <View style={styles.ingredientBlock}>
            {display.groups.map((group, gi) => (
              <View key={group.heading ?? gi} style={styles.group}>
                {group.heading && <Text style={styles.groupHeading}>{group.heading}</Text>}
                {group.items.map((item, ii) => (
                  <Text key={`${item}-${ii}`} style={styles.groupItem}>
                    {item}
                  </Text>
                ))}
              </View>
            ))}
          </View>

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

  ingredientBlock: { paddingLeft: 4, paddingRight: 56 },
  group: { marginBottom: 18 },
  groupHeading: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 17,
    color: Colors.text,
    textDecorationLine: 'underline',
    marginBottom: 4,
  },
  groupItem: {
    fontFamily: Fonts.sans,
    fontSize: 17,
    color: Colors.text,
    lineHeight: 28,
    paddingLeft: 8,
  },

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

  backToIngredients: { alignSelf: 'center', marginTop: 18 },
  backToIngredientsText: { fontFamily: Fonts.serifItalic, fontSize: 13, color: Colors.muted },
});
