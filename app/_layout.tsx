import {
  InriaSerif_400Regular,
  InriaSerif_400Regular_Italic,
  InriaSerif_700Bold,
} from '@expo-google-fonts/inria-serif';
import {
  Jost_400Regular,
  Jost_500Medium,
  Jost_600SemiBold,
  Jost_700Bold,
  useFonts,
} from '@expo-google-fonts/jost';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import { useKitchen } from '@/store/kitchen-store';

export default function RootLayout() {
  const [loaded] = useFonts({
    InriaSerif_400Regular,
    InriaSerif_400Regular_Italic,
    InriaSerif_700Bold,
    Jost_400Regular,
    Jost_500Medium,
    Jost_600SemiBold,
    Jost_700Bold,
  });
  const hydrated = useKitchen((s) => s.hasHydrated);

  // Once local state is loaded, reconcile with Supabase in the background.
  useEffect(() => {
    if (hydrated) {
      useKitchen.getState().syncFromServer();
    }
  }, [hydrated]);

  if (!loaded || !hydrated) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#fff' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="profile" options={{ presentation: 'card' }} />
        <Stack.Screen name="scan" options={{ presentation: 'fullScreenModal' }} />
      </Stack>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
