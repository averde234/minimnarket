import express from "express";
import {
  listarInventario,
  obtenerInventarioPorId,
  crearInventario,
  actualizarInventario,
  eliminarInventario
} from "../controllers/inventarioController.js";

import auth from "../middlewares/auth.js";
import roleCheck from "../middlewares/roleCheck.js";

const router = express.Router();

// Ver inventario (público)
router.get("/", listarInventario);
router.get("/:id", obtenerInventarioPorId);

// Crear inventario (público)
router.post("/", crearInventario);

// Actualizar inventario (público)
router.put("/:id", actualizarInventario);

// Eliminar inventario (público)
router.delete("/:id", eliminarInventario);

export default router;