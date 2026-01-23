// backend/db/supabase.js
import { createClient } from "@supabase/supabase-js";

// Cliente público (para frontend y operaciones con RLS)
export const getSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("SUPABASE_URL y SUPABASE_ANON_KEY son requeridos");
  }

  return createClient(supabaseUrl, anonKey);
};

// Cliente con service_role (para backend seguro, sin RLS)
export const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL y SUPABASE_SERVICE_ROLE son requeridos");
  }

  return createClient(supabaseUrl, serviceRoleKey);
};