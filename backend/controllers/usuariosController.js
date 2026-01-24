import { getSupabaseAdmin } from "../db/supabase.js";
const supabase = getSupabaseAdmin();

// Listar todos los usuarios
export async function getUsuarios(req, res) {
  try {
    // 1. Obtener perfiles de public.users
    const { data: profiles, error: profileError } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (profileError) throw profileError;

    // 2. Obtener usuarios de auth (para el email)
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) throw authError;

    // 3. Combinar datos
    const usuariosCompletos = profiles.map(profile => {
      const authUser = authUsers.find(u => u.id === profile.id);
      return {
        ...profile,
        email: authUser ? authUser.email : "Sin email",
        // Asegurar campos unificados
        role: profile.rol, // Mapear rol a role por compatibilidad si se usaba antes
        phone: profile.telefono
      };
    });

    res.json(usuariosCompletos);
  } catch (error) {
    console.error("Error getUsuarios:", error);
    res.status(500).json({ error: error.message });
  }
}

// Crear nuevo usuario
// Crear nuevo usuario (Admin)
export async function crearUsuario(req, res) {
  const { email, password, role, phone, nombre, apellido, cedula } = req.body;

  try {
    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar
      user_metadata: { nombre, apellido, cedula, telefono: phone, rol: role }
    });

    if (authError) throw authError;

    const auth_id = authData.user.id;

    // 2. Insertar en public.users (Si no tienes trigger automático, o para asegurar datos extras)
    // Nota: Si tienes un trigger 'on_auth_user_created' que inserta en public.users, este paso podría dar error de duplicado.
    // VERIFICA TU BASE DE DATOS. Si no tienes trigger, esto es necesario.
    // Asumiremos que NO hay trigger o que usamos upsert.

    const { data, error } = await supabase
      .from("users")
      .upsert([{
        id: auth_id, // Importante: usar el mismo ID
        auth_id,
        rol: role,
        email,
        telefono: phone,
        nombre: nombre, // A veces nombre guarda "Nombre Apellido"
        apellido,
        cedula
      }])
      .select()
      .single();

    if (error) {
      // Si falla insert en public, deberiamos borrar el auth user? 
      // Por ahora retornamos error.
      console.error("Error creating public profile:", error);
      throw error;
    }

    res.status(201).json(data);

  } catch (error) {
    console.error("Error crearUsuario:", error);
    res.status(400).json({ error: error.message });
  }
}

// Actualizar usuario
export async function actualizarUsuario(req, res) {
  const { id } = req.params;
  const { role, email, phone, nombre } = req.body;

  try {
    // 1. Actualizar datos en Auth (Email, Password si se enviara, etc)
    if (email) {
      const { error: authError } = await supabase.auth.admin.updateUserById(
        id, // El ID en public.users es el mismo que auth.users.id
        { email: email }
      );
      if (authError) throw authError;
    }

    // 2. Actualizar perfil en public.users
    const { data, error } = await supabase
      .from("users")
      .update({ rol: role, telefono: phone, nombre }) // No actualizamos email aqui pq no existe columna, o si existe es redundante pero la guia es Auth.
      // Si tu tabla users tiene columna email, agregala aqui tambien: .update({ role, phone, nombre, email })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);

  } catch (error) {
    console.error("Error actualizarUsuario:", error);
    res.status(400).json({ error: error.message });
  }
}

// Eliminar usuario
export async function eliminarUsuario(req, res) {
  const { id } = req.params;

  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "Usuario eliminado correctamente" });
}