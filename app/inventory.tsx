import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Screen } from '@/components/screen';
import { Colors, Fonts, Radius } from '@/constants/theme';
import {
  CATEGORY_ORDER,
  Ingredient,
  INGREDIENTS,
  IngredientStatus,
} from '@/data/kitchen';

const STATUS_LABEL: Record<Exclude<IngredientStatus, 'ok'>, string> = {
  expired: 'EXPIRED',
  out: 'OUT',
  new: 'NEW',
};

function StatusTag({ status }: { status?: IngredientStatus }) {
  if (!status || status === 'ok') return null;
  return <Text style={styles.statusTag}>{STATUS_LABEL[status]}</Text>;
}

function IngredientCell({ item }: { item: Ingredient }) {
  return (
    <TouchableOpacity
      style={styles.cell}
      activeOpacity={0.7}
      onPress={() => router.push(`/ingredient/${item.id}`)}>
      <Text style={styles.cellName} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={styles.cellEmoji}>{item.emoji}</Text>
      <StatusTag status={item.status} />
    </TouchableOpacity>
  );
}

export default function InventoryScreen() {
  const [query, setQuery] = useState('');

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATEGORY_ORDER.map((category) => ({
      category,
      items: INGREDIENTS.filter(
        (i) => i.category === category && (!q || i.name.includes(q)),
      ),
    })).filter((g) => g.items.length > 0);
  }, [query]);

  return (
    <Screen showBack>
      <Text style={styles.title}>INGREDIENTS</Text>

      <View style={styles.search}>
        <Ionicons name="search" size={15} color={Colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder=""
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
      </View>

      {grouped.map(({ category, items }) => (
        <View key={category} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryLabel}>{category.toUpperCase()}</Text>
            </View>
            {category === 'Proteins' && (
              <Text style={styles.updated}>last updated: 3/15/25 at 8:32 pm</Text>
            )}
          </View>
          <View style={styles.grid}>
            {items.map((item) => (
              <IngredientCell key={item.id} item={item} />
            ))}
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: Fonts.sansMedium,
    fontSize: 28,
    color: Colors.text,
    marginTop: 8,
    marginBottom: 14,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.field,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    height: 30,
    marginBottom: 8,
  },
  searchInput: { flex: 1, fontFamily: Fonts.sans, fontSize: 14, padding: 0 },
  section: { marginTop: 22 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  categoryPill: {
    backgroundColor: Colors.yellow,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  categoryLabel: { fontFamily: Fonts.sansMedium, fontSize: 15, color: Colors.text },
  updated: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.text, marginLeft: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '20%', alignItems: 'center', marginBottom: 18 },
  cellName: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.text, marginBottom: 4 },
  cellEmoji: { fontSize: 28 },
  statusTag: {
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    color: Colors.danger,
    marginTop: 2,
  },
});
