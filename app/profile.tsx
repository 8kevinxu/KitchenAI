import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wordmark } from '@/components/wordmark';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { RECIPES, USER } from '@/data/kitchen';
import { goBack } from '@/lib/nav';
import { getRecipeDetail } from '@/lib/recipes';
import { useKitchen } from '@/store/kitchen-store';

type SavedCard = { id: string; title: string; image: string };

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const savedIds = useKitchen((s) => s.savedRecipeIds);
  const [saved, setSaved] = useState<SavedCard[]>([]);

  // Resolve saved ids to cards: local recipes instantly, provider recipes via fetch.
  useEffect(() => {
    let active = true;
    Promise.all(
      savedIds.map(async (sid): Promise<SavedCard | null> => {
        const local = RECIPES.find((r) => r.id === sid);
        if (local) return { id: local.id, title: local.title, image: local.image };
        const d = await getRecipeDetail(sid);
        return d ? { id: d.id, title: d.title, image: d.image } : null;
      }),
    ).then((cards) => {
      if (active) setSaved(cards.filter((c): c is SavedCard => c !== null));
    });
    return () => {
      active = false;
    };
  }, [savedIds]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.headerBand}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={goBack} hitSlop={12}>
            <Ionicons name="arrow-back" size={26} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Wordmark />
            <View style={styles.rule} />
          </View>
          <View style={{ width: 26 }} />
        </View>
      </View>

      <View style={styles.avatar} pointerEvents="none">
        <Ionicons name="person" size={78} color={Colors.text} style={styles.avatarIcon} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.tabs}>
          <View style={styles.activeTab}>
            <Text style={styles.activeTabText}>My Recipes</Text>
            <View style={styles.tabUnderline} />
          </View>
        </View>

        <View style={styles.savedHeader}>
          <Text style={styles.savedLabel}>Saved Recipes</Text>
          <Ionicons name="bookmark" size={18} color={Colors.text} />
        </View>

        {saved.length === 0 ? (
          <Text style={styles.empty}>
            No saved recipes yet. Tap “Save this recipe” on any recipe to keep it
            here.
          </Text>
        ) : (
          saved.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: r.id } })}>
              <Image source={{ uri: r.image }} style={styles.cardThumb} contentFit="cover" />
              <Text style={styles.cardTitle}>{r.title}</Text>
            </TouchableOpacity>
          ))
        )}

        <Text style={styles.footer}>Questions? {USER.email}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.profileBg },
  headerBand: { backgroundColor: Colors.profileBg, paddingBottom: 64 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  rule: { height: 1, backgroundColor: Colors.text, alignSelf: 'stretch', marginTop: 8, marginHorizontal: 8 },
  avatar: {
    position: 'absolute',
    top: 58,
    left: '50%',
    marginLeft: -65,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: Colors.background,
    borderWidth: 5,
    borderColor: Colors.text,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 10,
    elevation: 10,
  },
  avatarIcon: { marginBottom: -8 },
  body: {
    backgroundColor: Colors.background,
    paddingTop: 80,
    paddingHorizontal: 24,
    minHeight: '100%',
  },
  tabs: { alignItems: 'center', marginBottom: 28 },
  activeTab: { alignItems: 'center' },
  activeTabText: { fontFamily: Fonts.sansMedium, fontSize: 15, color: Colors.text },
  tabUnderline: { height: 3, width: 80, backgroundColor: Colors.yellow, marginTop: 8 },
  savedHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  savedLabel: { fontFamily: Fonts.sansMedium, fontSize: 15, color: Colors.text },
  card: {
    height: 100,
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    marginBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardThumb: { width: 76, height: 76, borderRadius: 10 },
  cardTitle: { fontFamily: Fonts.sansMedium, fontSize: 18, color: Colors.text },
  empty: {
    fontFamily: Fonts.serifItalic,
    fontSize: 14,
    color: Colors.muted,
    lineHeight: 22,
    marginTop: 8,
  },
  footer: {
    fontFamily: Fonts.serif,
    fontSize: 10,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 'auto',
    paddingTop: 40,
    paddingBottom: 20,
  },
});
