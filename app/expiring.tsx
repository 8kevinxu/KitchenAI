import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '@/components/screen';
import { Colors, Fonts, Radius } from '@/constants/theme';
import {
  comingUp,
  expiryLabel,
  freshnessOf,
  Ingredient,
  needsAttention,
  withSeedMeta,
} from '@/data/kitchen';
import { useKitchen } from '@/store/kitchen-store';

const FRESH_COLOR: Record<string, string> = {
  expired: Colors.expiring,
  expiring: Colors.expiring,
  soon: Colors.soon,
};

function AttentionCard({
  item,
  onCook,
  onUsed,
  onDismiss,
}: {
  item: Ingredient;
  onCook: () => void;
  onUsed: () => void;
  onDismiss: () => void;
}) {
  const fresh = freshnessOf(item) ?? 'soon';
  return (
    <View style={[styles.card, { borderLeftColor: FRESH_COLOR[fresh] }]}>
      <View style={styles.cardTop}>
        <Text style={styles.emoji}>{item.emoji}</Text>
        <View style={styles.cardText}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={[styles.days, { color: FRESH_COLOR[fresh] }]}>
            {expiryLabel(item)}
          </Text>
        </View>
        <TouchableOpacity onPress={onDismiss} hitSlop={10} accessibilityLabel={`Keep ${item.name}`}>
          <Ionicons name="close" size={18} color={Colors.muted} />
        </TouchableOpacity>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.action, styles.cook]} activeOpacity={0.85} onPress={onCook}>
          <Ionicons name="restaurant-outline" size={15} color={Colors.greenText} />
          <Text style={styles.cookText}>Cook with it</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.action, styles.used]} activeOpacity={0.85} onPress={onUsed}>
          <Ionicons name="checkmark-done" size={15} color={Colors.text} />
          <Text style={styles.usedText}>Used it up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ExpiringScreen() {
  const inventory = useKitchen((s) => s.inventory);
  const dismissed = useKitchen((s) => s.dismissedExpiry);
  const markUsedUp = useKitchen((s) => s.markUsedUp);
  const dismissAlert = useKitchen((s) => s.dismissExpiringAlert);

  const { now, later } = useMemo(() => {
    const skip = new Set(dismissed);
    const enriched = inventory.map(withSeedMeta).filter((i) => !skip.has(i.id));
    const byDays = (a: Ingredient, b: Ingredient) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0);
    return {
      now: enriched.filter(needsAttention).sort(byDays),
      later: enriched.filter(comingUp).sort(byDays),
    };
  }, [inventory, dismissed]);

  const empty = now.length === 0 && later.length === 0;

  return (
    <Screen showBack>
      <Text style={styles.title}>USE IT UP</Text>
      <Text style={styles.subtitle}>
        Cook these before they go to waste. “Used it up” moves an item to your grocery list.
      </Text>

      {empty && (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={styles.centerText}>
            You’re all caught up — nothing’s about to expire.
          </Text>
        </View>
      )}

      {now.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionPill}>
            <Text style={styles.sectionLabel}>EXPIRING NOW</Text>
          </View>
          {now.map((item) => (
            <AttentionCard
              key={item.id}
              item={item}
              onCook={() => router.push('/recipes')}
              onUsed={() => markUsedUp(item.id)}
              onDismiss={() => dismissAlert(item.id)}
            />
          ))}
        </View>
      )}

      {later.length > 0 && (
        <View style={styles.section}>
          <View style={[styles.sectionPill, styles.sectionPillSoon]}>
            <Text style={styles.sectionLabel}>LATER THIS WEEK</Text>
          </View>
          {later.map((item) => (
            <AttentionCard
              key={item.id}
              item={item}
              onCook={() => router.push('/recipes')}
              onUsed={() => markUsedUp(item.id)}
              onDismiss={() => dismissAlert(item.id)}
            />
          ))}
        </View>
      )}
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
    marginBottom: 8,
    lineHeight: 19,
  },
  center: { alignItems: 'center', paddingTop: 90, gap: 12 },
  emptyEmoji: { fontSize: 36 },
  centerText: {
    fontFamily: Fonts.serifItalic,
    fontSize: 15,
    color: Colors.muted,
    textAlign: 'center',
    paddingHorizontal: 30,
    lineHeight: 22,
  },
  section: { marginTop: 18 },
  sectionPill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.expiring,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 12,
  },
  sectionPillSoon: { backgroundColor: Colors.soon },
  sectionLabel: { fontFamily: Fonts.sansSemiBold, fontSize: 12, color: '#FFFFFF', letterSpacing: 0.5 },
  card: {
    backgroundColor: '#F6F6F4',
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emoji: { fontSize: 28 },
  cardText: { flex: 1 },
  name: { fontFamily: Fonts.sansMedium, fontSize: 17, color: Colors.text },
  days: { fontFamily: Fonts.sansMedium, fontSize: 13, marginTop: 1 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 34,
    borderRadius: Radius.pill,
  },
  cook: { backgroundColor: Colors.green },
  cookText: { fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.greenText },
  used: { backgroundColor: Colors.yellow },
  usedText: { fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.text },
});
