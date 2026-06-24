import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Screen } from '@/components/screen';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { buildGroceryList, withFreshness } from '@/data/kitchen';
import { useKitchen } from '@/store/kitchen-store';

type Row = { id: string; name: string; emoji: string; recipe?: string };
type Group = { reason: string; items: Row[] };

function buildShareText(groups: Group[], isSelected: (id: string) => boolean) {
  const lines = ['🛒 Grocery List', ''];
  for (const group of groups) {
    const picked = group.items.filter((i) => isSelected(i.id));
    if (picked.length === 0) continue;
    lines.push(`${group.reason}:`);
    picked.forEach((i) =>
      lines.push(`• ${i.name}${i.recipe ? ` (for ${i.recipe})` : ''}`),
    );
    lines.push('');
  }
  return lines.join('\n').trim();
}

function GroceryRow({
  item,
  selected,
  onToggle,
  onRemove,
}: {
  item: Row;
  selected: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.rowMain} activeOpacity={0.7} onPress={onToggle}>
        <View style={[styles.checkbox, selected && styles.checkboxOn]}>
          {selected && <Ionicons name="checkmark" size={16} color={Colors.text} />}
        </View>
        <Text style={styles.rowEmoji}>{item.emoji}</Text>
        <View style={styles.rowText}>
          <Text style={[styles.rowName, !selected && styles.rowNameOff]}>{item.name}</Text>
          {item.recipe && (
            <View style={styles.recipeTag}>
              <Ionicons name="restaurant-outline" size={11} color={Colors.muted} />
              <Text style={styles.recipeTagText} numberOfLines={1}>
                for {item.recipe}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={onRemove} hitSlop={10} accessibilityLabel={`Remove ${item.name}`}>
        <Ionicons name="close" size={18} color={Colors.muted} />
      </TouchableOpacity>
    </View>
  );
}

export default function GroceryScreen() {
  const rawInventory = useKitchen((s) => s.inventory);
  const inventory = useMemo(() => rawInventory.map(withFreshness), [rawInventory]);
  const checked = useKitchen((s) => s.groceryChecked);
  const customGrocery = useKitchen((s) => s.customGrocery);
  const dismissed = useKitchen((s) => s.dismissedGrocery);
  const toggle = useKitchen((s) => s.toggleGrocery);
  const addItem = useKitchen((s) => s.addGroceryItem);
  const removeItem = useKitchen((s) => s.removeGroceryItem);

  const [draft, setDraft] = useState('');
  const isSelected = (id: string) => checked[id] !== false;

  const groups: Group[] = useMemo(() => {
    const auto: Group[] = buildGroceryList(inventory)
      .map((g) => ({
        reason: g.reason as string,
        items: g.items.filter((i) => !dismissed.includes(i.id)) as Row[],
      }))
      .filter((g) => g.items.length > 0);
    if (customGrocery.length) auto.push({ reason: 'My items', items: customGrocery });
    return auto;
  }, [inventory, dismissed, customGrocery]);

  const selectedCount = useMemo(
    () => groups.flatMap((g) => g.items).filter((i) => isSelected(i.id)).length,
    [groups, checked],
  );

  const onAdd = () => {
    addItem(draft);
    setDraft('');
  };

  const onShare = async () => {
    const message = buildShareText(groups, isSelected);
    if (!message) return;
    try {
      await Share.share({ message });
    } catch {
      // dismissed or unavailable — no-op
    }
  };

  return (
    <Screen showBack>
      <Text style={styles.title}>GROCERY LIST</Text>
      <Text style={styles.subtitle}>
        check the items you want to share · {selectedCount} selected
      </Text>

      <View style={styles.addRow}>
        <Ionicons name="add" size={18} color={Colors.muted} />
        <TextInput
          style={styles.addInput}
          placeholder="Add an item"
          placeholderTextColor={Colors.muted}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={onAdd}
          returnKeyType="done"
        />
        {draft.trim().length > 0 && (
          <TouchableOpacity onPress={onAdd}>
            <Text style={styles.addBtn}>Add</Text>
          </TouchableOpacity>
        )}
      </View>

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
              selected={isSelected(item.id)}
              onToggle={() => toggle(item.id)}
              onRemove={() => removeItem(item.id)}
            />
          ))}
        </View>
      ))}

      <TouchableOpacity style={styles.shareButton} activeOpacity={0.85} onPress={onShare}>
        <Ionicons name="share-outline" size={18} color={Colors.text} />
        <Text style={styles.shareLabel}>SHARE LIST</Text>
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
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.field,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    height: 38,
  },
  addInput: { flex: 1, fontFamily: Fonts.sans, fontSize: 15, padding: 0, color: Colors.text },
  addBtn: { fontFamily: Fonts.sansSemiBold, fontSize: 14, color: Colors.text },
  section: { marginTop: 18 },
  sectionHeader: { flexDirection: 'row', marginBottom: 10 },
  reasonPill: { backgroundColor: Colors.yellow, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  reasonLabel: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.text },
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
  rowEmoji: { fontSize: 24 },
  rowText: { flex: 1 },
  rowName: { fontFamily: Fonts.sans, fontSize: 17, color: Colors.text },
  rowNameOff: { color: Colors.muted },
  recipeTag: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  recipeTagText: { fontFamily: Fonts.serifItalic, fontSize: 12, color: Colors.muted, flexShrink: 1 },
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
