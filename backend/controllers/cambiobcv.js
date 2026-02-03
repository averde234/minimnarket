// backend/controllers/cambiobcv.js
import fetch from "node-fetch";

// Obtener tipo de cambio desde la API externa
export const obtenerTipoCambio = async (req, res) => {
  try {
    const response = await fetch("https://ve.dolarapi.com/v1/dolares");

    if (!response.ok) {
      throw new Error(`Error al consultar la API: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Find official rate (BCV) from the structure: [{ fuente: 'oficial', ... }, { fuente: 'paralelo', ... }]
    const oficial = Array.isArray(data) ? data.find(d => d.fuente === 'oficial') : null;
    const rate = oficial ? oficial.promedio : (data.promedio || 0);

    // Return format compatible with frontend usage (data.current.usd ?? data.promedio)
    res.json({
        promedio: rate,
        current: { usd: rate },
        fuente: 'oficial',
        fechaActualizacion: oficial ? oficial.fechaActualizacion : new Date()
    });
  } catch (error) {
    console.error("Error en obtenerTipoCambio:", error);
    // Fallback in case of error, maybe 0 or last known
    res.status(500).json({ error: error.message, stack: error.toString(), promedio: 0 });
  }
};