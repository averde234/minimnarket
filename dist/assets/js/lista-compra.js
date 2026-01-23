
document.addEventListener("DOMContentLoaded", async () => {
    const API_URL = "http://localhost:5000";
    const tablaCuerpo = document.getElementById("tbody-compras");
    const precioDolarLabel = document.getElementById("precio-dolar");
    const cardContent = document.querySelector(".card-content"); // Container for controls

    let precioDolar = 1;
    let allCompras = [];
    let filteredCompras = [];
    let currentPage = 1;
    const itemsPerPage = 10;

    // --- Inject CSS for Thin Rows ---
    const style = document.createElement('style');
    style.innerHTML = `
        #tablaCompras td, #tablaCompras th { padding: 0.4rem 0.5rem !important; }
        .form-control-sm { min-height: 30px; }
    `;
    document.head.appendChild(style);

    // --- Inject Search Controls (Top) ---
    // Create a div before the table-responsive div
    const controlsDiv = document.createElement('div');
    controlsDiv.className = "d-flex justify-content-end align-items-center mb-3 px-4 pt-3"; // Padding to match card
    controlsDiv.innerHTML = `
        <div>
            <input type="text" id="searchInput" class="form-control form-control-sm" placeholder="Buscar..." style="width: 200px;">
        </div>
    `;
    // Insert before the table container
    const tableResponsive = document.querySelector(".table-responsive");
    if (cardContent && tableResponsive) {
        cardContent.insertBefore(controlsDiv, tableResponsive);
    }

    // --- Inject Pagination Controls (Bottom) ---
    const paginationDiv = document.createElement('div');
    paginationDiv.id = "pagination-controls";
    paginationDiv.className = "d-flex justify-content-between align-items-center mt-3 px-4 pb-3";
    if (cardContent) cardContent.appendChild(paginationDiv);

    // 1. Cargar Dolar
    const cargarDolar = async () => {
        try {
            const res = await fetch(`${API_URL}/dolar`);
            const data = await res.json();
            precioDolar = data?.current?.usd ?? data?.promedio ?? data?.usd ?? 1;

            if (precioDolarLabel) {
                precioDolarLabel.textContent = precioDolar.toFixed(2) + " Bs/USD";
            }
        } catch (error) {
            console.error("Error cargando dólar:", error);
            if (precioDolarLabel) precioDolarLabel.textContent = "Error";
        }
    };

    const cargarHistorialCompras = async () => {
        try {
            const res = await fetch(`${API_URL}/inventario`);
            if (!res.ok) throw new Error("Error cargando historial");

            const inventario = await res.json();

            // Ordenar por ID descendente
            inventario.sort((a, b) => b.id - a.id);

            allCompras = inventario;
            filteredCompras = [...allCompras];
            currentPage = 1;

            if (allCompras.length === 0) {
                tablaCuerpo.innerHTML = "<tr><td colspan='9' class='text-center'>No hay compras registradas.</td></tr>";
                return;
            }

            renderTabla(currentPage);

        } catch (error) {
            console.error("Error historial compras:", error);
            tablaCuerpo.innerHTML = "<tr><td colspan='9' class='text-center text-danger'>Error al cargar historial.</td></tr>";
        }
    };

    const renderTabla = (page) => {
        tablaCuerpo.innerHTML = "";

        const totalItems = filteredCompras.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        currentPage = page;

        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const itemsToShow = filteredCompras.slice(start, end);

        if (itemsToShow.length === 0) {
            tablaCuerpo.innerHTML = "<tr><td colspan='9' class='text-center'>No se encontraron resultados.</td></tr>";
            actualizarControlesPaginacion(0);
            return;
        }

        itemsToShow.forEach(item => {
            const tr = document.createElement("tr");

            const fechaRaw = item.created_at || new Date().toISOString();
            const fechaObj = new Date(fechaRaw);
            const fechaStr = fechaObj.toLocaleDateString() + " " + fechaObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const codigo = item.productos?.codigo_barra || "S/C";
            const descripcion = item.productos?.descripcion || "Sin descripción";
            const cantidad = item.cantidad;
            const costoUnitUsd = parseFloat(item.precio_entrada_usd);
            const totalUsd = parseFloat(item.total_usd) || (costoUnitUsd * parseFloat(item.cantidad));

            // Cálculos en Bs
            const costoUnitBs = costoUnitUsd * precioDolar;
            const totalBs = totalUsd * precioDolar;

            const proveedor = item.proveedor?.nombre || "No especificado";

            tr.innerHTML = `
                <td>${fechaStr}</td>
                <td>${codigo}</td>
                <td>${descripcion}</td>
                <td>${cantidad}</td>
                <td>$${costoUnitUsd.toFixed(2)}</td>
                <td>${costoUnitBs.toFixed(2)} Bs</td>
                <td>$${totalUsd.toFixed(2)}</td>
                <td>${totalBs.toFixed(2)} Bs</td>
                <td>${proveedor}</td>
            `;

            tablaCuerpo.appendChild(tr);
        });

        actualizarControlesPaginacion(totalPages);
    };

    const actualizarControlesPaginacion = (totalPages) => {
        paginationDiv.innerHTML = `
            <button class="btn btn-sm btn-primary" id="prevPage" ${currentPage === 1 ? 'disabled' : ''}>Anterior</button>
            <span class="text-muted">Página ${currentPage} de ${totalPages}</span>
            <button class="btn btn-sm btn-primary" id="nextPage" ${currentPage >= totalPages ? 'disabled' : ''}>Siguiente</button>
        `;

        document.getElementById("prevPage").onclick = () => {
            if (currentPage > 1) renderTabla(currentPage - 1);
        };

        document.getElementById("nextPage").onclick = () => {
            if (currentPage < totalPages) renderTabla(currentPage + 1);
        };
    };

    // Event Listener for Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase().trim();
            filteredCompras = allCompras.filter(item => {
                const codigo = String(item.productos?.codigo_barra || '').toLowerCase();
                const desc = String(item.productos?.descripcion || '').toLowerCase();
                const prov = String(item.proveedor?.nombre || '').toLowerCase();
                return codigo.includes(term) || desc.includes(term) || prov.includes(term);
            });
            currentPage = 1;
            renderTabla(currentPage);
        });
    }

    await cargarDolar();
    await cargarHistorialCompras();
});
