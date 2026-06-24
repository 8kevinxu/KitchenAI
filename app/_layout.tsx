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
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import { isSupabaseConfigured } from '@/lib/supabase';
import { initAuth, useAuth } from '@/store/auth-store';
import { useKitchen } from '@/store/kitchen-store';

// Bind the auth lifecycle once (no-op when Supabase isn't configured).
initAuth();

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
  const authReady = useAuth((s) => s.initialized);
  const session = useAuth((s) => s.session);
  const segments = useSegments();
  const router = useRouter();

  const ready = loaded && hydrated && authReady;

  // Gate the app behind sign-in when Supabase is configured.
  useEffect(() => {
    if (!ready || !isSupabaseConfigured) return;
    const onLogin = segments[0] === 'login';
    if (!session && !onLogin) router.replace('/login');
    else if (session && onLogin) router.replace('/');
  }, [ready, session, segments, router]);

  if (!ready) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#fff' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="profile" options={{ presentation: 'card' }} />
        <Stack.Screen name="scan" options={{ presentation: 'fullScreenModal' }} />
      </Stack>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
