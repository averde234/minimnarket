import express from 'express';
import auth from '../middlewares/auth.js';
import roleCheck from '../middlewares/roleCheck.js';
import { createProducto, updateProducto, deleteProducto } from '../controllers/adminController.js';

const router = express.Router();

// Todas las rutas requieren autenticación y rol admin
router.use(auth);

router.post('/productos', roleCheck('admin'), createProducto);
router.put('/productos/:id', roleCheck('admin'), updateProducto);
router.delete('/productos/:id', roleCheck('admin'), deleteProducto);

export default router;