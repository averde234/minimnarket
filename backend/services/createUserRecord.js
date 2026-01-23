import { getSupabaseClient } from '../db/supabase.js';
const supabase = getSupabaseClient();

export async function getUserByAuthId(authId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('authId', authId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}