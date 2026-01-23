// backend/controllers/productosController.js
import { getSupabaseClient, getSupabaseAdmin } from '../db/supabase.js';

// Cliente público (lectura con RLS)
const supabase = getSupabaseClient();
// Cliente admin (escritura sin RLS)
const supabaseAdmin = getSupabaseAdmin();

// Obtener todos los productos con paginación y filtros (seller y admin)
export const getProductos = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = (req.query.search || '').trim();
  const categoriaId = req.query.categoria_id || '';

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseAdmin
    .from('productos')
    .select('*, categorias(nombre)', { count: 'exact' })
    .order('id', { ascending: true });

  if (categoriaId) {
    query = query.eq('categoria_id', categoriaId);
  }

  if (search) {
    query = query.ilike('descripcion', `%${search}%`);
  }

  const { data, error, count } = await query.range(from, to);

  // const { data, error, count } = await query.range(from, to); // Previous line is already there

  if (error) {
    console.error("Error al obtener productos:", error);
    return res.status(400).json({ error: error.message });
  }

  res.json({
    productos: data,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit)
  });
};

// Obtener producto por ID (seller y admin)
export const getProductoById = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return res.status(404).json({ error: error.message });
  }
  res.json(data);
};

// Obtener producto por código de barra (seller y admin)
export const getProductoByCodigo = async (req, res) => {
  const { codigo } = req.params;
  console.log(`🔍 Buscando producto con código: '${codigo}'`);

  // Usamos supabaseAdmin para saltar RLS en esta búsqueda pública
  const { data, error } = await supabaseAdmin
    .from('productos')
    .select('*')
    .eq('codigo_barra', codigo)
    .single();

  if (error) {
    console.error("❌ Error Supabase:", error);
  }

  if (!data) {
    console.warn("⚠️ Producto no encontrado o data vacía.");
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  console.log("✅ Producto encontrado:", data);
  res.json(data);
};

// Crear producto (público)
export const createProducto = async (req, res) => {
  const { codigo_barra, descripcion, categoria_id, categorias_id } = req.body;

  // Normalizar: permitir que envíen 'categorias_id' o 'categoria_id'
  const finalCategoriaId = categoria_id || categorias_id;

  const producto = {
    codigo_barra,
    descripcion,
    categoria_id: finalCategoriaId
  };

  const { data, error } = await supabaseAdmin
    .from('productos')
    .insert([producto])
    .select()
    .single();

  if (error) {
    console.error("Error Supabase:", error);
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data);
};

// Actualizar producto (público)
export const updateProducto = async (req, res) => {
  const { id } = req.params;
  const { codigo_barra, descripcion, categoria_id, categorias_id } = req.body;

  const finalCategoriaId = categoria_id || categorias_id;

  const { data, error } = await supabaseAdmin
    .from('productos')
    .update({ codigo_barra, descripcion, categoria_id: finalCategoriaId })
    .eq('id', id)
    .select();

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  res.json(data);
};

// Eliminar producto (solo admin)
export const deleteProducto = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabaseAdmin
    .from('productos')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  res.json({ message: 'Producto eliminado correctamente' });
};