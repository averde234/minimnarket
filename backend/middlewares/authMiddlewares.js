import { getSupabaseClient } from '../db/supabase.js';
import { getUserByAuthId } from '../services/userServices.js';

const supabase = getSupabaseClient();

export async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token faltante' });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: 'Token inválido' });

  // Cargar perfil desde tu tabla users
  const userProfile = await getUserByAuthId(data.user.id);
  if (!userProfile) return res.status(403).json({ error: 'Usuario no registrado en tabla users' });

  req.user = userProfile; // contiene role, nombre, etc.
  next();
}