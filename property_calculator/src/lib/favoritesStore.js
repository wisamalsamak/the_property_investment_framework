// Per-user favorites ("Favoriten") persistence against Supabase.
//
// One row per favorited listing per user in the `favorites` table
// (primary key = user_id + listing_id), protected by Row Level Security.
// The listing snapshot is stored as a JSON blob in the `data` column.
import { supabase, isSupabaseConfigured } from './supabaseClient';

// Load all of the signed-in user's favorites as an array of favorite objects.
// Each returned object carries its stable `id` (= listing_id) and `savedAt`.
export async function loadRemoteFavorites(userId) {
  if (!isSupabaseConfigured || !userId) return [];

  const { data, error } = await supabase
    .from('favorites')
    .select('listing_id, data, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []).map((row) => ({
    ...(row.data || {}),
    id: row.listing_id,
    savedAt: row.data?.savedAt || row.created_at
  }));
}

// Insert or update a single favorite for the signed-in user.
export async function upsertRemoteFavorite(userId, favorite) {
  if (!isSupabaseConfigured || !userId || !favorite?.id) return;

  const { id, ...rest } = favorite;
  const { error } = await supabase
    .from('favorites')
    .upsert(
      { user_id: userId, listing_id: id, data: rest },
      { onConflict: 'user_id,listing_id' }
    );

  if (error) throw error;
}

// Remove a single favorite for the signed-in user.
export async function deleteRemoteFavorite(userId, listingId) {
  if (!isSupabaseConfigured || !userId || !listingId) return;

  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('listing_id', listingId);

  if (error) throw error;
}
