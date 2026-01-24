

const tableBody = document.querySelector('#tablaVentas tbody');
const API_URL = 'https://minimnarket.onrender.com';
const cardContent = document.querySelector(".card-content");

let allVentas = [];
let filteredVentas = [];
let currentPage = 1;
const itemsPerPage = 10;

// --- Inject CSS for Thin Rows ---
const style = document.createElement('style');
style.innerHTML = `
    #tablaVentas td, #tablaVentas th { padding: 0.2rem 0.5rem !important; vertical-align: middle; }
    #tablaVentas td:last-child, #tablaVentas th:last-child { padding-right: 0 !important; }
    #tablaVentas .btn-sm { padding: 0.1rem 0.5rem; font-size: 0.8rem; }
    .form-control-sm { min-height: 30px; }
`;
document.head.appendChild(style);



// --- Inject Pagination Controls (Bottom) ---
const paginationDiv = document.createElement('div');
paginationDiv.id = "pagination-controls";
paginationDiv.className = "d-flex justify-content-between align-items-center mt-3 px-4 pb-3";
if (cardContent) cardContent.appendChild(paginationDiv);


const loadVentas = async () => {
    try {
        const [ventasRes, rateRes] = await Promise.all([
            fetch(`${API_URL}/ventas`),
            fetch(`${API_URL}/dolar`).catch(err => ({ ok: false }))
        ]);

        if (!ventasRes.ok) throw new Error("Error al obtener ventas");

        const ventas = await ventasRes.json();

        let rate = 0;
        try {
            if (rateRes && rateRes.ok) {
                const rateData = await rateRes.json();
                rate = rateData.price || 0;
            }
        } catch (e) { console.warn("Error parsing rate", e); }

        // Store globally and init
        allVentas = ventas.map(v => {
            // Pre-calculate display values to avoid doing it every render
            let bsVal = parseFloat(v.total_bs || 0);
            if (bsVal === 0 && rate > 0) {
                bsVal = parseFloat(v.total_usd || 0) * rate;
            }
            return { ...v, totalBsDisplay: bsVal.toFixed(2) };
        });

        // Sort descending by ID or Date (assuming ID is good proxy)
        allVentas.sort((a, b) => b.id - a.id);

        filteredVentas = [...allVentas];
        currentPage = 1;
        renderTable(currentPage);

    } catch (error) {
        console.error(error);
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Error: ${error.message}</td></tr>`;
    }
};

const renderTable = (page) => {
    tableBody.innerHTML = "";

    const totalItems = filteredVentas.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    currentPage = page;

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const itemsToShow = filteredVentas.slice(start, end);

    if (itemsToShow.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center">No hay ventas registradas</td></tr>`;
        actualizarControlesPaginacion(0);
        return;
    }

    itemsToShow.forEach(v => {
        const fecha = new Date(v.fecha).toLocaleString();

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${v.id}</td>
            <td>${fecha}</td>
            <td><span class="badge bg-light-success text-success">$${parseFloat(v.total_usd).toFixed(2)}</span></td>
            <td><span class="badge bg-light-secondary text-secondary">Bs ${v.totalBsDisplay}</span></td>
            <td class="text-end">
                <button class="btn btn-primary btn-sm btn-ver-detalle" data-id="${v.id}">
                    <i data-feather="eye"></i> Ver
                </button>
            </td>
        `;
        tableBody.appendChild(tr);
    });

    if (typeof feather !== 'undefined') {
        feather.replace();
    }

    document.querySelectorAll('.btn-ver-detalle').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            verDetalleVenta(id);
        });
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
        if (currentPage > 1) renderTable(currentPage - 1);
    };

    document.getElementById("nextPage").onclick = () => {
        if (currentPage < totalPages) renderTable(currentPage + 1);
    };
};



const verDetalleVenta = async (id) => {
    try {
        const res = await fetch(`${API_URL}/ventas/${id}`);
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Server Error (${res.status}): ${errorText}`);
        }

        const sale = await res.json();

        // Fetch current rate to fallback if sale.total_bs is 0 (historic data fix)
        let rate = 0;
        if (sale.total_usd > 0 && sale.total_bs > 0) {
            rate = sale.total_bs / sale.total_usd;
        } else {
            // Fetch current rate if implicit rate is missing
            try {
                const rateRes = await fetch(`${API_URL}/dolar`);
                const rateData = await rateRes.json();
                rate = rateData.price || 0;
            } catch (e) {
                console.warn("Could not fetch current rate for fallback", e);
            }
        }

        const dateObj = new Date(sale.fecha);

        // Populate Receipt Metadata
        // Safely set text content only if element exists
        const setText = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        };

        // Client/Vendor info removed from HTML, so these checks prevent errors
        setText('r_cliente', "Cliente General");
        setText('r_rif', "V-00000000");
        setText('r_vendedor', "Vendedor de Turno");

        setText('r_factura', sale.id.toString().padStart(8, '0'));
        setText('r_fecha', dateObj.toLocaleDateString('es-VE'));
        setText('r_hora', dateObj.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }));

        // Populate Table
        // Calculate implicit exchange rate for this sale
        const totalUsd = parseFloat(sale.total_usd || 0);
        let totalBs = parseFloat(sale.total_bs || 0);

        // Fallback calculation for modal totals
        if (totalBs === 0 && totalUsd > 0 && rate > 0) {
            totalBs = totalUsd * rate;
        }

        // Populate Table
        const tbody = document.getElementById('r_tbody');
        if (tbody) {
            tbody.innerHTML = "";
            if (sale.venta_detalle && sale.venta_detalle.length > 0) {
                sale.venta_detalle.forEach((d, index) => {
                    const tr = document.createElement('tr');
                    const cod = d.productos ? (d.productos.codigo_barra || 'N/A') : 'XXX';
                    const desc = d.productos ? d.productos.descripcion : 'Producto desconocido';

                    // Convert line items to Bs
                    const precioBs = parseFloat(d.precio_unitario_usd) * rate;
                    const subtotalBs = parseFloat(d.subtotal_usd) * rate;

                    tr.innerHTML = `
                        <td>${index + 1} ${cod}</td>
                        <td>${desc}</td>
                        <td class="text-center">${d.cantidad}</td>
                        <td class="text-right">${precioBs.toFixed(2)}</td>
                        <td class="text-right">${subtotalBs.toFixed(2)}</td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        }

        // Totals
        setText('r_total_factura', totalBs.toFixed(2));
        setText('r_gran_total_bs', totalBs.toFixed(2));

        // Show modal via hidden button click (works with Bootstrap data-api without needing JS object)
        const btnOpen = document.getElementById('btnOpenModal');
        if (btnOpen) {
            btnOpen.click();
        } else {
            // Fallback
            if (window.jQuery && window.jQuery('#modalDetalleVenta').modal) {
                window.jQuery('#modalDetalleVenta').modal('show');
            }
        }

    } catch (error) {
        console.error("Error cargando detalles:", error);
        // User requested NO ALERTS, just logs.
    }
};

document.addEventListener("DOMContentLoaded", loadVentas);
