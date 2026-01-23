const API_URL = "http://localhost:5000";
const tableElement = document.getElementById("table1").getElementsByTagName("tbody")[0];
const precioDolarElement = document.getElementById("precio-dolar");

let precioDolarActual = null;

// 🔹 Cargar precio del dólar
async function cargarPrecioDolar() {
  try {
    const response = await fetch(`${API_URL}/dolar`);
    const data = await response.json();
    const precio = data?.current?.usd ?? data?.usd ?? null;

    if (precio) {
      precioDolarActual = precio;
      if (precioDolarElement) {
        precioDolarElement.textContent = precio.toLocaleString("es-VE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }) + " $";
      }
    } else {
      if (precioDolarElement) precioDolarElement.textContent = "N/D";
    }
  } catch (error) {
    console.error("Error cargando precio del dólar:", error);
    if (precioDolarElement) precioDolarElement.textContent = "Error";
  }
}

// 🔹 Cargar inventario y mostrar solo el registro con ID más alto por código de barra, sumando cantidades
async function cargarInventario() {
  try {
    const response = await fetch(`${API_URL}/inventario`);
    const inventario = await response.json();

    tableElement.innerHTML = "";

    // 🔹 Agrupar por código de barra
    const agrupado = {};

    inventario.forEach(item => {
      const codigo = item.productos?.codigo_barra ?? "N/D";

      if (!agrupado[codigo]) {
        agrupado[codigo] = { ...item };
      } else {
        // Sumar cantidades
        agrupado[codigo].cantidad += item.cantidad;
        agrupado[codigo].total_usd += item.total_usd;
        agrupado[codigo].ganancia_usd += item.ganancia_usd;

        // Mantener los datos de ID más alto
        if (item.id > agrupado[codigo].id) {
          agrupado[codigo] = { ...item, cantidad: agrupado[codigo].cantidad }; // conservar sumatoria cantidad
        }
      }
    });

    // 🔹 Renderizar tabla
    Object.values(agrupado).forEach(item => {
      const precioUnidadBs = precioDolarActual ? item.precio_unidad_usd * precioDolarActual : null;

      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${item.productos?.codigo_barra ?? "N/D"}</td>
        <td>${item.productos?.descripcion ?? "Sin descripción"}</td>
        <td>${item.cantidad}</td>
        <td>${precioUnidadBs ? precioUnidadBs.toLocaleString("es-VE", { minimumFractionDigits: 2 }) + " Bs" : "N/D"}</td>
        <td>${item.precio_unidad_usd?.toLocaleString("es-VE", { minimumFractionDigits: 2 })} $</td>
      `;
      tableElement.appendChild(fila);
    });

    // 🔹 Inicializar Simple-DataTables
    if (window.DataTable) {
      new simpleDatatables.DataTable("#table1");
    }

  } catch (error) {
    console.error("Error cargando inventario:", error);
  }
}

// 🔹 Función para mostrar detalle en modal
async function mostrarDetalle(id) {
  try {
    const response = await fetch(`${API_URL}/inventario/${id}`);
    const item = await response.json();

    const precioEntradaBs = precioDolarActual ? item.precio_entrada_usd * precioDolarActual : null;
    const precioSalidaBs = precioDolarActual ? item.precio_salida_usd * precioDolarActual : null;
    const precioUnidadBs = precioDolarActual ? item.precio_unidad_usd * precioDolarActual : null;
    const margenGananciaBs = precioDolarActual ? (item.precio_salida_usd - item.precio_entrada_usd) * precioDolarActual : null;
    const margenGananciaUsd = item.precio_salida_usd - item.precio_entrada_usd;

    modalBody.innerHTML = `
      <h5>USD</h5>
      <p><strong>Precio de entrada:</strong> ${item.precio_entrada_usd?.toFixed(2) ?? "N/D"} $</p>
      <p><strong>Precio de salida:</strong> ${item.precio_salida_usd?.toFixed(2) ?? "N/D"} $</p>
      <p><strong>Margen de ganancia:</strong> ${margenGananciaUsd?.toFixed(2) ?? "N/D"} $</p>
      <p><strong>Precio unitario:</strong> ${item.precio_unidad_usd?.toFixed(2) ?? "N/D"} $</p>

      <hr>
      <h5>Bs</h5>
      <p><strong>Precio de entrada:</strong> ${precioEntradaBs?.toLocaleString("es-VE", { minimumFractionDigits: 2 }) ?? "N/D"} Bs</p>
      <p><strong>Precio de salida:</strong> ${precioSalidaBs?.toLocaleString("es-VE", { minimumFractionDigits: 2 }) ?? "N/D"} Bs</p>
      <p><strong>Margen de ganancia:</strong> ${margenGananciaBs?.toLocaleString("es-VE", { minimumFractionDigits: 2 }) ?? "N/D"} Bs</p>
      <p><strong>Precio unitario:</strong> ${precioUnidadBs?.toLocaleString("es-VE", { minimumFractionDigits: 2 }) ?? "N/D"} Bs</p>
    `;

    modal.show();
  } catch (error) {
    console.error("Error mostrando detalle:", error);
    modalBody.innerHTML = "<p>Error al cargar detalle del producto.</p>";
    modal.show();
  }
}

// 🔹 Ejecutar al cargar
(async () => {
  await cargarPrecioDolar();
  await cargarInventario();
})();
