
document.addEventListener("DOMContentLoaded", async () => {
    const API_URL = "http://localhost:5000";
    const tablaCuerpo = document.getElementById("tbody-proveedores");
    const cardContent = document.querySelector(".card-content");
    const btnGuardar = document.getElementById("btnGuardarProveedor");

    // Inputs del modal
    const inputNombre = document.getElementById("provNombre");
    const inputRif = document.getElementById("provRif");
    const inputEmail = document.getElementById("provEmail");
    const inputTelefono = document.getElementById("provTelefono");
    const inputDireccion = document.getElementById("provDireccion");

    // Refs para cerrar modal
    const btnCloseModal = document.querySelector('#modalCrearProveedor .close');
    const btnCancelModal = document.querySelector('#modalCrearProveedor .btn-light-secondary');

    let allProveedores = [];
    let currentPage = 1;
    const itemsPerPage = 10;

    // --- Inject Pagination Controls (Bottom) ---
    const paginationDiv = document.createElement('div');
    paginationDiv.id = "pagination-controls";
    paginationDiv.className = "d-flex justify-content-between align-items-center mt-3 px-4 pb-3";
    if (cardContent) cardContent.appendChild(paginationDiv);

    const cargarProveedores = async () => {
        try {
            const res = await fetch(`${API_URL}/proveedores`);
            if (!res.ok) throw new Error("Error cargando proveedores");

            const data = await res.json();
            // Soporte para { proveedores: [...] } o [...]
            const lista = Array.isArray(data) ? data : (data.proveedores || []);

            // Ordenar por ID descendente
            lista.sort((a, b) => b.id - a.id);

            allProveedores = lista;
            currentPage = 1;
            renderTable(currentPage);

        } catch (error) {
            console.error("Error proveedores:", error);
            tablaCuerpo.innerHTML = "<tr><td colspan='6' class='text-center text-danger'>Error al cargar proveedores.</td></tr>";
        }
    };

    const renderTable = (page) => {
        tablaCuerpo.innerHTML = "";

        const totalItems = allProveedores.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        currentPage = page;

        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const itemsToShow = allProveedores.slice(start, end);

        if (itemsToShow.length === 0) {
            tablaCuerpo.innerHTML = "<tr><td colspan='6' class='text-center'>No hay proveedores registrados.</td></tr>";
            actualizarControlesPaginacion(0);
            return;
        }

        itemsToShow.forEach(item => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${item.id}</td>
                <td>${item.nombre}</td>
                <td>${item.identificacion || item.rif || "-"}</td>
                <td>${item.correo || "-"}</td>
                <td>${item.telefono || "-"}</td>
                <td>${item.direccion || "-"}</td>
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

        const prevBtn = document.getElementById("prevPage");
        const nextBtn = document.getElementById("nextPage");

        if (prevBtn) {
            prevBtn.onclick = () => {
                if (currentPage > 1) renderTable(currentPage - 1);
            };
        }

        if (nextBtn) {
            nextBtn.onclick = () => {
                if (currentPage < totalPages) renderTable(currentPage + 1);
            };
        }
    };

    const guardarProveedor = async () => {
        const nombre = inputNombre.value.trim();
        if (!nombre) {
            alert("El nombre es obligatorio");
            return;
        }

        const body = {
            nombre: nombre,
            rif: inputRif.value.trim(),
            identificacion: inputRif.value.trim(), // Por si el backend usa uno u otro
            correo: inputEmail.value.trim(),
            telefono: inputTelefono.value.trim(),
            direccion: inputDireccion.value.trim()
        };

        try {
            const res = await fetch(`${API_URL}/proveedores`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Error al guardar");
            }

            alert("Proveedor guardado correctamente");

            // Cerrar modal simulando click
            if (btnCloseModal) btnCloseModal.click();
            else if (btnCancelModal) btnCancelModal.click();

            // Limpiar form
            inputNombre.value = "";
            inputRif.value = "";
            inputEmail.value = "";
            inputTelefono.value = "";
            inputDireccion.value = "";

            // Recargar lista
            await cargarProveedores();

        } catch (error) {
            console.error("Error guardando proveedor:", error);
            alert("Error: " + error.message);
        }
    };

    if (btnGuardar) {
        btnGuardar.addEventListener("click", guardarProveedor);
    }

    // Inicializar
    cargarProveedores();
});
