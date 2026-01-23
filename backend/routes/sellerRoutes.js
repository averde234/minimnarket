import express from 'express';
import auth from '../middlewares/auth.js';
import roleCheck from '../middlewares/roleCheck.js';
import { listProducts, viewInventory, registerSale } from '../controllers/sellerController.js';

const router = express.Router();

// Todas las rutas requieren autenticación y rol vendedor
router.use(auth);
router.get('/productos', roleCheck('vendedor'), listProducts);
router.get('/inventario', roleCheck('vendedor'), viewInventory);
router.post('/ventas', roleCheck('vendedor'), registerSale);

export default router;