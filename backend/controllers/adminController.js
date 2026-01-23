import { getSupabaseAdmin } from "../db/supabase.js";
const supabase = getSupabaseAdmin();

// Crear producto (solo admin)
export const createProducto = async (req, res) => {
  const producto = req.body;

  const { data, error } = await supabase
    .from("productos")
    .insert([producto])
    .select()
    .single();

  if (error) {
    console.error("Error al crear producto:", error);
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data);
};

// Actualizar producto (solo admin)
export const updateProducto = async (req, res) => {
  const { id } = req.params;
  const { codigo_barra, descripcion, categoria_id } = req.body;

  const { data, error } = await supabase
    .from("productos")
    .update({ codigo_barra, descripcion, categoria_id })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error al actualizar producto:", error);
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
};

// Eliminar producto (solo admin)
export const deleteProducto = async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("productos")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error al eliminar producto:", error);
    return res.status(400).json({ error: error.message });
  }

  res.json({ message: "Producto eliminado correctamente" });
};