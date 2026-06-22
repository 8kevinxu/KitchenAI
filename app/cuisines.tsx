import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Screen } from '@/components/screen';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { CUISINES } from '@/data/kitchen';

export default function CuisinesScreen() {
  const [query, setQuery] = useState('');

  const cuisines = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CUISINES.filter((c) => !q || c.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <Screen showBack>
      <Text style={styles.title}>CUISINES</Text>

      <View style={styles.search}>
        <Ionicons name="search" size={15} color={Colors.muted} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
      </View>

      <View style={styles.grid}>
        {cuisines.map((c) => (
          <TouchableOpacity
            key={c.name}
            style={styles.tile}
            activeOpacity={0.7}
            onPress={() => router.push('/recipes')}>
            <Text style={styles.tileLabel}>{c.name}</Text>
            <Text style={styles.tileEmoji}>{c.emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: Fonts.sansMedium,
    fontSize: 28,
    color: Colors.text,
    marginTop: 8,
    marginBottom: 14,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.field,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    height: 30,
    marginBottom: 24,
  },
  searchInput: { flex: 1, fontFamily: Fonts.sans, fontSize: 14, padding: 0 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 28,
  },
  tile: { width: '30%', alignItems: 'center' },
  tileLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 15,
    color: Colors.text,
    marginBottom: 14,
  },
  tileEmoji: { fontSize: 56 },
});
