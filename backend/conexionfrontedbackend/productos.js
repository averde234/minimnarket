const API_URL = 'http://localhost:5000';

let categoriasMap = {};        // { id: nombre }
let currentPage = 1;
const pageSize = 20;

let currentSearch = '';
let currentCategoriaId = '';

// Util: asegurar existencia de elementos
function $(id) {
  const el = document.getElementById(id);
  if (!el) console.error(`Elemento #${id} no encontrado en el DOM`);
  return el;
}

// Cargar categorías en el filtro y mantener el mapa
async function getCategorias() {
  const res = await fetch(`${API_URL}/categorias`);
  if (!res.ok) throw new Error('Error al obtener categorías');
  const categorias = await res.json();

  categoriasMap = {};
  const select = $('categoria-select');
  if (!select) return;

  select.innerHTML = `<option value="">Todas las categorías</option>`;

  categorias.forEach(cat => {
    // Normaliza id como string para consistencia en selects
    const idStr = String(cat.id);
    categoriasMap[idStr] = cat.nombre;

    const opt = document.createElement('option');
    opt.value = idStr;
    opt.textContent = cat.nombre;
    select.appendChild(opt);
  });
}

// Obtener productos
async function getProductos(page = 1) {
  const params = new URLSearchParams();
  params.set('page', page);
  params.set('limit', String(pageSize));
  if (currentSearch) params.set('search', currentSearch);
  if (currentCategoriaId) params.set('categoria_id', currentCategoriaId);

  const res = await fetch(`${API_URL}/productos?${params.toString()}`);
  if (!res.ok) throw new Error('Error al obtener productos');
  return res.json();
}

// Render tabla y paginación
async function renderProductos(page = 1) {
  const tbody = document.querySelector('table tbody');
  const paginationDiv = $('pagination');

  if (!tbody || !paginationDiv) {
    console.error('Tabla o contenedor de paginación no están en el DOM');
    return;
  }

  try {
    // Garantiza categorías cargadas
    if (Object.keys(categoriasMap).length === 0) {
      await getCategorias();
    }

    const result = await getProductos(page);
    const productos = result.productos || [];
    const totalPages = result.totalPages || 0;

    tbody.innerHTML = '';

    if (productos.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Sin resultados</td></tr>`;
    } else {
      productos.forEach(producto => {
        const idStr = String(producto.categoria_id);
        const fila = document.createElement('tr');
        fila.innerHTML = `
          <td>${producto.id}</td>
          <td>${producto.codigo_barra ?? ''}</td>
          <td>${producto.descripcion ?? ''}</td>
          <td>${categoriasMap[idStr] || 'Sin categoría'}</td>
          <td>
            <button class="btn btn-sm btn-warning" data-action="editar" data-id="${producto.id}">Editar</button>
            <button class="btn btn-sm btn-danger" data-action="borrar" data-id="${producto.id}">Borrar</button>
          </td>
        `;
        tbody.appendChild(fila);
      });
    }

    // Paginación
    let html = `
      <button class="btn btn-primary me-2" ${page === 1 ? 'disabled' : ''} onclick="changePage(${page - 1})">Anterior</button>
    `;
    for (let i = 1; i <= Math.max(totalPages, 1); i++) {
      html += `
        <button class="btn ${i === page ? 'btn-secondary' : 'btn-outline-primary'} me-1" onclick="changePage(${i})">${i}</button>
      `;
    }
    html += `
      <button class="btn btn-primary ms-2" ${page === totalPages || totalPages === 0 ? 'disabled' : ''} onclick="changePage(${page + 1})">Siguiente</button>
    `;

    paginationDiv.innerHTML = html;

  } catch (error) {
    console.error('Error al cargar productos:', error);
    tbody.innerHTML = `<tr><td colspan="5" class="text-danger text-center">No se pudieron cargar los productos</td></tr>`;
  }
}

function changePage(page) {
  currentPage = page;
  renderProductos(currentPage);
}

// Listeners globales
document.addEventListener('DOMContentLoaded', async () => {
  const form = $('filtros-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      currentSearch = ($('search-input')?.value || '').trim();
      currentCategoriaId = $('categoria-select')?.value || '';
      currentPage = 1;
      renderProductos(currentPage);
    });
  }

  // Render inicial
  await renderProductos(currentPage);

  // Delegación de eventos para botones de la tabla
  const tbody = document.querySelector('table tbody');
  if (tbody) {
    tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      if (action === 'editar') editarProducto(id);
      if (action === 'borrar') borrarProducto(id);
    });
  }
});

// ====== Modales ======

// Borrar
let productoAEliminar = null;

function borrarProducto(id) {
  productoAEliminar = id;

  const modalEl = $('deleteModal');
  if (!modalEl) {
    console.error('Modal de borrado no existe (#deleteModal)');
    return;
  }
  // Bootstrap debe estar cargado antes (bundle). Si falla, revisa orden de scripts.
  const deleteModal = new bootstrap.Modal(modalEl);
  deleteModal.show();
}

$('confirmDeleteBtn')?.addEventListener('click', async () => {
  if (!productoAEliminar) return;

  try {
    const res = await fetch(`${API_URL}/productos/${productoAEliminar}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al borrar producto');
    const result = await res.json();
    await renderProductos(currentPage);
  } catch (error) {
    console.error('Error al borrar producto:', error);
  }

  const modal = bootstrap.Modal.getInstance($('deleteModal'));
  modal?.hide();
  productoAEliminar = null;
});

// Editar: carga categorías en el modal como nombres
function cargarCategoriasEnModal() {
  const select = $('editCategoria');
  if (!select) {
    console.error('Select de categoría no existe (#editCategoria)');
    return;
  }
  select.innerHTML = '';

  // Si aún no están, intenta cargarlas
  const ensureCats = async () => {
    if (Object.keys(categoriasMap).length === 0) {
      await getCategorias();
    }
  };

  return ensureCats().then(() => {
    Object.entries(categoriasMap).forEach(([id, nombre]) => {
      const opt = document.createElement('option');
      opt.value = id;               // valor = ID (string)
      opt.textContent = nombre;     // visible = nombre
      select.appendChild(opt);
    });
  });
}

async function editarProducto(id) {
  try {
    const res = await fetch(`${API_URL}/productos/${id}`);
    if (!res.ok) throw new Error('Error al cargar producto');
    const producto = await res.json();

    $('editId').value = producto.id;
    $('editCodigo').value = producto.codigo_barra ?? '';
    $('editDescripcion').value = producto.descripcion ?? '';

    await cargarCategoriasEnModal();

    // Normaliza el valor del select (string vs number)
    $('editCategoria').value = String(producto.categoria_id);

    const modalEl = $('editModal');
    if (!modalEl) {
      console.error('Modal de edición no existe (#editModal)');
      return;
    }
    const editModal = new bootstrap.Modal(modalEl);
    editModal.show();
  } catch (err) {
    console.error('Error al cargar producto:', err);
  }
}

$('editForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = $('editId').value;
  const codigo_barra = $('editCodigo').value.trim();
  const descripcion = $('editDescripcion').value.trim();
  const categoria_id = $('editCategoria').value; // String -> el backend puede aceptarlo o convertir

  if (!codigo_barra || !descripcion || !categoria_id) {
    return;
  }

  try {
    const res = await fetch(`${API_URL}/productos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      // si tu backend espera número, convierte: Number(categoria_id)
      body: JSON.stringify({ codigo_barra, descripcion, categoria_id: Number(categoria_id) })
    });
    if (!res.ok) throw new Error('Error al editar producto');
    await res.json();
    await renderProductos(currentPage);
  } catch (error) {
    console.error('Error al editar producto:', error);
  }

  const modal = bootstrap.Modal.getInstance($('editModal'));
  modal?.hide();
});