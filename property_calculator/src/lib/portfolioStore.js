// Per-user portfolio persistence against Supabase.
//
// The app stores the whole portfolio as a single JSON blob (the same shape that
// previously went to localStorage): { cityId, assumptions, listingsByCity,
// liveLoadedCities, proxyBase, liveLimit }. We keep one row per user in the
// `portfolios` table (primary key = user_id), protected by Row Level Security.
import { supabase, isSupabaseConfigured } from './supabaseClient';

// Load the signed-in user's saved portfolio blob.
// Returns the stored `data` object, or null when there is no row yet / not
// configured. Throws on unexpected errors so callers can surface them.
export async function loadRemotePortfolio(userId) {
  if (!isSupabaseConfigured || !userId) return null;

  const { data, error } = await supabase
    .from('portfolios')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data?.data ?? null;
}

// Upsert the signed-in user's portfolio blob.
export async function saveRemotePortfolio(userId, blob) {
  if (!isSupabaseConfigured || !userId) return;

  const { error } = await supabase
    .from('portfolios')
    .upsert(
      { user_id: userId, data: blob, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );

  if (error) throw error;
}
