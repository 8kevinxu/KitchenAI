import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** True only when both env vars are present; lets the app fall back to
 *  local-only mode if Supabase isn't configured yet. */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Single shared dataset for now — every row is tagged with this id. When we
 * add accounts later, this becomes the authenticated user's id and the rest of
 * the data layer is unchanged.
 */
export const CURRENT_USER_ID = 'demo';

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
