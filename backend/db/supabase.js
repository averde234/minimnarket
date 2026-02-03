import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Asegurar que las variables de entorno se carguen
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ Faltan credenciales de Supabase en .env");
}

/*
 * Cliente estándar (ANON KEY)
 * Usado para operaciones públicas o autenticadas por usuario (JWT)
 */
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/*
 * Cliente Admin (SERVICE ROLE KEY)
 * ¡CUIDADO! Este cliente se salta las Row Level Security (RLS).
 * Usarlo solo en el backend para tareas administrativas.
 */
let supabaseAdmin = null;
if (supabaseServiceRoleKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
} else {
    console.warn("⚠️ SUPABASE_SERVICE_ROLE no está definido. Funciones administrativas podrían fallar.");
}

export const getSupabaseClient = () => supabase;

export const getSupabaseAdmin = () => {
    if (!supabaseAdmin) {
        console.warn("⚠️ Intentando usar Supabase Admin sin Service Role Key. Retornando cliente estándar.");
        return supabase;
    }
    return supabaseAdmin;
};

export default supabase;
