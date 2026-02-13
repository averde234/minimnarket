// backend/controllers/inventarioController.js
import { getSupabaseClient, getSupabaseAdmin } from '../db/supabase.js';

// Cliente público (lectura con RLS)
const supabase = getSupabaseClient();
// Cliente admin (escritura sin RLS)
const supabaseAdmin = getSupabaseAdmin();

// Listar todo el inventario con joins anidados (publico, bypass RLS)
export const listarInventario = async (req, res) => {
  console.log("📦 Listando inventario...");
  try {
    const { data, error } = await supabaseAdmin
      .from("inventario")
      .select(`
        id,
        productos_id,
        cantidad,
        precio_entrada_usd,
        precio_salida_usd,
        precio_unidad_usd,
        porcentaje_ganancia,
        ganancia_usd,
        total_usd,
        productos (
          codigo_barra,
          descripcion,
          categorias (nombre)
        ),
        proveedor (nombre)
      `);

    if (error) {
      console.error("Error detallado Supabase:", error);
      return res.status(400).json({ message: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error("Error inesperado al listar inventario:", err);
    res.status(500).json({ message: "Error al listar inventario" });
  }
};

// Buscar un registro por ID con joins anidados (publico, bypass RLS)
export const obtenerInventarioPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from("inventario")
      .select(`
        id,
        cantidad,
        precio_entrada_usd,
        precio_salida_usd,
        precio_unidad_usd,
        porcentaje_ganancia,
        ganancia_usd,
        total_usd,
        productos (codigo_barra, descripcion),
        categorias (nombre),
        proveedor (nombre)
      `)
      .eq("id", id)
      .single();

    if (error) return res.status(404).json({ message: "Registro no encontrado" });
    res.json(data);
  } catch (err) {
    console.error("Error al obtener inventario:", err);
    res.status(500).json({ message: "Error al obtener inventario" });
  }
};

// Crear uno o varios registros (solo admin)
export const crearInventario = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("inventario")
      .insert(req.body) // acepta arrays
      .select();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error("Error al crear inventario:", err);
    res.status(500).json({ message: "Error al crear inventario", error: err.message });
  }
};

// Actualizar un registro (solo admin)
export const actualizarInventario = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from("inventario")
      .update(req.body)
      .eq("id", id)
      .select();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Error al actualizar inventario:", err);
    res.status(500).json({ message: "Error al actualizar inventario" });
  }
};

// Eliminar un registro (solo admin)
export const eliminarInventario = async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabaseAdmin
      .from("inventario")
      .delete()
      .eq("id", id);

    if (error) throw error;
    res.json({ message: "Registro eliminado correctamente" });
  } catch (err) {
    console.error("Error al eliminar inventario:", err);
    res.status(500).json({ message: "Error al eliminar inventario" });
  }
};