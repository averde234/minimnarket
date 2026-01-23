import { getSupabaseAdmin } from '../db/supabase.js';

const supabase = getSupabaseAdmin();

export const createVenta = async (req, res) => {
    const { items, total_usd, total_bs } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ error: "El carrito está vacío" });
    }

    try {
        // 1. Crear registro en tabla 'ventas' (Cabecera)
        // Asumimos que existe tabla 'ventas'. Si no, el usuario deberá crearla.
        // Estructura esperada: id, fecha, total_usd, total_bs
        const { data: ventaData, error: ventaError } = await supabase
            .from('ventas')
            .insert([{
                total_usd: total_usd,
                total_bs: total_bs
            }]) // Supabase pone fecha default now() usualmente
            .select()
            .single();

        if (ventaError) throw new Error("Error creando venta: " + ventaError.message);

        const ventaId = ventaData.id;

        // 2. Procesar items
        for (const item of items) {
            // A. Insertar en 'venta_detalle' (si existe) o saltar este paso si solo queremos actualizar stock.
            // Vamos a asumir que queremos bajar stock de 'inventario'.

            // B. Descontar del inventario
            // Lógica simple: Buscar lotes del producto y restar cantidad.

            const { data: lotes, error: lotesError } = await supabase
                .from('inventario')
                .select('*')
                .eq('productos_id', item.producto_id)
                .gt('cantidad', 0)
                .order('id', { ascending: true }); // FIFO: Gastamos lo viejo primero

            if (lotesError) throw new Error("Error consultando inventario para producto " + item.producto_id);

            let cantidadRestante = item.cantidad;

            for (const lote of lotes) {
                if (cantidadRestante <= 0) break;

                const descuento = Math.min(cantidadRestante, lote.cantidad);

                // Actualizar lote
                const { error: updateError } = await supabase
                    .from('inventario')
                    .update({ cantidad: lote.cantidad - descuento })
                    .eq('id', lote.id);

                if (updateError) throw new Error("Error actualizando stock lote " + lote.id);

                cantidadRestante -= descuento;
            }

            if (cantidadRestante > 0) {
                // Opcional: Lanzar error si no alcanzó el stock, pero ya descontamos de otros lotes (rollback complejo).
                console.warn(`Producto ${item.producto_id} vendido sin stock suficiente en sistema.`);
            }

            // C. Guardar detalle
            // Tabla correcta: 'venta_detalle' (singular)
            const subtotal = item.cantidad * item.precio_unitario;

            const { error: detalleError } = await supabase
                .from('venta_detalle')
                .insert([{
                    venta_id: ventaId,
                    producto_id: item.producto_id,
                    cantidad: item.cantidad,
                    precio_unitario_usd: item.precio_unitario, // Precio en USD
                    subtotal_usd: subtotal,
                    precio_unitario_bs: 0 // Placeholder, se podría calcular si se recibe el cambio
                }]);

            if (detalleError) console.error("Error guardando detalle venta:", detalleError);
        }

        res.json({ message: "Venta procesada correctamente", id: ventaId });

    } catch (error) {
        console.error("Error procesando venta:", error);
        res.status(500).json({ error: error.message });
    }
};

export const listarVentas = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('ventas')
            .select(`
                id,
                fecha,
                total_usd,
                total_bs
            `)
            .order('fecha', { ascending: false });

        if (error) throw new Error(error.message);

        res.json(data);
    } catch (error) {
        console.error("Error listando ventas:", error);
        res.status(500).json({ error: error.message });
    }
};

export const getVentaById = async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Obtener cabecera
        const { data: venta, error: errorVenta } = await supabase
            .from('ventas')
            .select('*')
            .eq('id', id)
            .single();

        if (errorVenta) throw new Error("Venta no encontrada: " + errorVenta.message);

        // 2. Obtener detalles
        const { data: detalles, error: errorDetalles } = await supabase
            .from('venta_detalle')
            .select(`
                cantidad,
                precio_unitario_usd,
                subtotal_usd,
                productos (
                    descripcion,
                    codigo_barra
                )
            `)
            .eq('venta_id', id);

        if (errorDetalles) throw new Error("Error cargando detalles: " + errorDetalles.message);

        // 3. Combinar
        const resultado = {
            ...venta,
            venta_detalle: detalles
        };

        res.json(resultado);
    } catch (error) {
        console.error("Error obteniendo venta:", error);
        res.status(500).json({ error: error.message });
    }
};
