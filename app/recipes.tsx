import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '@/components/screen';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { recommendRecipes, RankedRecipe } from '@/lib/recipes';
import { useKitchen } from '@/store/kitchen-store';

export default function RecipesScreen() {
  const inventory = useKitchen((s) => s.inventory);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [recipes, setRecipes] = useState<RankedRecipe[]>([]);

  useEffect(() => {
    let active = true;
    setStatus('loading');
    const names = inventory.map((i) => i.name);
    recommendRecipes(names)
      .then((r) => {
        if (!active) return;
        setRecipes(r);
        setStatus('ready');
      })
      .catch(() => active && setStatus('error'));
    return () => {
      active = false;
    };
  }, [inventory]);

  return (
    <Screen showBack>
      <Text style={styles.intro}>
        Recommended recipes based on your ingredients and preferences...
      </Text>

      {status === 'ready' && (
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
            No matches yet — add a few more ingredients to your inventory.
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
                uses {recipe.used.length} of your ingredients
                {recipe.missing.length > 0
                  ? ` · missing ${recipe.missing.length}`
                  : ' · ready to cook'}
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
