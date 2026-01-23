import { getSupabaseClient } from '../db/supabase.js';

const supabase = getSupabaseClient();

// Registro de usuario
export async function signUp(req, res) {
  const { email, password, nombre, apellido, cedula, telefono, rol } = req.body;

  // Validación de campos obligatorios
  const missing = [];
  if (!email) missing.push('email');
  if (!password) missing.push('password');
  if (!nombre) missing.push('nombre');
  if (!apellido) missing.push('apellido');
  if (!cedula) missing.push('cedula');

  if (missing.length > 0) {
    return res.status(400).json({ error: `Faltan campos obligatorios: ${missing.join(', ')}` });
  }

  // Crear usuario en Supabase Auth con metadatos
  // El trigger 'on_auth_user_created' se encargará de copiar estos datos a la tabla 'public.users'
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nombre,
        apellido,
        cedula,
        telefono,
        rol: rol || 'vendedor' // Por defecto vendedor si no se envía
      }
    }
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  if (!data.user) {
    return res.status(400).json({ error: 'No se pudo crear el usuario. Verifique los datos.' });
  }

  res.status(201).json({
    message: 'Usuario registrado exitosamente. Por favor verifique su correo si es necesario.',
    user: {
      id: data.user.id,
      email: data.user.email,
      metadata: data.user.user_metadata
    }
  });
}

// Login de usuario
export async function signIn(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Faltan campos: email, password' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return res.status(401).json({ error: error.message });
  }

  // Obtenemos sesión y usuario
  const session = data.session;
  const user = data.user;

  res.json({
    message: 'Inicio de sesión exitoso',
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    user: {
      id: user.id,
      email: user.email,
      rol: user.user_metadata.rol,
      nombre: user.user_metadata.nombre
    }
  });
}

// Recuperación de contraseña
export async function forgotPassword(req, res) {
  const { email } = req.body;
  console.log('Solicitud de recuperación para:', email);

  if (!email) {
    return res.status(400).json({ error: 'El email es requerido' });
  }

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'http://localhost:3000/auth-reset-password.html' // Ajustar según tu ruta de reset real si existe, o usar defecto
  });

  if (error) {
    console.error('Error supabase resetPassword:', error);
    return res.status(400).json({ error: error.message });
  }

  console.log('Supabase resetPassword enviada:', data);
  res.json({ message: 'Se ha enviado un enlace de recuperación a tu correo.' });
}



// Actualizar contraseña (requiere token de acceso)
export async function updatePassword(req, res) {
  const { password, access_token, refresh_token } = req.body;

  if (!password || !access_token) {
    return res.status(400).json({ error: 'Contraseña y token son requeridos' });
  }

  // Usar una nueva instancia de cliente para no contaminar la global con setSession
  const tempSupabase = getSupabaseClient();

  const { error: sessionError } = await tempSupabase.auth.setSession({
    access_token,
    refresh_token
  });

  if (sessionError) {
    return res.status(401).json({ error: 'Sesión inválida o expirada: ' + sessionError.message });
  }

  const { data, error } = await tempSupabase.auth.updateUser({ password });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json({ message: 'Contraseña actualizada exitosamente.' });
}