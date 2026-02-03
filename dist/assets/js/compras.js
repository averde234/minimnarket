document.addEventListener("DOMContentLoaded", () => {
    // Detectar entorno: Local vs Producción
    const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:5000'
        : 'https://minimnarket.onrender.com';

    // Inputs
    const codigoBarra = document.getElementById("codigoBarra");
    const cantidadInput = document.getElementById("cantidad");
    const productoInput = document.getElementById("producto");
    const porcentajeInput = document.getElementById("porcentajeGanancia");
    const proveedorSelect = document.getElementById("proveedor");

    // BS Inputs
    const precioEntradaBs = document.getElementById("precioEntradaBs");
    const precioSalidaBs = document.getElementById("precioSalidaBs");
    const margenGananciaBs = document.getElementById("margenGananciaBs");
    const precioUnidadBs = document.getElementById("precioUnidadBs");

    // USD Inputs
    const precioEntradaUsd = document.getElementById("precioEntradaUsd");
    const precioSalidaUsd = document.getElementById("precioSalidaUsd");
    const margenGananciaUsd = document.getElementById("margenGananciaUsd");
    const precioUnidadUsd = document.getElementById("precioUnidadUsd");

    // Botones
    const btnGuardar = document.getElementById("guardarInventario");
    const btnLimpiar = document.getElementById("limpiar");
    const btnBuscar = document.getElementById("buscarCodigo");

    // Alertas
    const alertSuccess = document.getElementById("alert-success");
    const alertError = document.getElementById("alert-error");

    const mostrarAlerta = (tipo, tiempo = 3000) => {
        if (tipo === "success") {
            alertSuccess.style.display = "block";
            setTimeout(() => alertSuccess.style.display = "none", tiempo);
        } else if (tipo === "error") {
            alertError.style.display = "block";
            setTimeout(() => alertError.style.display = "none", tiempo);
        }
    };

    // Tasa de cambio
    const precioDolarLabel = document.getElementById("precio-dolar");
    let precioDolarActual = null;
    let inventarioId = null;
    let categoriaId = null; // Guardaremos la categoría del producto

    const normalizarNumero = valor => parseFloat(valor.toString().replace(",", ".")) || 0;

    const limpiarFormulario = () => {
        document.querySelectorAll("input").forEach(i => i.value = "");
        productoInput.dataset.id = "";
        proveedorSelect.selectedIndex = 0;
        inventarioId = null;
        categoriaId = null;
    };

    const cargarPrecioDolar = async () => {
        try {
            console.log("Consultando API Dolar...");
            const res = await fetch(`${API_URL}/dolar`);
            if (!res.ok) throw new Error("Error HTTP: " + res.status);

            const data = await res.json();
            console.log("Respuesta Dolar API:", data);

            precioDolarActual = data?.current?.usd ?? data?.promedio ?? data?.usd ?? 1;
        } catch (error) {
            console.error("Error cargando dólar:", error);
            precioDolarActual = 1;
        }

        // Actualizar UI de forma segura
        if (precioDolarLabel) {
            precioDolarLabel.textContent = precioDolarActual > 0 ? precioDolarActual.toFixed(2) : "1.00";
        }
    };

    const cargarProveedores = async () => {
        try {
            const res = await fetch(`${API_URL}/proveedores`);
            const proveedores = await res.json();
            proveedorSelect.innerHTML = "<option selected>Seleccione proveedor</option>";

            // Ajuste por si el endpoint devuelve { proveedores: [...] } o [...]
            const lista = Array.isArray(proveedores) ? proveedores : (proveedores.proveedores || []);

            lista.forEach(p => {
                const opt = document.createElement("option");
                opt.value = p.id;
                opt.textContent = p.nombre;
                proveedorSelect.appendChild(opt);
            });
        } catch (error) {
            console.error("Error cargando proveedores:", error);
        }
    };

    const recalcular = () => {
        const cantidad = normalizarNumero(cantidadInput.value);
        const tasa = precioDolarActual || 1;

        let pBs = normalizarNumero(precioEntradaBs.value);
        let pUsd = normalizarNumero(precioEntradaUsd.value);

        // Conversión en tiempo real Bs <-> USD (Entrada)
        if (document.activeElement === precioEntradaBs) {
            precioEntradaUsd.value = (pBs / tasa).toFixed(2);
            pUsd = pBs / tasa;
        } else if (document.activeElement === precioEntradaUsd) {
            precioEntradaBs.value = (pUsd * tasa).toFixed(2);
            pBs = pUsd * tasa;
        }

        const margenPorcentaje = normalizarNumero(porcentajeInput.value);
        const margenDecimal = margenPorcentaje / 100;

        // Asumimos que "Precio Entrada" es el COSTO TOTAL DEL LOTE (Inputs del usuario son totales)
        // Por lo tanto, pOutBs será el PRECIO DE VENTA TOTAL.
        let pOutBs = 0;
        if (margenDecimal < 1) {
            pOutBs = pBs / (1 - margenDecimal);
        } else {
            pOutBs = pBs * (1 + margenDecimal);
        }

        const pOutUsd = pOutBs / tasa;

        // Mostrar PRECIO DE SALIDA (TOTAL)
        precioSalidaBs.value = pOutBs.toFixed(2);
        precioSalidaUsd.value = pOutUsd.toFixed(2);

        // Margen de ganancia (Total)
        const gananciaBs = pOutBs - pBs;
        const gananciaUsd = pOutUsd - pUsd;

        margenGananciaBs.value = gananciaBs.toFixed(2);
        margenGananciaUsd.value = gananciaUsd.toFixed(2);

        // Precio Unitario = Precio Salida Total / Cantidad
        if (cantidad > 0) {
            precioUnidadBs.value = (pOutBs / cantidad).toFixed(2);
            precioUnidadUsd.value = (pOutUsd / cantidad).toFixed(2);
        } else {
            precioUnidadBs.value = "0.00";
            precioUnidadUsd.value = "0.00";
        }



    };

    cantidadInput.addEventListener("input", recalcular);
    precioEntradaBs.addEventListener("input", recalcular);
    precioEntradaUsd.addEventListener("input", recalcular);
    porcentajeInput.addEventListener("input", recalcular);

    // Guardar inventario
    btnGuardar.addEventListener("click", async () => {
        const productos_id = parseInt(productoInput.dataset.id);
        const proveedor_id = parseInt(proveedorSelect.value);
        const cantidad = normalizarNumero(cantidadInput.value);
        const precioEntrada = normalizarNumero(precioEntradaUsd.value);
        const precioSalida = normalizarNumero(precioSalidaUsd.value);
        const porcentaje = normalizarNumero(porcentajeInput.value);
        const precioUnidad = normalizarNumero(precioUnidadUsd.value);
        const margen = normalizarNumero(margenGananciaUsd.value);
        // El total (factura) es Cantidad * Precio Unitario (pSalidaUsd que es unitario)
        const total = cantidad * precioSalida;

        // Validación: Campos obligatorios
        if (!productos_id || isNaN(productos_id) ||
            !proveedor_id || isNaN(proveedor_id) ||
            cantidad <= 0 ||
            precioEntrada <= 0 ||
            cantidadInput.value.trim() === "" ||
            porcentajeInput.value.trim() === "") {

            mostrarAlerta("error");
            return;
        }

        // Calcular VALORES UNITARIOS para guardar en DB (La DB espera unitarios para Ventas)
        // precioEntrada, precioSalida, margen aquí son TOTALES DEL LOTE.
        // total es EL TOTAL DEL LOTE.

        const unitEntrada = cantidad > 0 ? precioEntrada / cantidad : 0;
        const unitSalida = cantidad > 0 ? precioSalida / cantidad : 0;
        const unitMargen = cantidad > 0 ? margen / cantidad : 0;
        // precioUnidad ya es unitario (calculado en recalcular)

        const bodyData = {
            productos_id,
            categorias_id: categoriaId,
            proveedor_id,
            cantidad,
            precio_entrada_usd: unitEntrada, // Guardar UNITARIO
            precio_salida_usd: unitSalida,   // Guardar UNITARIO
            precio_unidad_usd: precioUnidad, // Guardar UNITARIO
            porcentaje_ganancia: porcentaje,
            ganancia_usd: unitMargen,        // Guardar UNITARIO
            total_usd: precioSalida          // Guardar TOTAL LOTE
        };

        console.log("Enviando (Unitarios):", bodyData);

        try {
            const response = await fetch(`${API_URL}/inventario`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bodyData)
            });

            if (response.ok) {
                mostrarAlerta("success");
                limpiarFormulario();
            } else {
                const err = await response.json();
                console.error("Error al guardar:", err);
                mostrarAlerta("error");
            }
        } catch (error) {
            console.error("Error en guardar:", error);
            mostrarAlerta("error");
        }
    });

    btnLimpiar.addEventListener("click", limpiarFormulario);

    // Modal elements
    // Usamos jQuery dado que la plantilla parece ser Bootstrap 4 y tiene jQuery cargado en app.js/vendors
    // Modal elements
    // Workaround: Disparar evento click en botón oculto para abrir modal (evita dependencia de bootstrap/jquery global)
    const btnOpenModal = document.getElementById('btnOpenModal');
    // Para cerrar, buscamos el botón 'cancelar' o la 'x' dentro del modal
    const btnCloseModal = document.querySelector('#modalAgregarProducto .close');
    const modalCodigoInput = document.getElementById('modalCodigo');
    const modalDescripcionInput = document.getElementById('modalDescripcion');
    const modalCategoriaSelect = document.getElementById('modalCategoria');
    const btnGuardarProducto = document.getElementById('btnGuardarProducto');

    const cargarCategorias = async () => {
        try {
            const res = await fetch(`${API_URL}/categorias`);
            const categorias = await res.json();

            // Limpiar opciones manteniendo la primera
            modalCategoriaSelect.innerHTML = '<option value="" selected disabled>Seleccione una categoría</option>';

            const lista = Array.isArray(categorias) ? categorias : (categorias.categorias || []);

            lista.forEach(c => {
                const opt = document.createElement("option");
                opt.value = c.id;
                opt.textContent = c.nombre;
                modalCategoriaSelect.appendChild(opt);
            });
        } catch (error) {
            console.error("Error cargando categorías:", error);
        }
    };

    // Guardar nuevo producto desde modal API
    btnGuardarProducto.addEventListener('click', async () => {
        const codigo = modalCodigoInput.value;
        const descripcion = modalDescripcionInput.value;
        const categoria_id = modalCategoriaSelect.value;

        const alertErrorModal = document.getElementById("modal-alert-error");
        const alertSuccessModal = document.getElementById("modal-alert-success");

        const showModalAlert = (msg, type) => {
            if (type === 'error') {
                alertErrorModal.innerText = msg;
                alertErrorModal.style.display = "block";
                alertSuccessModal.style.display = "none";
                setTimeout(() => alertErrorModal.style.display = "none", 3000);
            } else {
                alertSuccessModal.innerText = msg;
                alertSuccessModal.style.display = "block";
                alertErrorModal.style.display = "none";
                setTimeout(() => alertSuccessModal.style.display = "none", 3000);
            }
        };

        if (!descripcion || !categoria_id) {
            showModalAlert("Por favor complete todos los campos del producto.", "error");
            return;
        }

        try {
            const body = { codigo_barra: codigo, descripcion, categoria_id };
            const res = await fetch(`${API_URL}/productos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) throw new Error("Error al crear producto");

            const nuevoProducto = await res.json();

            // Cerrar modal
            if (btnCloseModal) btnCloseModal.click();

            // Auto-rellenar formulario principal
            productoInput.value = nuevoProducto.descripcion;
            productoInput.dataset.id = nuevoProducto.id;
            categoriaId = nuevoProducto.categoria_id;

            // Resetear inputs de precio para ingresar datos de la compra
            precioEntradaBs.value = "";
            precioEntradaUsd.value = "";

            alert("Producto creado exitosamente. Puede continuar con la compra."); // Main alert

        } catch (error) {
            console.error("Error creando producto:", error);
            showModalAlert("Error al crear el producto. Verifique los datos.", "error");
        }
    });

    // Buscar producto por código de barra
    btnBuscar.addEventListener("click", async () => {
        const codigo = codigoBarra.value.trim();
        if (!codigo) return mostrarAlerta("error");

        try {
            const res = await fetch(`${API_URL}/productos/codigo/${codigo}`);
            // if (!res.ok) throw new Error("Producto no encontrado"); // Eliminamos esto para manejar el 404

            if (res.status === 404 || !res.ok) {
                // Producto no encontrado -> Abrir Modal
                modalCodigoInput.value = codigo;
                modalDescripcionInput.value = "";
                modalCategoriaSelect.value = ""; // Reset select
                if (btnOpenModal) btnOpenModal.click(); // ABRIR MODAL
                return;
            }

            const data = await res.json();
            // Soporte para estructura array o objeto único
            const p = Array.isArray(data) ? data[0] : (data.productos ? data.productos[0] : data);

            if (!p) throw new Error("Producto no encontrado (data vacía)");

            console.log("Producto encontrado:", p);

            productoInput.value = p.descripcion || "";
            productoInput.dataset.id = p.id || "";
            categoriaId = p.categoria_id || p.categorias_id || null; // Ajuste por si el nombre de columna varía

            proveedorSelect.selectedIndex = 0;
            precioEntradaBs.value = 0;
            precioEntradaUsd.value = 0;
            porcentajeInput.value = 0;

            recalcular();
        } catch (error) {
            console.error("Error al buscar producto:", error);
            productoInput.value = "";
            productoInput.dataset.id = "";

            alertError.innerText = "Error general al buscar producto.";
            mostrarAlerta("error");
        }
    });


    // --- Lógica para Agregar Categoría (Nueva funcionalidad) ---
    const btnGuardarCategoria = document.getElementById("btnGuardarCategoria");
    const inputNombreCategoria = document.getElementById("inputNombreCategoria");
    const btnCloseCatModal = document.querySelector("#modalAgregarCategoria .close");

    if (btnGuardarCategoria) {
        btnGuardarCategoria.addEventListener("click", async () => {
            const nombre = inputNombreCategoria.value.trim();
            const alertErrorCat = document.getElementById("cat-alert-error");
            const alertSuccessCat = document.getElementById("cat-alert-success");

            const showCatAlert = (msg, type) => {
                if (type === 'error') {
                    alertErrorCat.innerText = msg;
                    alertErrorCat.style.display = "block";
                    alertSuccessCat.style.display = "none";
                    setTimeout(() => alertErrorCat.style.display = "none", 3000);
                } else {
                    alertSuccessCat.innerText = msg;
                    alertSuccessCat.style.display = "block";
                    alertErrorCat.style.display = "none";
                    setTimeout(() => alertSuccessCat.style.display = "none", 3000);
                }
            };

            if (!nombre) return showCatAlert("Ingrese un nombre para la categoría", "error");

            try {
                const res = await fetch(`${API_URL}/categorias`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre })
                });

                if (!res.ok) {
                    const errData = await res.json();
                    if (res.status === 409 || (errData.error && errData.error.includes("exist"))) {
                        throw new Error("La categoría ya existe");
                    }
                    throw new Error(errData.error || "Error al guardar categoría");
                }

                showCatAlert("Categoría agregada correctamente", "success");
                inputNombreCategoria.value = "";

                // Recargar el select de categorías
                await cargarCategorias();

                // Opcional: Cerrar modal después de un tiempo
                setTimeout(() => {
                    if (btnCloseCatModal) btnCloseCatModal.click();
                }, 1500);

            } catch (error) {
                console.error(error);
                const msg = error.message === "La categoría ya existe" ? "La categoría ya existe." : "Error al guardar la categoría.";
                showCatAlert(msg, "error");
            }
        });
    }

    // Inicializar
    (async () => {
        await cargarPrecioDolar();
        await cargarProveedores();
        await cargarCategorias();
    })();
});
