// Supabase browser client.
//
// Configuration comes from build-time environment variables (Vite inlines any
// var prefixed with VITE_ into the bundle). The anon key is *designed* to be
// public: it only allows the operations your Row Level Security policies permit,
// so never put the service-role key here.
//
// If the env vars are missing the app still runs as a guest (no login, data
// kept in localStorage), which keeps local dev and previews working before
// Supabase is configured.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
