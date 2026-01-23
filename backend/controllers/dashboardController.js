import { getSupabaseAdmin } from '../db/supabase.js';
import fetch from "node-fetch";

const supabase = getSupabaseAdmin();

export const getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

        // 1. Tasa del Dólar (External API or fallback)
        let tasaDolar = 0;
        try {
            const dolarRes = await fetch("https://api.dolarvzla.com/public/exchange-rate", {
                headers: { "User-Agent": "Mozilla/5.0" }
            });
            if (dolarRes.ok) {
                const dolarData = await dolarRes.json();
                if (dolarData.current && dolarData.current.usd) {
                    tasaDolar = dolarData.current.usd;
                } else {
                    tasaDolar = dolarData.price || dolarData.promedio || 0;
                }
            }
        } catch (e) {
            console.warn("Dashboard: Error fetching dollar rate, using 0", e);
        }

        // 2. Ventas del Día
        // Sum total_usd for today
        const { data: ventasHoy, error: errorHoy } = await supabase
            .from('ventas')
            .select('total_usd')
            .gte('fecha', startOfDay)
            .lte('fecha', endOfDay);

        const totalVentasHoyUsd = ventasHoy ? ventasHoy.reduce((acc, v) => acc + parseFloat(v.total_usd || 0), 0) : 0;
        const countVentasHoy = ventasHoy ? ventasHoy.length : 0;

        // 3. Ventas del Mes (Actual)
        const { data: ventasMes, error: errorMes } = await supabase
            .from('ventas')
            .select('total_usd')
            .gte('fecha', startOfMonth)
            .lte('fecha', endOfMonth);

        const totalVentasMesUsd = ventasMes ? ventasMes.reduce((acc, v) => acc + parseFloat(v.total_usd || 0), 0) : 0;

        // 3a. Ventas del Mes Anterior (Para comparación)
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString();
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0).toISOString();

        const { data: ventasMesAnt, error: errorMesAnt } = await supabase
            .from('ventas')
            .select('total_usd')
            .gte('fecha', startOfLastMonth)
            .lte('fecha', endOfLastMonth);

        const totalVentasMesAntUsd = ventasMesAnt ? ventasMesAnt.reduce((acc, v) => acc + parseFloat(v.total_usd || 0), 0) : 0;

        let percentageChange = 0;
        if (totalVentasMesAntUsd === 0) {
            percentageChange = totalVentasMesUsd > 0 ? 100 : 0;
        } else {
            percentageChange = ((totalVentasMesUsd - totalVentasMesAntUsd) / totalVentasMesAntUsd) * 100;
        }

        // 4. Datos del Gráfico (Ventas por mes del año actual)
        const startOfYear = new Date(today.getFullYear(), 0, 1).toISOString();
        const endOfYear = new Date(today.getFullYear(), 11, 31).toISOString();

        const { data: ventasAnio, error: errorAnio } = await supabase
            .from('ventas')
            .select('fecha, total_usd')
            .gte('fecha', startOfYear)
            .lte('fecha', endOfYear);

        const monthlySales = Array(12).fill(0);
        if (ventasAnio) {
            ventasAnio.forEach(venta => {
                if (venta.fecha) {
                    const month = new Date(venta.fecha).getMonth(); // 0-11
                    monthlySales[month] += parseFloat(venta.total_usd || 0);
                }
            });
        }

        // 5. Total Productos
        const { count: totalProductos, error: errorProd } = await supabase
            .from('productos')
            .select('*', { count: 'exact', head: true });

        // 6. Total Usuarios
        let totalUsuarios = 0;
        try {
            const { count, error } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });
            if (!error) totalUsuarios = count;
        } catch (e) { console.log("Error contando usuarios", e); }

        // 7. Productos con Bajo Stock (< 20) (Calculado desde Inventario)
        // Fetch all inventory items (assuming not huge dataset for now)
        const { data: invData, error: invError } = await supabase
            .from('inventario')
            .select(`
                cantidad,
                productos (
                    codigo_barra,
                    descripcion
                )
            `);

        // Aggregate stock by barcode
        const stockMap = {};
        if (invData) {
            console.log(`Dashboard: Fetched ${invData.length} inventory items.`);
            if (invData.length > 0) console.log("Sample item:", JSON.stringify(invData[0])); // Debug properties

            invData.forEach(item => {
                const prod = item.productos;
                if (prod && prod.codigo_barra) {
                    if (!stockMap[prod.codigo_barra]) {
                        stockMap[prod.codigo_barra] = {
                            codigo_barras: prod.codigo_barra,
                            descripcion: prod.descripcion,
                            stock: 0
                        };
                    }
                    stockMap[prod.codigo_barra].stock += parseInt(item.cantidad || 0);
                } else {
                    // Debug missing product or barcode
                    // console.log("Item missing product linkage:", item);
                }
            });
        }

        // Filter < 20, Sort ASC, Limit 10
        const lowStockProducts = Object.values(stockMap)
            .filter(p => p.stock < 20)
            .sort((a, b) => a.stock - b.stock)
            .slice(0, 10);

        console.log("Low Stock Products found:", lowStockProducts.length);
        if (lowStockProducts.length > 0) console.log("First low stock:", lowStockProducts[0]);




        res.json({
            tasa_dolar: tasaDolar,
            ventas_hoy: {
                total_usd: totalVentasHoyUsd,
                count: countVentasHoy
            },
            ventas_mes: {
                total_usd: totalVentasMesUsd,
                percentage_change: percentageChange
            },
            monthly_sales: monthlySales,
            low_stock_products: lowStockProducts || [],
            total_productos: totalProductos || 0,
            total_usuarios: totalUsuarios || 0
        });

    } catch (error) {
        console.error("Error getting dashboard stats:", error);
        res.status(500).json({ error: error.message });
    }
};
