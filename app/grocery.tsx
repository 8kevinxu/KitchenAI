import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '@/components/screen';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { buildGroceryList, Ingredient } from '@/data/kitchen';
import { useKitchen } from '@/store/kitchen-store';

function GroceryRow({
  item,
  checked,
  onToggle,
}: {
  item: Ingredient;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onToggle}>
      <View style={[styles.checkbox, checked && styles.checkboxOn]}>
        {checked && <Ionicons name="checkmark" size={16} color={Colors.text} />}
      </View>
      <Text style={styles.rowEmoji}>{item.emoji}</Text>
      <Text style={[styles.rowName, checked && styles.rowNameDone]}>{item.name}</Text>
    </TouchableOpacity>
  );
}

export default function GroceryScreen() {
  const inventory = useKitchen((s) => s.inventory);
  const checked = useKitchen((s) => s.groceryChecked);
  const toggle = useKitchen((s) => s.toggleGrocery);

  const groups = useMemo(() => buildGroceryList(inventory), [inventory]);
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const remaining =
    total -
    groups
      .flatMap((g) => g.items)
      .filter((i) => checked[i.id]).length;

  return (
    <Screen showBack>
      <Text style={styles.title}>GROCERY LIST</Text>
      <Text style={styles.subtitle}>
        auto-generated from your inventory · {remaining} to buy
      </Text>

      {groups.map((group) => (
        <View key={group.reason} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.reasonPill}>
              <Text style={styles.reasonLabel}>{group.reason.toUpperCase()}</Text>
            </View>
          </View>
          {group.items.map((item) => (
            <GroceryRow
              key={item.id}
              item={item}
              checked={!!checked[item.id]}
              onToggle={() => toggle(item.id)}
            />
          ))}
        </View>
      ))}

      <TouchableOpacity style={styles.shareButton} activeOpacity={0.85}>
        <Ionicons name="share-outline" size={18} color={Colors.text} />
        <Text style={styles.shareLabel}>SHARE LIST</Text>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: Fonts.sansMedium,
    fontSize: 28,
    color: Colors.text,
    marginTop: 8,
  },
  subtitle: {
    fontFamily: Fonts.serifItalic,
    fontSize: 13,
    color: Colors.muted,
    marginTop: 4,
    marginBottom: 12,
  },
  section: { marginTop: 18 },
  sectionHeader: { flexDirection: 'row', marginBottom: 10 },
  reasonPill: {
    backgroundColor: Colors.yellow,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  reasonLabel: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.text },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: Colors.yellow, borderColor: Colors.yellow },
  rowEmoji: { fontSize: 24 },
  rowName: { fontFamily: Fonts.sans, fontSize: 17, color: Colors.text },
  rowNameDone: {
    textDecorationLine: 'line-through',
    color: Colors.muted,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: Colors.yellow,
    marginTop: 32,
  },
  shareLabel: { fontFamily: Fonts.sansMedium, fontSize: 15, color: Colors.text },
});
