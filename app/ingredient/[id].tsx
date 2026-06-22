import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/screen';
import { Colors, Fonts } from '@/constants/theme';
import { freshnessOf, Ingredient, INGREDIENT_DETAILS, INGREDIENTS } from '@/data/kitchen';
import { useKitchen } from '@/store/kitchen-store';

const SEED_META = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));

const ABUNDANCE_WORD = { high: 'Abundant', medium: 'Moderate', low: 'Running low' } as const;

/** Derive the displayed status/expiration from the item's real state, falling
 *  back to any curated detail (e.g. steak's purchase history). */
function describe(item: Ingredient | undefined, id?: string) {
  const curated = id ? INGREDIENT_DETAILS[id] : undefined;
  const out = item?.status === 'out';
  const expired = freshnessOf(item ?? ({} as Ingredient)) === 'expired';
  const daysLeft = item?.daysLeft ?? (id ? SEED_META[id]?.daysLeft : undefined);
  const abundance = item?.abundance ?? (id ? SEED_META[id]?.abundance : undefined);

  const status = out
    ? 'Out of stock'
    : expired
      ? 'Expired'
      : (curated?.status ?? (abundance ? ABUNDANCE_WORD[abundance] : 'In stock'));

  const expiration = out
    ? '—'
    : daysLeft !== undefined && daysLeft <= 0
      ? 'Expired'
      : (curated?.expiration ??
        (daysLeft !== undefined ? `~${daysLeft} day${daysLeft === 1 ? '' : 's'} left` : '—'));

  return {
    status,
    expiration,
    purchased: curated?.purchased ?? 'no purchase history yet',
    pastUses: curated?.pastUses ?? 'No past uses recorded.',
    alert: out || expired,
  };
}

function Field({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <View style={styles.field}>
      <View style={styles.labelWrap}>
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={[styles.value, alert && { color: Colors.danger }]}>{value}</Text>
    </View>
  );
}

export default function IngredientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ingredient = useKitchen((s) => s.inventory.find((i) => i.id === id));
  const detail = describe(ingredient, id);

  const name = (ingredient?.name ?? SEED_META[id ?? '']?.name ?? 'ingredient').toUpperCase();
  const spaced = name.split('').join(' ');

  return (
    <Screen showBack>
      <Text style={styles.title}>{spaced}</Text>
      <Text style={styles.purchased}>{detail.purchased}</Text>

      <View style={styles.fields}>
        <Field label="Status:" value={detail.status} alert={detail.alert} />
        <View style={styles.divider} />
        <Field label="Expiration Date:" value={detail.expiration} alert={detail.alert} />
        <View style={styles.divider} />
        <Field label="Past Uses:" value={detail.pastUses} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: Fonts.serif,
    fontSize: 36,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 24,
  },
  purchased: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 8,
  },
  fields: { marginTop: 48, alignItems: 'center', gap: 8 },
  field: { alignItems: 'center', marginVertical: 8 },
  labelWrap: {
    backgroundColor: Colors.yellow,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
  },
  label: { fontFamily: Fonts.sansMedium, fontSize: 24, color: Colors.text },
  value: {
    fontFamily: Fonts.sansMedium,
    fontSize: 28,
    color: Colors.text,
    textAlign: 'center',
  },
  divider: { width: 64, height: 1, backgroundColor: Colors.text, marginVertical: 12 },
});
