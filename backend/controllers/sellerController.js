import { getSupabaseClient, getSupabaseAdmin } from "../db/supabase.js";

const supabase = getSupabaseClient();       // Lectura con RLS
const supabaseAdmin = getSupabaseAdmin();   // Escritura controlada

// Listar productos
export const listProducts = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .order("id", { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Error al listar productos:", err);
    res.status(500).json({ message: "Error al listar productos" });
  }
};

// Ver inventario
export const viewInventory = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("inventario")
      .select("*")
      .order("id", { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Error al ver inventario:", err);
    res.status(500).json({ message: "Error al ver inventario" });
  }
};

// Registrar venta
export const registerSale = async (req, res) => {
  const { venta, detalles } = req.body;
  // venta: { cliente_id, fecha, total }
  // detalles: [{ producto_id, cantidad, precio_unitario }, ...]

  try {
    // Insertar venta
    const { data: ventaData, error: ventaError } = await supabaseAdmin
      .from("ventas")
      .insert([venta])
      .select()
      .single();

    if (ventaError) throw ventaError;

    // Insertar detalles
    const detallesConVenta = detalles.map(d => ({
      ...d,
      venta_id: ventaData.id
    }));

    const { error: detalleError } = await supabaseAdmin
      .from("venta_detalle")
      .insert(detallesConVenta);

    if (detalleError) throw detalleError;

    res.status(201).json({ message: "Venta registrada correctamente", venta: ventaData });
  } catch (err) {
    console.error("Error al registrar venta:", err);
    res.status(500).json({ message: "Error al registrar venta" });
  }
};