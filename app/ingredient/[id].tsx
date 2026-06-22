import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/screen';
import { Colors, Fonts } from '@/constants/theme';
import { INGREDIENT_DETAILS, INGREDIENTS } from '@/data/kitchen';

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <View style={styles.labelWrap}>
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export default function IngredientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ingredient = INGREDIENTS.find((i) => i.id === id);
  const detail =
    (id && INGREDIENT_DETAILS[id]) || {
      status: 'In stock',
      expiration: '—',
      purchased: 'no purchase history yet',
      pastUses: 'No past uses recorded.',
    };

  const name = (ingredient?.name ?? 'ingredient').toUpperCase();
  const spaced = name.split('').join(' ');

  return (
    <Screen showBack>
      <Text style={styles.title}>{spaced}</Text>
      <Text style={styles.purchased}>{detail.purchased}</Text>

      <View style={styles.fields}>
        <Field label="Status:" value={detail.status} />
        <View style={styles.divider} />
        <Field label="Expiration Date:" value={detail.expiration} />
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
