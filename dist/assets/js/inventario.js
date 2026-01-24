document.addEventListener("DOMContentLoaded", async () => {
    const API_URL = "https://minimnarket.onrender.com";
    const tablaCuerpo = document.querySelector("#table1 tbody");
    const precioDolarLabel = document.getElementById("precio-dolar");
    let precioDolar = 1;
    let listaGlobalInventario = [];
    let filteredInventario = []; // Nueva lista filtrada
    let currentPage = 1;

    // --- Inject CSS for Thin Rows ---
    const style = document.createElement('style');
    style.innerHTML = `
        #table1 td, #table1 th { padding: 0.4rem 0.5rem !important; }
        .form-control-sm { min-height: 30px; }
    `;
    document.head.appendChild(style);

    // --- Inject Search Controls (Top) ---
    // Inyectamos antes de la tabla para que quede arriba a la derecha (justify-content-end)
    const cardBody = document.querySelector(".card-body");
    const controlsDiv = document.createElement('div');
    controlsDiv.className = "d-flex justify-content-end align-items-center mb-3";
    controlsDiv.innerHTML = `
        <div>
            <input type="text" id="searchInput" class="form-control form-control-sm" placeholder="Buscar..." style="width: 200px;">
        </div>
    `;
    if (cardBody) cardBody.insertBefore(controlsDiv, cardBody.firstChild);

    // 1. Cargar Precio del Dólar
    const cargarDolar = async () => {
        try {
            const res = await fetch(`${API_URL}/dolar`);
            const data = await res.json();
            precioDolar = data?.current?.usd ?? data?.promedio ?? data?.usd ?? 1;
            precioDolarLabel.textContent = precioDolar.toFixed(2) + " Bs/USD";
        } catch (error) {
            console.error("Error al cargar dólar:", error);
            precioDolarLabel.textContent = "Error";
        }
    };

    // 2. Cargar Inventario
    const cargarInventario = async () => {
        try {
            const res = await fetch(`${API_URL}/inventario`);
            if (!res.ok) throw new Error("Error al consultar API");
            const inventario = await res.json();

            // Limpiar tabla
            tablaCuerpo.innerHTML = "";

            if (inventario.length === 0) {
                tablaCuerpo.innerHTML = "<tr><td colspan='5' class='text-center'>No hay productos en inventario.</td></tr>";
                return;
            }

            // Agrupar por código de barra...
            const agrupado = {};

            inventario.forEach(item => {
                const codigo = item.productos?.codigo_barra || "S/C";
                const descripcion = item.productos?.descripcion || "Sin descripción";
                const cantidad = parseFloat(item.cantidad) || 0;
                const precioUsd = parseFloat(item.precio_salida_usd) || 0;

                const key = codigo === "S/C" ? descripcion : codigo;

                if (!agrupado[key]) {
                    agrupado[key] = {
                        codigo,
                        descripcion,
                        cantidad: 0,
                        precioUsd: 0,
                        lastId: -1,
                        proveedor: item.proveedor?.nombre || "N/A",
                        categoria: item.productos?.categorias?.nombre || "N/A",
                        precioEntrada: parseFloat(item.precio_entrada_usd) || 0,
                        margen: parseFloat(item.porcentaje_ganancia) || 0,
                        ganancia: parseFloat(item.ganancia_usd) || 0
                    };
                }

                agrupado[key].cantidad += cantidad;

                if (item.id > agrupado[key].lastId) {
                    agrupado[key].precioUsd = precioUsd;
                    agrupado[key].lastId = item.id;
                    agrupado[key].proveedor = item.proveedor?.nombre || "N/A";
                    agrupado[key].categoria = item.productos?.categorias?.nombre || "N/A";
                    agrupado[key].precioEntrada = parseFloat(item.precio_entrada_usd) || 0;
                    agrupado[key].margen = parseFloat(item.porcentaje_ganancia) || 0;
                    agrupado[key].ganancia = parseFloat(item.ganancia_usd) || 0;
                }
            });

            // Convertir objeto agrupado a array
            listaGlobalInventario = Object.values(agrupado);
            filteredInventario = [...listaGlobalInventario]; // Inicializar filtrados
            currentPage = 1;
            renderTabla(currentPage);

        } catch (error) {
            console.error("Error al cargar inventario:", error);
            tablaCuerpo.innerHTML = "<tr><td colspan='5' class='text-center text-danger'>Error cargando datos.</td></tr>";
        }
    };

    // Listener para buscar
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase().trim();
            filteredInventario = listaGlobalInventario.filter(item => {
                const code = String(item.codigo || '').toLowerCase();
                const desc = String(item.descripcion || '').toLowerCase();
                return code.includes(term) || desc.includes(term);
            });
            currentPage = 1;
            renderTabla(currentPage);
        });
    }

    // 3. Función para renderizar tabla con paginación
    const renderTabla = (page) => {
        tablaCuerpo.innerHTML = "";

        const itemsPerPage = 15;
        const totalItems = filteredInventario.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        // Validar página
        if (page < 1) page = 1;
        if (page > totalPages && totalPages > 0) page = totalPages;
        currentPage = page;

        // Calcular slice
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const itemsToShow = filteredInventario.slice(start, end);

        if (itemsToShow.length === 0) {
            tablaCuerpo.innerHTML = "<tr><td colspan='5' class='text-center'>No hay productos para mostrar.</td></tr>";
            actualizarControlesPaginacion(0);
            return;
        }

        itemsToShow.forEach(item => {
            const tr = document.createElement("tr");

            // Precios: La BD guarda en USD. Calculamos Bs con la tasa actual.
            const precioBs = item.precioUsd * precioDolar;

            const linkDetalle = document.createElement("a");
            linkDetalle.href = "#";
            linkDetalle.textContent = item.descripcion;
            linkDetalle.style.fontWeight = "bold";
            linkDetalle.style.color = "black";
            linkDetalle.style.textDecoration = "none";
            linkDetalle.onclick = (e) => {
                e.preventDefault();
                mostrarDetalle(item);
            };

            const tdDesc = document.createElement("td");
            tdDesc.appendChild(linkDetalle);

            tr.innerHTML = `
                <td>${item.codigo}</td>
                
                <td>${item.cantidad}</td>
                <td>${precioBs.toFixed(2)} Bs</td>
                <td>$${item.precioUsd.toFixed(2)}</td>
            `;
            tr.insertBefore(tdDesc, tr.children[1]);
            tablaCuerpo.appendChild(tr);
        });

        actualizarControlesPaginacion(totalPages);
    };

    // 4. Controles de Paginación
    const actualizarControlesPaginacion = (totalPages) => {
        let paginationDiv = document.getElementById("pagination-controls");

        if (!paginationDiv) {
            // Crear contenedor si no existe (debajo de la tabla)
            paginationDiv = document.createElement("div");
            paginationDiv.id = "pagination-controls";
            paginationDiv.className = "d-flex justify-content-between align-items-center mt-3";
            document.querySelector(".card-body").appendChild(paginationDiv);
        }

        paginationDiv.innerHTML = `
            <button class="btn btn-sm btn-primary" id="prevPage" ${currentPage === 1 ? 'disabled' : ''}>Anterior</button>
            <span>Página ${currentPage} de ${totalPages || 1}</span>
            <button class="btn btn-sm btn-primary" id="nextPage" ${currentPage >= totalPages ? 'disabled' : ''}>Siguiente</button>
        `;

        document.getElementById("prevPage").addEventListener("click", () => {
            if (currentPage > 1) renderTabla(currentPage - 1);
        });

        document.getElementById("nextPage").addEventListener("click", () => {
            if (currentPage < totalPages) renderTabla(currentPage + 1);
        });
    };

    // 5. Función para mostrar modal
    const mostrarDetalle = (item) => {
        const modalBody = document.getElementById("modal-body-inventario");

        // Cálculos en Bs para el detalle
        const pEntradaBs = item.precioEntrada * precioDolar;
        const pSalidaBs = item.precioUsd * precioDolar;
        const gananciaBs = item.ganancia * precioDolar;

        modalBody.innerHTML = `
            <div class="list-group">
                <div class="list-group-item">
                    <strong>Producto:</strong> ${item.descripcion} (${item.codigo})
                </div>
                <div class="list-group-item">
                    <strong>Categoría:</strong> ${item.categoria}
                </div>
                <div class="list-group-item">
                    <strong>Existencia Total:</strong> ${item.cantidad} unidades
                </div>
                <div class="list-group-item">
                    <div class="row">
                        <div class="col-6">
                            <h6 class="mb-1">Costos (USD)</h6>
                            <small>Entrada: $${item.precioEntrada.toFixed(2)}</small><br>
                            <small>Salida: $${item.precioUsd.toFixed(2)}</small><br>
                            <small>Ganancia: $${item.ganancia.toFixed(2)} (${item.margen}%)</small>
                        </div>
                        <div class="col-6">
                            <h6 class="mb-1">Costos (Bs)</h6>
                            <small>Entrada: ${pEntradaBs.toFixed(2)} Bs</small><br>
                            <small>Salida: ${pSalidaBs.toFixed(2)} Bs</small><br>
                            <small>Ganancia: ${gananciaBs.toFixed(2)} Bs</small>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Abrir modal usando Bootstrap 5
        const modalEl = document.getElementById('detalleInventarioModal');

        try {
            // Intentar encontrar Bootstrap en el scope global o en window
            const bs = window.bootstrap || bootstrap;

            if (bs && bs.Modal) {
                const modal = new bs.Modal(modalEl);
                modal.show();
            } else {
                console.error("Bootstrap no está definido. Intentando fallback jQuery...");
                // Fallback por si acaso usan jQuery/Bootstrap 4 en el template
                if (window.jQuery && window.jQuery(modalEl).modal) {
                    window.jQuery(modalEl).modal('show');
                } else {
                    alert("Error: No se pudo cargar la librería del Modal (Bootstrap).");
                }
            }
        } catch (e) {
            console.error("Error al abrir modal:", e);
            // Último intento: Toggle manual (poco probable que funcione bien sin estilos, pero es algo)
            // modalEl.classList.add('show');
            // modalEl.style.display = 'block';
            alert("Error crítico abriendo modal: " + e.message);
        }
    };

    // Inicializar
    await cargarDolar();
    await cargarInventario();
});
