import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '@/components/screen';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { parsedToIngredient } from '@/lib/scan';
import { useKitchen } from '@/store/kitchen-store';

export default function ScanReviewScreen() {
  const pending = useKitchen((s) => s.pendingScan);
  const addInventoryItems = useKitchen((s) => s.addInventoryItems);
  const setPendingScan = useKitchen((s) => s.setPendingScan);

  // Each parsed item is keyed by index; track which are kept + which are removed.
  const [removed, setRemoved] = useState<Record<number, boolean>>({});
  const [unchecked, setUnchecked] = useState<Record<number, boolean>>({});

  const rows = useMemo(
    () => pending.map((item, i) => ({ item, i })).filter(({ i }) => !removed[i]),
    [pending, removed],
  );
  const selectedCount = rows.filter(({ i }) => !unchecked[i]).length;

  const onAdd = () => {
    const items = rows
      .filter(({ i }) => !unchecked[i])
      .map(({ item }) => parsedToIngredient(item));
    if (items.length) addInventoryItems(items);
    setPendingScan([]);
    router.replace('/inventory');
  };

  if (pending.length === 0) {
    return (
      <Screen showBack>
        <Text style={styles.title}>REVIEW SCAN</Text>
        <View style={styles.center}>
          <Text style={styles.empty}>Nothing to review. Scan a receipt to get started.</Text>
          <TouchableOpacity style={styles.scanBtn} onPress={() => router.replace('/scan')}>
            <Ionicons name="scan-outline" size={18} color={Colors.text} />
            <Text style={styles.scanBtnText}>SCAN A RECEIPT</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen showBack>
      <Text style={styles.title}>REVIEW SCAN</Text>
      <Text style={styles.subtitle}>
        Found {pending.length} item{pending.length === 1 ? '' : 's'} · uncheck or remove anything wrong
      </Text>

      {rows.map(({ item, i }) => {
        const ing = parsedToIngredient(item);
        const checked = !unchecked[i];
        return (
          <View key={i} style={styles.row}>
            <TouchableOpacity
              style={styles.rowMain}
              activeOpacity={0.7}
              onPress={() => setUnchecked((u) => ({ ...u, [i]: checked }))}>
              <View style={[styles.checkbox, checked && styles.checkboxOn]}>
                {checked && <Ionicons name="checkmark" size={16} color={Colors.text} />}
              </View>
              <Text style={styles.rowEmoji}>{ing.emoji}</Text>
              <View style={styles.rowText}>
                <Text style={[styles.rowName, !checked && styles.rowNameOff]}>
                  {item.name}
                  {item.quantity ? <Text style={styles.qty}>  {item.quantity}</Text> : null}
                </Text>
                <Text style={styles.rowCat}>{item.category}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setRemoved((r) => ({ ...r, [i]: true }))} hitSlop={10}>
              <Ionicons name="close" size={18} color={Colors.muted} />
            </TouchableOpacity>
          </View>
        );
      })}

      <TouchableOpacity
        style={[styles.addButton, selectedCount === 0 && styles.addButtonDisabled]}
        activeOpacity={0.85}
        disabled={selectedCount === 0}
        onPress={onAdd}>
        <Ionicons name="basket-outline" size={18} color={Colors.text} />
        <Text style={styles.addLabel}>
          ADD {selectedCount} ITEM{selectedCount === 1 ? '' : 'S'} TO INVENTORY
        </Text>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: Fonts.sansMedium, fontSize: 28, color: Colors.text, marginTop: 8 },
  subtitle: {
    fontFamily: Fonts.serifItalic,
    fontSize: 13,
    color: Colors.muted,
    marginTop: 4,
    marginBottom: 16,
  },
  center: { alignItems: 'center', paddingTop: 80, gap: 18 },
  empty: { fontFamily: Fonts.serifItalic, fontSize: 15, color: Colors.muted, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
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
  rowEmoji: { fontSize: 26 },
  rowText: { flex: 1 },
  rowName: { fontFamily: Fonts.sans, fontSize: 17, color: Colors.text },
  rowNameOff: { color: Colors.muted, textDecorationLine: 'line-through' },
  qty: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.muted },
  rowCat: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.muted, marginTop: 2 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: Radius.pill,
    backgroundColor: Colors.yellow,
    marginTop: 28,
  },
  addButtonDisabled: { opacity: 0.5 },
  addLabel: { fontFamily: Fonts.sansMedium, fontSize: 15, color: Colors.text },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.yellow,
    borderRadius: Radius.pill,
    paddingHorizontal: 20,
    height: 44,
  },
  scanBtnText: { fontFamily: Fonts.sansMedium, fontSize: 15, color: Colors.text },
});
