// index.js
import './config.js';
import express from "express";
import cors from "cors";
import path from "path";

// Importar cliente Supabase (si lo necesitas en middlewares/servicios)
import { getSupabaseClient } from "./backend/db/supabase.js";
const supabase = getSupabaseClient();

// Importar rutas
import categoriasRoutes from "./backend/routes/categoriasRoutes.js";
import productosRoutes from "./backend/routes/productosRoutes.js";
import proveedorRoutes from "./backend/routes/proveedorRoutes.js";
import dolarRoutes from "./backend/routes/dolarRoutes.js";
import inventarioRoutes from "./backend/routes/inventarioRoutes.js";
import authRoutes from "./backend/routes/authRoutes.js";
import adminRoutes from "./backend/routes/adminRoutes.js";
import sellerRoutes from "./backend/routes/sellerRoutes.js";
import ventaRoutes from "./backend/routes/ventasRoutes.js";
import usuariosRoutes from "./backend/routes/usuariosRoutes.js";
import dashboardRoutes from "./backend/routes/dashboardRoutes.js";

// ...
// ...

const app = express();
const __dirname = path.resolve();

// Middlewares globales
app.use(cors()); // Permitir todas las conexiones por ahora para evitar errores de CORS
app.use(express.json());

// Servir frontend compilado (dist)
app.use(express.static(path.join(__dirname, "dist")));

// Montar rutas backend
app.use("/categorias", categoriasRoutes);
app.use("/productos", productosRoutes);
app.use("/proveedores", proveedorRoutes);
app.use("/dolar", dolarRoutes);
app.use("/inventario", inventarioRoutes);
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/seller", sellerRoutes);
app.use("/ventas", ventaRoutes);
app.use("/usuarios", usuariosRoutes);
app.use("/dashboard", dashboardRoutes);

// Ruta de prueba
app.get("/ping", (req, res) => {
  res.send("Servidor funcionando correctamente ✅");
});

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});