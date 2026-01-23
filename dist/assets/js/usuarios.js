
document.addEventListener("DOMContentLoaded", async () => {
    const API_URL = "https://minimnarket.onrender.com";
    const tablaCuerpo = document.getElementById("tbody-usuarios");
    const cardContent = document.querySelector(".card-content");

    // Headers con token
    const getHeaders = () => {
        const token = localStorage.getItem("access_token");
        return {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        };
    };

    let allUsuarios = [];
    let currentPage = 1;
    const itemsPerPage = 10;

    // --- Inject Pagination Controls (Bottom) ---
    const paginationDiv = document.createElement('div');
    paginationDiv.id = "pagination-controls";
    paginationDiv.className = "d-flex justify-content-between align-items-center mt-3 px-4 pb-3";
    if (cardContent) cardContent.appendChild(paginationDiv);

    const cargarUsuarios = async () => {
        try {
            const res = await fetch(`${API_URL}/usuarios`, {
                headers: getHeaders()
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                console.error("Error server:", errData);
                throw new Error(errData.error || errData.message || "Error cargando usuarios");
            }

            const users = await res.json();

            // Sort by ID or name if needed, assuming default order is fine or sort by ID desc
            // users.sort((a,b) => b.id - a.id);

            allUsuarios = users;
            currentPage = 1;
            renderTable(currentPage);

        } catch (error) {
            console.error(error);
            tablaCuerpo.innerHTML = "<tr><td colspan='5' class='text-center text-danger'>Error al cargar usuarios.</td></tr>";
        }
    };

    const renderTable = (page) => {
        tablaCuerpo.innerHTML = "";

        const totalItems = allUsuarios.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        currentPage = page;

        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const itemsToShow = allUsuarios.slice(start, end);

        if (itemsToShow.length === 0) {
            tablaCuerpo.innerHTML = "<tr><td colspan='5' class='text-center'>No hay usuarios registrados.</td></tr>";
            actualizarControlesPaginacion(0);
            return;
        }

        itemsToShow.forEach(u => {
            const tr = document.createElement("tr");

            const fullname = `${u.nombre || ""} ${u.apellido || ""}`.trim();
            const userRole = u.role || u.rol;

            // Removing the Actions column entirely as requested
            tr.innerHTML = `
                <td>${u.cedula || "-"}</td>
                <td>${fullname || u.nombre || "Usuario"}</td>
                <td>${u.email}</td>
                <td><span class="badge bg-${userRole === 'admin' ? 'danger' : 'success'}">${userRole}</span></td>
                <td>${u.phone || u.telefono || "-"}</td>
            `;
            tablaCuerpo.appendChild(tr);
        });

        if (typeof feather !== 'undefined') {
            feather.replace();
        }

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

    cargarUsuarios();
});
