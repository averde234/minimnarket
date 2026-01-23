import { getSupabaseAdmin } from '../db/supabase.js';

const supabaseAdmin = getSupabaseAdmin();

// Crear registro en tabla users con service_role
export async function createUserRecord({ authId, role, email, phone, nombre }) {
  // Validación básica
  if (!authId || !email || !role || !nombre) {
    throw new Error('Faltan campos obligatorios: authId, email, role, nombre');
  }

  // Validación de rol
  if (!['admin', 'seller'].includes(role)) {
    throw new Error('Rol inválido. Debe ser "admin" o "seller".');
  }

  const { error } = await supabaseAdmin
    .from('users')
    .insert([
      {
        auth_id: authId,
        role,
        email,
        phone,
        nombre
      }
    ]);

  if (error) {
    throw new Error(`Error creando usuario en tabla users: ${error.message}`);
  }

  return { message: 'Usuario insertado en tabla users correctamente' };
}