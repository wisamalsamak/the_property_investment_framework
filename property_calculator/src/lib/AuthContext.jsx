// Authentication context backed by Supabase Auth.
//
// Provides the current user/session and email+password auth actions to the
// whole app. When Supabase is not configured the provider still renders, but
// `user` stays null and the app behaves as an anonymous guest.
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  // `loading` is true until we know whether there is an existing session, so the
  // UI can avoid flashing the logged-out state on first paint.
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => {
    const signUp = async (email, password) => {
      if (!isSupabaseConfigured) throw new Error('Authentifizierung ist nicht konfiguriert.');
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return data;
    };

    const signIn = async (email, password) => {
      if (!isSupabaseConfigured) throw new Error('Authentifizierung ist nicht konfiguriert.');
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    };

    const signOut = async () => {
      if (!isSupabaseConfigured) return;
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    };

    return {
      configured: isSupabaseConfigured,
      loading,
      session,
      user: session?.user ?? null,
      signUp,
      signIn,
      signOut,
    };
  }, [loading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
