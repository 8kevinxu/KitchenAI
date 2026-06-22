import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '@/components/screen';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { RECIPES, SAVED_RECIPE_IDS } from '@/data/kitchen';

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
  const recipe = RECIPES.find((r) => r.id === id) ?? RECIPES[0];

  const [tab, setTab] = useState<'ingredients' | 'directions'>('ingredients');
  const [saved, setSaved] = useState(SAVED_RECIPE_IDS.includes(recipe.id));

  return (
    <Screen showBack>
      <Text style={styles.title}>{recipe.title}</Text>

      {tab === 'ingredients' ? (
        <View style={styles.body}>
          <SectionLabel>Ingredients</SectionLabel>

          <View style={styles.ingredientBlock}>
            {recipe.ingredients.map((group) => (
              <View key={group.heading} style={styles.group}>
                <Text style={styles.groupHeading}>{group.heading}</Text>
                {group.items.map((item) => (
                  <Text key={item} style={styles.groupItem}>
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
            {recipe.directions.map((step, i) => (
              <View key={i} style={styles.step}>
                <Text style={styles.stepNum}>{i + 1}.</Text>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.actionPill, styles.savePill]}
            activeOpacity={0.85}
            onPress={() => setSaved((s) => !s)}>
            <Text style={styles.savePillText}>
              {saved ? 'RECIPE SAVED' : 'SAVE THIS RECIPE'}
            </Text>
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={Colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionPill, styles.updatePill]} activeOpacity={0.85}>
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
    fontSize: 44,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 20,
  },
  body: { flex: 1, marginTop: 16 },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 18,
  },
  dash: { width: 16, height: 1, backgroundColor: Colors.text },
  sectionLabel: { fontFamily: Fonts.sansMedium, fontSize: 20, color: Colors.text },

  ingredientBlock: { paddingLeft: 4 },
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
