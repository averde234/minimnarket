import express from 'express';
import { registrarVenta, listarVentas, obtenerVentaPorId } from '../controllers/ventaController.js';
import auth from '../middlewares/auth.js';
import roleCheck from '../middlewares/roleCheck.js';

const router = express.Router();

// Solo vendedores pueden registrar ventas
router.post('/', auth, roleCheck('seller'), registrarVenta);

// Admin puede ver todas las ventas
router.get('/', auth, roleCheck('admin'), listarVentas);

// Seller puede ver su propia venta por ID
router.get('/:id', auth, roleCheck('seller'), obtenerVentaPorId);

export default router;