import { getSupabaseClient } from '../db/supabase.js';

const supabase = getSupabaseClient();

export default async function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = authHeader.replace('Bearer ', '');

  // Validar token con Supabase
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  // Guardar usuario en la request para usarlo en controladores
  req.user = data.user;
  next();
}

