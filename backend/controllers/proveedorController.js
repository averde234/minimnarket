// backend/controllers/proveedorController.js
import { getSupabaseAdmin } from '../db/supabase.js';
const supabase = getSupabaseAdmin();

// Listar todos los proveedores (solo admin)
export const listarProveedores = async (req, res) => {
  try {
    const { data, error } = await supabase.from('proveedor').select('*');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al listar proveedores' });
  }
};

// Obtener proveedor por ID (solo admin)
export const obtenerProveedorPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('proveedor')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return res.status(404).json({ message: 'Proveedor no encontrado' });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener proveedor' });
  }
};

// Crear proveedor (solo admin)
export const crearProveedor = async (req, res) => {
  const { rif, nombre, direccion, telefono, correo } = req.body;
  try {
    const { data, error } = await supabase
      .from('proveedor')
      .insert([{ rif, nombre, direccion, telefono, correo }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al crear proveedor' });
  }
};

// Actualizar proveedor (solo admin)
export const actualizarProveedor = async (req, res) => {
  const { id } = req.params;
  const { rif, nombre, direccion, telefono, correo } = req.body;
  try {
    const { data, error } = await supabase
      .from('proveedor')
      .update({ rif, nombre, direccion, telefono, correo })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar proveedor' });
  }
};

// Eliminar proveedor (solo admin)
export const eliminarProveedor = async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from('proveedor').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Proveedor eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al eliminar proveedor' });
  }
};