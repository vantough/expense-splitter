import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey);
export const supabase = supabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

export async function fetchCloudGroups(userId) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('groups')
    .select('id, name, data, created_at, updated_at')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    people: row.data?.people ?? [],
    expenses: row.data?.expenses ?? [],
    payments: row.data?.payments ?? [],
    savedSplits: row.data?.savedSplits ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ownerId: userId,
  }));
}

export async function saveCloudGroups(groups, userId) {
  if (!supabase || !groups.length) return;
  const rows = groups.map((group) => ({
    id: group.id,
    name: group.name,
    created_by: userId,
    data: {
      people: group.people ?? [],
      expenses: group.expenses ?? [],
      payments: group.payments ?? [],
      savedSplits: group.savedSplits ?? [],
    },
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from('groups').upsert(rows);
  if (error) throw error;
}

export async function removeCloudGroup(id) {
  if (!supabase) return;
  const { error } = await supabase.from('groups').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchProfile(userId) {
  if (!supabase) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveProfile(userId, profile) {
  if (!supabase) return;
  const { error } = await supabase.from('profiles').upsert({ id: userId, ...profile });
  if (error) throw error;
}
