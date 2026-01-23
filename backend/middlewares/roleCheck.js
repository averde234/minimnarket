import { getSupabaseClient } from '../db/supabase.js';
const supabase = getSupabaseClient();

export default function roleCheck(requiredRole) {
  return async (req, res, next) => {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Buscar rol en tu tabla users
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', user.id)   // auth_id debe coincidir con el id de Supabase Auth
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.role !== requiredRole) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    // Usuario tiene el rol correcto
    next();
  };
}