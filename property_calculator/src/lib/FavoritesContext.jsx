// Favorites ("Favoriten") context.
//
// Owns the list of bookmarked listings and keeps it in sync. Guests keep their
// favorites in localStorage; signed-in users get them stored per-user in
// Supabase (and any guest favorites are merged up on login). The same star
// button works in both the single-apartment view and the city overview.
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { isSupabaseConfigured } from './supabaseClient';
import {
  loadRemoteFavorites,
  upsertRemoteFavorite,
  deleteRemoteFavorite
} from './favoritesStore';

const FavoritesContext = createContext(null);

const STORAGE_KEY = 'favorites-v1';

const loadLocalFavorites = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState(loadLocalFavorites);
  const [loading, setLoading] = useState(false);

  // Always mirror the working set to localStorage (guest store + offline cache).
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      /* storage full or unavailable – ignore */
    }
  }, [favorites]);

  // On login (or session restore): load the user's favorites and merge any
  // guest favorites that are not stored remotely yet.
  useEffect(() => {
    if (!user?.id) return undefined;
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
