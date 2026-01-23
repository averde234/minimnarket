// backend/controllers/categoriasController.js
import { getSupabaseClient, getSupabaseAdmin } from '../db/supabase.js';

// Cliente público (lectura con RLS)
const supabase = getSupabaseClient();
// Cliente admin (escritura sin RLS)
const supabaseAdmin = getSupabaseAdmin();

// Obtener todas las categorías (solo admin)
export const getCategorias = async (req, res) => {
  const { data, error } = await supabaseAdmin.from('categorias').select('*');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

// Obtener una categoría por ID (solo admin)
export const getCategoriaById = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabaseAdmin
    .from('categorias')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
};

// Crear nueva categoría (solo admin)
export const createCategoria = async (req, res) => {
  const { nombre } = req.body;
  const { data, error } = await supabaseAdmin
    .from('categorias')
    .insert([{ nombre }])
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
};

// Actualizar categoría (solo admin)
export const updateCategoria = async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;
  const { data, error } = await supabaseAdmin
    .from('categorias')
    .update({ nombre })
    .eq('id', id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

// Eliminar categoría (solo admin)
export const deleteCategoria = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabaseAdmin.from('categorias').delete().eq('id', id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Categoría eliminada correctamente' });
};