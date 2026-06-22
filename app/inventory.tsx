import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Screen } from '@/components/screen';
import { Colors, Fonts, Radius } from '@/constants/theme';
import {
  abundanceLevel,
  CATEGORY_ORDER,
  Freshness,
  freshnessOf,
  Ingredient,
  INGREDIENTS,
  useSoon,
} from '@/data/kitchen';
import { useKitchen } from '@/store/kitchen-store';

// Freshness/abundance aren't persisted to the backend yet, so fall back to the
// seed metadata by id. (Until receipt scanning supplies real dates/quantities.)
const SEED_META = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));
const enrich = (i: Ingredient): Ingredient => ({
  ...i,
  daysLeft: i.daysLeft ?? SEED_META[i.id]?.daysLeft,
  abundance: i.abundance ?? SEED_META[i.id]?.abundance,
});

// Toggle to compare visual treatments:
//   'A' = freshness dot + abundance meter (color-forward, minimal text)
//   'B' = freshness ring + days-left label + abundance pips (explicit)
const VARIANT: 'A' | 'B' = 'A';

const FRESH_COLOR: Record<Freshness, string> = {
  fresh: Colors.fresh,
  soon: Colors.soon,
  expiring: Colors.expiring,
  expired: Colors.expiring,
};

const daysLabel = (item: Ingredient) => {
  if (item.daysLeft === undefined) return '';
  if (item.daysLeft <= 0) return 'exp';
  return `${item.daysLeft}d`;
};

/** Three-segment bar: filled segments = abundance level. */
function AbundanceMeter({ level }: { level: number }) {
  return (
    <View style={styles.meter}>
      {[1, 2, 3].map((n) => (
        <View
          key={n}
          style={[styles.meterSeg, n <= level ? styles.meterOn : styles.meterOff]}
        />
      ))}
    </View>
  );
}

function Pips({ level }: { level: number }) {
  return (
    <View style={styles.pips}>
      {[1, 2, 3].map((n) => (
        <View key={n} style={[styles.pip, n <= level ? styles.pipOn : styles.pipOff]} />
      ))}
    </View>
  );
}

function IngredientCell({ item }: { item: Ingredient }) {
  const out = item.status === 'out';
  const fresh = freshnessOf(item);
  const level = abundanceLevel(item.abundance);
  const showDays = fresh === 'soon' || fresh === 'expiring' || fresh === 'expired';

  return (
    <TouchableOpacity
      style={styles.cell}
      activeOpacity={0.7}
      onPress={() => router.push(`/ingredient/${item.id}`)}>
      <Text style={styles.cellName} numberOfLines={2}>
        {item.name}
      </Text>

      <View
        style={[
          styles.iconWrap,
          VARIANT === 'B' && fresh && { borderWidth: 2.5, borderColor: FRESH_COLOR[fresh] },
        ]}>
        <Text style={[styles.cellEmoji, out && styles.emojiOut]}>{item.emoji}</Text>
        {VARIANT === 'A' && fresh && (
          <View style={[styles.freshDot, { backgroundColor: FRESH_COLOR[fresh] }]} />
        )}
      </View>

      {out ? (
        <Text style={styles.outTag}>OUT</Text>
      ) : VARIANT === 'A' ? (
        <AbundanceMeter level={level} />
      ) : (
        <>
          {showDays && (
            <Text style={[styles.daysLabel, { color: FRESH_COLOR[fresh!] }]}>
              {daysLabel(item)}
            </Text>
          )}
          <Pips level={level} />
        </>
      )}
    </TouchableOpacity>
  );
}

function UseSoonStrip({ items }: { items: Ingredient[] }) {
  if (items.length === 0) return null;
  return (
    <View style={styles.useSoon}>
      <Text style={styles.useSoonTitle}>USE SOON</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {items.map((item) => {
          const fresh = freshnessOf(item)!;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.chip, { borderLeftColor: FRESH_COLOR[fresh] }]}
              activeOpacity={0.7}
              onPress={() => router.push(`/ingredient/${item.id}`)}>
              <Text style={styles.chipEmoji}>{item.emoji}</Text>
              <View>
                <Text style={styles.chipName}>{item.name}</Text>
                <Text style={[styles.chipDays, { color: FRESH_COLOR[fresh] }]}>
                  {item.daysLeft! <= 0 ? 'expired' : `${item.daysLeft}d left`}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function InventoryScreen() {
  const [query, setQuery] = useState('');
  const rawInventory = useKitchen((s) => s.inventory);
  const inventory = useMemo(() => rawInventory.map(enrich), [rawInventory]);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATEGORY_ORDER.map((category) => ({
      category,
      items: inventory.filter(
        (i) => i.category === category && (!q || i.name.includes(q)),
      ),
    })).filter((g) => g.items.length > 0);
  }, [query, inventory]);

  const soon = useMemo(() => useSoon(inventory), [inventory]);
  const summary = useMemo(() => {
    const expiring = inventory.filter((i) => {
      const f = freshnessOf(i);
      return f === 'expiring' || f === 'expired';
    }).length;
    const low = inventory.filter((i) => i.abundance === 'low').length;
    const out = inventory.filter((i) => i.status === 'out').length;
    return { expiring, low, out };
  }, [inventory]);

  return (
    <Screen showBack>
      <Text style={styles.title}>INGREDIENTS</Text>
      <Text style={styles.summary}>
        <Text style={{ color: Colors.expiring }}>{summary.expiring} expiring</Text>
        {'  ·  '}
        <Text style={{ color: Colors.soon }}>{summary.low} running low</Text>
        {'  ·  '}
        {summary.out} out
      </Text>

      <View style={styles.search}>
        <Ionicons name="search" size={15} color={Colors.muted} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
      </View>

      {!query && <UseSoonStrip items={soon} />}

      {grouped.map(({ category, items }) => (
        <View key={category} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryLabel}>{category.toUpperCase()}</Text>
            </View>
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
  title: { fontFamily: Fonts.sansMedium, fontSize: 28, color: Colors.text, marginTop: 8 },
  summary: { fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.text, marginTop: 4, marginBottom: 14 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.field,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    height: 30,
  },
  searchInput: { flex: 1, fontFamily: Fonts.sans, fontSize: 14, padding: 0 },

  useSoon: { marginTop: 16 },
  useSoonTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 12, color: Colors.muted, marginBottom: 8, letterSpacing: 0.5 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F6F6F4',
    borderLeftWidth: 4,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  chipEmoji: { fontSize: 22 },
  chipName: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.text },
  chipDays: { fontFamily: Fonts.sansMedium, fontSize: 11 },

  section: { marginTop: 22 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  categoryPill: { backgroundColor: Colors.yellow, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  categoryLabel: { fontFamily: Fonts.sansMedium, fontSize: 15, color: Colors.text },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '20%', alignItems: 'center', marginBottom: 18 },
  cellName: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.text, marginBottom: 4, textAlign: 'center' },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  cellEmoji: { fontSize: 28 },
  emojiOut: { opacity: 0.3 },
  freshDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.background,
  },

  meter: { flexDirection: 'row', gap: 2, marginTop: 5 },
  meterSeg: { width: 7, height: 4, borderRadius: 2 },
  meterOn: { backgroundColor: Colors.text },
  meterOff: { backgroundColor: Colors.field },

  pips: { flexDirection: 'row', gap: 3, marginTop: 4 },
  pip: { width: 5, height: 5, borderRadius: 3 },
  pipOn: { backgroundColor: Colors.text },
  pipOff: { backgroundColor: Colors.field },

  daysLabel: { fontFamily: Fonts.sansBold, fontSize: 10, marginTop: 3 },
  outTag: { fontFamily: Fonts.sansBold, fontSize: 11, color: Colors.danger, marginTop: 4 },
});
