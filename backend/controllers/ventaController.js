import { getSupabaseClient, getSupabaseAdmin } from "../db/supabase.js";

const supabase = getSupabaseClient();       // Lectura con RLS
const supabaseAdmin = getSupabaseAdmin();   // Escritura controlada

// Registrar venta (seller o admin)
export async function registrarVenta(req, res) {
  const { venta, detalles } = req.body;

  try {
    // Forzar usuario_id desde el token para seguridad
    const ventaConUsuario = {
      ...venta,
      usuario_id: req.user.authId
    };

    const { data: ventaData, error: ventaError } = await supabaseAdmin
      .from("ventas")
      .insert([ventaConUsuario])
      .select(); // 👈 sin .single()

    if (ventaError) throw ventaError;

    // Insert devuelve un array, tomamos la primera fila
    const ventaInsertada = ventaData[0];

    const detallesConVenta = detalles.map(d => ({
      ...d,
      venta_id: ventaInsertada.id
    }));

    const { error: detalleError } = await supabaseAdmin
      .from("venta_detalle")
      .insert(detallesConVenta);

    if (detalleError) throw detalleError;

    res.status(201).json({ message: "Venta registrada correctamente", venta: ventaInsertada });
  } catch (err) {
    console.error("Error al registrar venta:", err);
    res.status(500).json({ message: "Error al registrar venta" });
  }
}

// Listar todas las ventas (solo admin)
export async function listarVentas(req, res) {
  const { data, error } = await supabase
    .from("ventas")
    .select(`
      id,
      usuario_id,
      total_bs,
      fecha,
      venta_detalle (
        id,
        producto_id,
        cantidad,
        precio_unitario_bs,
        subtotal_bs,
        productos (
          id,
          codigo_barra,
          descripcion,
          categoria_id
        )
      )
    `)
    .order("fecha", { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

// Obtener venta por ID (seller puede ver solo la suya)
export async function obtenerVentaPorId(req, res) {
  const { id } = req.params;
  const userId = req.user.authId;

  const { data, error } = await supabase
    .from("ventas")
    .select(`
      id,
      usuario_id,
      total_bs,
      fecha,
      venta_detalle (
        id,
        producto_id,
        cantidad,
        precio_unitario_bs,
        subtotal_bs,
        productos (
          id,
          codigo_barra,
          descripcion,
          categoria_id
        )
      )
    `)
    .eq("id", id)
    .eq("usuario_id", userId);

  if (error) return res.status(400).json({ error: error.message });

  res.json(data && data.length > 0 ? data[0] : null);
}