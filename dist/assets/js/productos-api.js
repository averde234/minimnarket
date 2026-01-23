// productos-api.js

const API_URL = 'https://minimnarket.onrender.com/productos';

document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.getElementById('table-body');
    const tableContainer = document.querySelector('.card-body'); // Contenedor para inyectar controles

    let allProducts = [];
    let filteredProducts = [];
    let currentPage = 1;
    let itemsPerPage = 10;

    if (!tableBody) return;

    // --- Inject Custom Controls (Top) ---
    const controlsDiv = document.createElement('div');
    controlsDiv.className = "d-flex justify-content-end align-items-center mb-3"; // Align right
    controlsDiv.innerHTML = `
        <div>
            <input type="text" id="searchInput" class="form-control form-control-sm" placeholder="Buscar..." style="width: 200px;">
        </div>
    `;
    tableContainer.insertBefore(controlsDiv, tableContainer.firstChild);

    // ... (rest of the file)

    // Event Listeners
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        filteredProducts = allProducts.filter(p => {
            const code = String(p.codigo_barra || '').toLowerCase();
            const desc = String(p.descripcion || '').toLowerCase();
            return code.includes(term) || desc.includes(term);
        });
        currentPage = 1;
        updateTable();
    });

    // Removed perPageSelect listener

    // --- Inject Pagination Controls (Bottom) ---
    const paginationDiv = document.createElement('div');
    paginationDiv.id = "pagination-controls";
    paginationDiv.className = "d-flex justify-content-between align-items-center mt-3";
    tableContainer.appendChild(paginationDiv);

    // --- Inject CSS for Thin Rows ---
    const style = document.createElement('style');
    style.innerHTML = `
        #table1 td, #table1 th { padding: 0.4rem 0.5rem !important; }
        .form-control-sm { min-height: 30px; }
    `;
    document.head.appendChild(style);

    // --- Logic ---

    const loadProducts = async () => {
        try {
            const response = await fetch(`${API_URL}?limit=1000`);
            if (!response.ok) throw new Error('Error al cargar productos');

            const data = await response.json();
            allProducts = data.productos || [];
            filteredProducts = [...allProducts]; // Inicialmente todos

            updateTable();

        } catch (error) {
            console.error('Error:', error);
            tableBody.innerHTML = `<tr><td colspan="4" class="text-danger text-center">Error: ${error.message}</td></tr>`;
        }
    };

    const updateTable = () => {
        // 1. Filter (already done in event listener, but ensuring consistency)
        // 2. Paginate
        const totalItems = filteredProducts.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageItems = filteredProducts.slice(start, end);

        // 3. Render Rows
        tableBody.innerHTML = '';
        if (totalItems === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No se encontraron productos</td></tr>';
        } else {
            pageItems.forEach(prod => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${prod.id}</td>
                    <td>${prod.codigo_barra || '-'}</td>
                    <td>${prod.descripcion}</td>
                    <td>${prod.categorias?.nombre || '-'}</td>
                `;
                tableBody.appendChild(row);
            });
        }

        // 4. Render Bottom Pagination
        renderPaginationControls(totalPages);
    };

    const renderPaginationControls = (totalPages) => {
        paginationDiv.innerHTML = `
            <button class="btn btn-sm btn-primary" id="prevPage" ${currentPage === 1 ? 'disabled' : ''}>Anterior</button>
            <span class="text-muted">Página ${currentPage} de ${totalPages}</span>
            <button class="btn btn-sm btn-primary" id="nextPage" ${currentPage >= totalPages ? 'disabled' : ''}>Siguiente</button>
        `;

        // Re-attach listeners (simple way)
        document.getElementById('prevPage').onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                updateTable();
            }
        };
        document.getElementById('nextPage').onclick = () => {
            if (currentPage < totalPages) {
                currentPage++;
                updateTable();
            }
        };
    };

    // --- Event Listeners ---

    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        filteredProducts = allProducts.filter(p => {
            const code = String(p.codigo_barra || '').toLowerCase();
            const desc = String(p.descripcion || '').toLowerCase();
            return code.includes(term) || desc.includes(term);
        });
        currentPage = 1; // Reset to first page on search
        updateTable();
    });

    // Init call
    loadProducts();
});
