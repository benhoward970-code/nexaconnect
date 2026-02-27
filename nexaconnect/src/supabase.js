import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Only create client if credentials are configured
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const isSupabaseConfigured = () => !!supabase

// ── Realtime Subscription Helpers ──

export function subscribeToTable(table, event, filter, callback) {
  if (!supabase) return null;
  const channelName = `realtime-${table}-${event}-${Date.now()}`;
  const channelConfig = { event, schema: 'public', table };
  if (filter) channelConfig.filter = filter;
  const channel = supabase.channel(channelName)
    .on('postgres_changes', channelConfig, callback)
    .subscribe();
  return channel;
}

export function unsubscribeChannel(channel) {
  if (supabase && channel) {
    supabase.removeChannel(channel);
  }
}
