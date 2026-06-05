// Favorites ("Favoriten") context.
//
// Owns the list of bookmarked listings and keeps it in sync. Guests keep their
// favorites in localStorage; signed-in users get them stored per-user in
// Supabase (and any guest favorites are merged up on login). The same star
// button works in both the single-apartment view and the city overview.
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { isSupabaseConfigured } from './supabaseClient';
import {
  loadRemoteFavorites,
  upsertRemoteFavorite,
  deleteRemoteFavorite
} from './favoritesStore';

const FavoritesContext = createContext(null);

const STORAGE_KEY = 'favorites-v1';

// localStorage is the GUEST favorites store. The blob is tagged with its owner
// so a cache written while signed in is never mistaken for guest favorites on a
// later load (which would otherwise leak one account's data to a guest or to a
// different account). Only an untagged (guest) cache is trusted at startup; a
// signed-in user's list is always (re)loaded from Supabase.
const loadLocalFavorites = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(parsed)) return parsed; // legacy guest format
    if (parsed && Array.isArray(parsed.items) && !parsed.owner) return parsed.items;
    return [];
  } catch {
    return [];
  }
};

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState(loadLocalFavorites);
  const [loading, setLoading] = useState(false);
  // Tracks the previously seen user id so we can detect a sign-out (or an
  // account switch) and avoid leaking one account's favorites to the next.
  const prevUserIdRef = useRef(null);

  // Mirror the working set to localStorage, tagged with the current owner so it
  // can only ever be read back as guest data when it truly belongs to a guest.
  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ owner: user?.id || null, items: favorites })
      );
    } catch {
      /* storage full or unavailable – ignore */
    }
  }, [favorites, user?.id]);

  // React to auth changes.
  //  - Sign-out (or account switch): drop the in-memory list and the local cache
  //    so a guest – or a different account – never sees the previous user's
  //    favorites.
  //  - Sign-in (or session restore): load the user's favorites and merge any
  //    genuine guest favorites that are not stored remotely yet.
  useEffect(() => {
    const prevUserId = prevUserIdRef.current;
    prevUserIdRef.current = user?.id || null;

    if (!user?.id) {
      // Only clear when we are actually leaving a signed-in session; a plain
      // guest (who never signed in) keeps their localStorage favorites.
      if (prevUserId) {
        setFavorites([]);
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
      }
      return undefined;
    }

    let active = true;
    setLoading(true);
    (async () => {
      try {
        const remote = await loadRemoteFavorites(user.id);
        const remoteIds = new Set(remote.map((f) => f.id));
        const localOnly = favorites.filter((f) => !remoteIds.has(f.id));
        await Promise.all(localOnly.map((f) => upsertRemoteFavorite(user.id, f)));
        if (!active) return;
        setFavorites([...remote, ...localOnly]);
      } catch {
        /* keep local favorites on failure */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // Only react to the identity of the user, not to local list changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const value = useMemo(() => {
    const isFavorite = (id) => favorites.some((f) => f.id === id);

    const toggleFavorite = (favorite) => {
      if (!favorite?.id) return;
      const exists = favorites.some((f) => f.id === favorite.id);
      if (exists) {
        setFavorites((prev) => prev.filter((f) => f.id !== favorite.id));
        if (user?.id) deleteRemoteFavorite(user.id, favorite.id).catch(() => {});
      } else {
        const record = { ...favorite, savedAt: new Date().toISOString() };
        setFavorites((prev) => [...prev, record]);
        if (user?.id) upsertRemoteFavorite(user.id, record).catch(() => {});
      }
    };

    const removeFavorite = (id) => {
      setFavorites((prev) => prev.filter((f) => f.id !== id));
      if (user?.id) deleteRemoteFavorite(user.id, id).catch(() => {});
    };

    return {
      configured: isSupabaseConfigured,
      loading,
      favorites,
      isFavorite,
      toggleFavorite,
      removeFavorite
    };
  }, [favorites, loading, user?.id]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within a FavoritesProvider');
  return ctx;
}
