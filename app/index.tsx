import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Href, router } from 'expo-router';
import { ReactNode, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '@/components/screen';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { freshnessOf, needsAttention, USER, withSeedMeta } from '@/data/kitchen';
import { useKitchen } from '@/store/kitchen-store';

type Action = {
  label: string;
  href: Href;
  icon: (color: string, size: number) => ReactNode;
  width: number;
};

const ACTIONS: Action[] = [
  {
    label: 'INVENTORY',
    href: '/inventory',
    width: 158,
    icon: (c, s) => <Ionicons name="basket-outline" color={c} size={s} />,
  },
  {
    label: 'SCAN',
    href: '/scan',
    width: 128,
    icon: (c, s) => <MaterialCommunityIcons name="barcode-scan" color={c} size={s} />,
  },
  {
    label: 'RECIPES',
    href: '/cuisines',
    width: 128,
    icon: (c, s) => <MaterialCommunityIcons name="chef-hat" color={c} size={s} />,
  },
  {
    label: 'GROCERY LIST',
    href: '/grocery',
    width: 190,
    icon: (c, s) => <Ionicons name="cart-outline" color={c} size={s} />,
  },
];

export default function HomeScreen() {
  const inventory = useKitchen((s) => s.inventory);
  const dismissed = useKitchen((s) => s.dismissedExpiry);

  const attention = useMemo(() => {
    const skip = new Set(dismissed);
    return inventory.map(withSeedMeta).filter((i) => needsAttention(i) && !skip.has(i.id));
  }, [inventory, dismissed]);

  const expired = attention.filter((i) => freshnessOf(i) === 'expired').length;
  const expiring = attention.length - expired;
  const alertSub = [
    expired > 0 ? `${expired} expired` : null,
    expiring > 0 ? `${expiring} expiring soon` : null,
  ]
    .filter(Boolean)
    .join('  ·  ');

  return (
    <Screen showProfile scroll={false}>
      <View style={styles.container}>
        <Text style={styles.greeting}>HELLO, {USER.name.toUpperCase()}!</Text>

        {attention.length > 0 && (
          <TouchableOpacity
            style={styles.alert}
            activeOpacity={0.85}
            onPress={() => router.push('/expiring')}>
            <Ionicons name="alert-circle" size={22} color={Colors.expiring} />
            <View style={styles.alertText}>
              <Text style={styles.alertTitle}>
                {attention.length} item{attention.length === 1 ? '' : 's'} to use soon
              </Text>
              <Text style={styles.alertSub}>{alertSub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.muted} />
          </TouchableOpacity>
        )}

        <View style={styles.actions}>
          {ACTIONS.map((a) => (
            <TouchableOpacity
              key={a.label}
              activeOpacity={0.85}
              style={[styles.pill, { width: a.width }]}
              onPress={() => router.push(a.href)}>
              {a.icon(Colors.text, 20)}
              <Text style={styles.pillLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  greeting: {
    fontFamily: Fonts.sansMedium,
    fontSize: 20,
    color: Colors.text,
    letterSpacing: 0.5,
    marginTop: 80,
  },
  alert: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 26,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.card,
    backgroundColor: '#FBECEA',
    borderWidth: 1,
    borderColor: '#F0CFC9',
  },
  alertText: { flex: 1 },
  alertTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 15, color: Colors.text },
  alertSub: { fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.expiring, marginTop: 1 },
  actions: { marginTop: 44, gap: 22, alignItems: 'center' },
  pill: {
    height: 48,
    borderRadius: Radius.pill,
    backgroundColor: Colors.yellow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  pillLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 15,
    color: Colors.text,
    letterSpacing: 0.5,
  },
});
