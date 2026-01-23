import { Router } from 'express';
import {
  getCategorias,
  getCategoriaById,
  createCategoria,
  updateCategoria,
  deleteCategoria
} from '../controllers/categoriasController.js';

import auth from '../middlewares/auth.js';
import roleCheck from '../middlewares/roleCheck.js';

const router = Router();

// Todas las rutas (públicas)
router.get('/', getCategorias);
router.get('/:id', getCategoriaById);
router.post('/', createCategoria);
router.put('/:id', updateCategoria);
router.delete('/:id', deleteCategoria);

export default router;