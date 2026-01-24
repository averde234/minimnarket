document.addEventListener("DOMContentLoaded", async () => {
    // const API_URL = "https://minimnarket.onrender.com";
    const API_URL = "http://localhost:3000"; // Usar backend local para probar cambios recientes

    // Elementos del DOM
    const codigoInput = document.getElementById("codigoBarra");
    const btnBuscar = document.getElementById("btnBuscar");
    const cartBody = document.getElementById("cart-body");
    const emptyMsg = document.getElementById("empty-msg");
    const totalUsdEl = document.getElementById("total-usd");
    const totalBsEl = document.getElementById("total-bs");
    const btnProcesar = document.getElementById("btnProcesar");
    const btnLimpiar = document.getElementById("btnLimpiar");
    const precioDolarLabel = document.getElementById("precio-dolar");

    // Estado local
    let cart = []; // Array de objetos { id, codigo, descripcion, precioUsd, cantidad, invId }
    let precioDolar = 1;

    // Alertas
    const alertSuccess = document.getElementById("alert-success");
    const alertError = document.getElementById("alert-error");

    const mostrarAlerta = (msg, tipo = "error") => {
        const el = tipo === "error" ? alertError : alertSuccess;
        el.textContent = msg;
        el.style.display = "block";
        setTimeout(() => el.style.display = "none", 3000);
    };

    // 1. Cargar Dólar
    const cargarDolar = async () => {
        try {
            const res = await fetch(`${API_URL}/dolar`);
            const data = await res.json();
            precioDolar = data?.current?.usd ?? data?.promedio ?? data?.usd ?? 1;
            precioDolarLabel.textContent = precioDolar.toFixed(2) + " Bs/USD";
            renderCart(); // Re-renderizar precios en Bs
        } catch (error) {
            console.error("Error cargando dólar:", error);
            precioDolarLabel.textContent = "Error";
        }
    };

    // 2. Buscar Producto y Agregarlo
    const agregarProducto = async () => {
        const codigo = codigoInput.value.trim();
        if (!codigo) return;

        try {
            // Buscar por código en el ENDPOINT de VENTAS (que debería verificar stock)
            // O podemos usar inventario/sku/:codigo si existe, o buscar en productos y luego verificar stock.
            // Para simplificar: Buscamos en productos -> luego buscamos disponibilidad en inventario.

            // Paso A: Buscar info del producto
            const resProd = await fetch(`${API_URL}/productos/codigo/${codigo}`);
            if (!resProd.ok) throw new Error("Producto no encontrado");
            const dataProd = await resProd.json();
            const producto = Array.isArray(dataProd) ? dataProd[0] : (dataProd.productos ? dataProd.productos[0] : dataProd);

            if (!producto) throw new Error("Producto no existe");

            // Paso B: Buscar precio y stock en INVENTARIO (Tomamos el precio más reciente)
            // Esto es un poco hacky si no tenemos endpoint dedicado, pero vamos a filtrar el inventario.
            // Idealmente el backend debería darnos "precio de venta actual" y "stock".
            // Vamos a consultar todo el inventario y filtrar en cliente (menos eficiente pero rápido de implementar ahora).

            const resInv = await fetch(`${API_URL}/inventario`);
            const inventario = await resInv.json();

            // Buscar registros de este producto que tengan stock
            const lotes = inventario.filter(i => i.productos_id === producto.id && i.cantidad > 0);

            if (lotes.length === 0) {
                mostrarAlerta(`El producto "${producto.descripcion}" no tiene stock disponible.`);
                return;
            }

            // Usamos el lote más reciente (mayor ID) para el precio
            const loteReciente = lotes.sort((a, b) => b.id - a.id)[0];

            const precioVenta = parseFloat(loteReciente.precio_salida_usd);

            // Verificar si ya está en el carrito
            const existingItem = cart.find(c => c.codigo === codigo);

            if (existingItem) {
                // Verificar si hay suficiente stock global
                // Stock total disponible
                const totalStock = lotes.reduce((sum, item) => sum + parseFloat(item.cantidad), 0);
                if (existingItem.cantidad + 1 > totalStock) {
                    mostrarAlerta("No hay más stock disponible para este producto.");
                    return;
                }
                existingItem.cantidad++;
            } else {
                cart.push({
                    id: producto.id,
                    codigo: producto.codigo_barra,
                    descripcion: producto.descripcion,
                    precioUsd: precioVenta,
                    cantidad: 1,
                    // No guardamos ID de inventario específico aquí porque al procesar la venta
                    // el backend debería descontar del stock usando FIFO o LIFO.
                });
            }

            // Reset UI
            codigoInput.value = "";
            codigoInput.focus();
            renderCart();

        } catch (error) {
            console.error("Error adding product:", error);
            mostrarAlerta("Error: " + error.message);
            codigoInput.select();
        }
    };

    // 3. Renderizar Carrito
    const renderCart = () => {
        cartBody.innerHTML = "";
        let totalUsd = 0;

        if (cart.length === 0) {
            emptyMsg.style.display = "block";
            tablaVentas.style.display = "none";
        } else {
            emptyMsg.style.display = "none";
            tablaVentas.style.display = "table";

            cart.forEach((item, index) => {
                const subtotal = item.cantidad * item.precioUsd;
                totalUsd += subtotal;
                const precioBs = item.precioUsd * precioDolar;

                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td class="align-middle">${item.codigo}</td>
                    <td class="align-middle">${item.descripcion}</td>
                    <td class="align-middle">$${item.precioUsd.toFixed(2)}</td>
                    <td class="align-middle">${precioBs.toFixed(2)} Bs</td>
                    <td>
                        <input type="number" class="form-control form-control-sm cantidad-input" 
                               style="width: 50px; padding: 0.1rem; text-align: center; height: 25px;"
                               value="${item.cantidad}" min="1" data-id="${item.codigo}">
                    </td>
                    <td>$${subtotal.toFixed(2)}</td>
                    <td>
                        <button class="btn btn-sm btn-danger btn-remove" data-id="${item.codigo}">
                            <i data-feather="x"></i>
                        </button>
                    </td>
                `;
                cartBody.appendChild(tr);
            });
        }

        // Actualizar totales
        const totalBs = totalUsd * precioDolar;
        const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0);

        document.getElementById("total-items").textContent = `${totalItems} Artículos`;
        totalUsdEl.textContent = `$${totalUsd.toFixed(2)}`;
        totalBsEl.textContent = `Bs ${totalBs.toFixed(2)}`;

        // Re-inicializar iconos
        if (feather) feather.replace();

        // Listeners
        // 1. Eliminar
        document.querySelectorAll(".btn-remove").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const cod = e.currentTarget.dataset.id;
                cart = cart.filter(c => c.codigo !== cod);
                renderCart();
            });
        });

        // 2. Cambio en input cantidad
        document.querySelectorAll(".cantidad-input").forEach(input => {
            input.addEventListener("change", (e) => {
                const cod = e.currentTarget.dataset.id;
                const val = parseInt(e.target.value);
                if (val < 1) {
                    e.target.value = 1;
                    return;
                }
                const item = cart.find(c => c.codigo === cod);
                if (item) {
                    item.cantidad = val;
                    // Aquí podríamos re-validar stock si quisiéramos
                    renderCart();
                }
            });
        });
    };

    // 4. Procesar Venta
    const procesarVenta = async () => {
        if (cart.length === 0) return mostrarAlerta("El carrito está vacío.");



        // if (!confirm("¿Confirmar venta?")) return; // Alerta eliminada a petición del usuario

        // Recalcular totales desde los datos para evitar errores de parseo del DOM
        const calculatedTotalUsd = cart.reduce((acc, item) => acc + (item.cantidad * item.precioUsd), 0);
        const calculatedTotalBs = calculatedTotalUsd * precioDolar;

        // Obtener usuario logueado
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        console.log("Usuario detectado para venta:", user); // Debug Log

        // payload
        const venta = {
            total_usd: parseFloat(calculatedTotalUsd.toFixed(2)),
            total_bs: parseFloat(calculatedTotalBs.toFixed(2)),
            usuario_id: user ? user.id : null, // Enviar ID del usuario
            items: cart.map(c => ({
                producto_id: c.id,
                cantidad: c.cantidad,
                precio_unitario: c.precioUsd
            }))
        };

        try {
            const res = await fetch(`${API_URL}/ventas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(venta)
            });

            const result = await res.json();

            if (!res.ok) throw new Error(result.message || result.error || "Error al procesar venta");

            mostrarAlerta("Venta procesada exitosamente", "success");
            cart = [];
            renderCart();
            codigoInput.focus();

        } catch (error) {
            console.error(error);
            mostrarAlerta("Error: " + error.message);
        }
    };

    // Listeners Globales
    btnBuscar.addEventListener("click", agregarProducto);
    codigoInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") agregarProducto();
    });

    btnLimpiar.addEventListener("click", () => {
        if (confirm("¿Vaciar carrito?")) {
            cart = [];
            renderCart();
            codigoInput.focus();
        }
    });

    btnProcesar.addEventListener("click", procesarVenta);

    // Init
    await cargarDolar();
    codigoInput.focus();
});
