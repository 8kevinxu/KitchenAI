import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Href, router } from 'expo-router';
import { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '@/components/screen';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { USER } from '@/data/kitchen';

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
  return (
    <Screen showProfile scroll={false}>
      <View style={styles.container}>
        <Text style={styles.greeting}>HELLO, {USER.name}!</Text>

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
    marginTop: 110,
  },
  actions: { marginTop: 72, gap: 22, alignItems: 'center' },
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
