import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** True only when both env vars are present; lets the app fall back to
 *  local-only mode if Supabase isn't configured yet. */
export const isSupabaseConfigured = Boolean(url && anonKey);

// Only construct the client when configured — createClient throws on an empty
// URL. When unconfigured the app runs local-only and never touches `supabase`
// (every call site is guarded by isSupabaseConfigured).
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : (null as unknown as SupabaseClient);

/**
 * The signed-in user's id, used to scope every row. Read from the persisted
 * session (no network). Null when unconfigured or signed out, in which case
 * the data layer no-ops and the app runs purely on local state.
 */
export async function currentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}
