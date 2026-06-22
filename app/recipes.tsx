import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '@/components/screen';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { RECIPES } from '@/data/kitchen';

export default function RecipesScreen() {
  return (
    <Screen showBack>
      <Text style={styles.intro}>
        Recommended recipes based on your ingredients and preferences...
      </Text>

      <View style={styles.legend}>
        <Ionicons name="information-circle-outline" size={14} color={Colors.text} />
        <Text style={styles.legendText}>missing ingredient(s)</Text>
      </View>

      {RECIPES.map((recipe) => (
        <TouchableOpacity
          key={recipe.id}
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => router.push(`/recipe/${recipe.id}`)}>
          <Image source={{ uri: recipe.image }} style={styles.cardImage} contentFit="cover" />
          <View style={styles.cardOverlay} />
          {recipe.missingIngredients && (
            <View style={styles.cardBadge}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.text} />
            </View>
          )}
          <Text style={styles.cardTitle}>{recipe.title}</Text>
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
  card: {
    height: 176,
    borderRadius: Radius.card,
    overflow: 'hidden',
    justifyContent: 'center',
    marginBottom: 24,
  },
  cardImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.18)',
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
    fontSize: 34,
    color: Colors.text,
    paddingHorizontal: 16,
    textShadowColor: 'rgba(255,255,255,0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
