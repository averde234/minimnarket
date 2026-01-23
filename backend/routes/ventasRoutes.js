import express from 'express';
import { createVenta, listarVentas, getVentaById } from '../controllers/ventasController.js';

const router = express.Router();

// GET /api/ventas (Historial)
router.get('/', listarVentas);

// POST /api/ventas (Crear Venta)
router.post('/', createVenta);

// GET /api/ventas/:id (Detalle de Venta)
router.get('/:id', getVentaById);

export default router;
