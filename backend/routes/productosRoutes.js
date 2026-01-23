import { Router } from 'express';
import {
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
  getProductoByCodigo
} from '../controllers/productosController.js';

import auth from '../middlewares/auth.js';
import roleCheck from '../middlewares/roleCheck.js';

const router = Router();

// Listar productos (acceso público)
router.get('/', getProductos);

// Buscar producto por ID (público)
router.get('/:id', getProductoById);

// Buscar producto por código (público)
router.get('/codigo/:codigo', getProductoByCodigo);

// Crear producto (público)
router.post('/', createProducto);

// Actualizar producto (público)
router.put('/:id', updateProducto);

// Eliminar producto (público)
router.delete('/:id', deleteProducto);

export default router;