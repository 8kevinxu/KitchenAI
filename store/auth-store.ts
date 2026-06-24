import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useKitchen } from '@/store/kitchen-store';

type AuthState = {
  session: Session | null;
  user: User | null;
  /** True once we know whether there's a session (or auth isn't configured). */
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

export const useAuth = create<AuthState>(() => ({
  session: null,
  user: null,
  // When Supabase isn't configured there's no auth to wait for.
  initialized: !isSupabaseConfigured,

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return { error: error?.message };
  },

  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email: email.trim(), password });
    return { error: error?.message };
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },
}));

let bound = false;

/**
 * Bind the auth lifecycle once. Keeps the local kitchen store in sync with the
 * signed-in user: a fresh sign-in starts from a clean slate (then pulls/seeds
 * that account's data), and signing out clears local data so the next user
 * never sees it.
 */
export function initAuth() {
  if (!isSupabaseConfigured || bound) return;
  bound = true;

  supabase.auth.onAuthStateChange((event, session) => {
    useAuth.setState({ session, user: session?.user ?? null, initialized: true });
    const kitchen = useKitchen.getState();

    if (event === 'SIGNED_OUT') {
      kitchen.resetAll();
    } else if (event === 'SIGNED_IN') {
      kitchen.resetAll();
      kitchen.syncFromServer();
    } else if (event === 'INITIAL_SESSION' && session) {
      // Returning user on this device — server is the source of truth.
      kitchen.syncFromServer();
    }
  });

  // Make sure `initialized` flips even if no auth event fires.
  supabase.auth.getSession().then(({ data }) =>
    useAuth.setState((s) => ({
      initialized: true,
      session: data.session ?? s.session,
      user: data.session?.user ?? s.user,
    })),
  );
}
