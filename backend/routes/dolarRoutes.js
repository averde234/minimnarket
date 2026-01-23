import express from "express";
import { obtenerTipoCambio } from "../controllers/cambiobcv.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

// GET /dolar → visible para cualquier usuario autenticado
router.get("/", obtenerTipoCambio);

export default router;