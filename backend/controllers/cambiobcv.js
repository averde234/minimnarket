// backend/controllers/cambiobcv.js
import fetch from "node-fetch";

// Obtener tipo de cambio desde la API externa
export const obtenerTipoCambio = async (req, res) => {
  try {
    const response = await fetch("https://api.dolarvzla.com/public/exchange-rate", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });

    if (!response.ok) {
      throw new Error(`Error al consultar la API: ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data); // Devolvemos la respuesta tal cual
  } catch (error) {
    console.error("Error en obtenerTipoCambio:", error);
    res.status(500).json({ error: error.message, stack: error.toString() });
  }
};