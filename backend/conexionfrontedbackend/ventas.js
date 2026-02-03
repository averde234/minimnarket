document.addEventListener("DOMContentLoaded", () => {
  // const API_URL = "https://minimnarket.onrender.com";
  const API_URL = window.location.origin;

  const codigoBarra = document.getElementById("codigoBarra");
  const buscarCodigo = document.getElementById("buscarCodigo");
  const productoInput = document.getElementById("producto");
  const proveedorSelect = document.getElementById("proveedor");
  const cantidadInput = document.getElementById("cantidad");
  const porcentajeInput = document.getElementById("porcentajeGanancia");
  const inputTasa = document.getElementById("tasa");

  // BS
  const precioEntradaBs = document.getElementById("precioEntradaBs");
  const precioSalidaBs = document.getElementById("precioSalidaBs");
  const margenGananciaBs = document.getElementById("margenGananciaBs");
  const precioUnidadBs = document.getElementById("precioUnidadBs");

  // USD
  const precioEntradaUsd = document.getElementById("precioEntradaUsd");
  const precioSalidaUsd = document.getElementById("precioSalidaUsd");
  const margenGananciaUsd = document.getElementById("margenGananciaUsd");
  const precioUnidadUsd = document.getElementById("precioUnidadUsd");

  const btnGuardar = document.getElementById("guardarInventario");
  const btnLimpiar = document.getElementById("limpiar");
  const precioDolarLabel = document.getElementById("precio-dolar");
  let precioDolarActual = null;
  let inventarioId = null;

  function normalizarNumero(valor) {
    return parseFloat(valor.toString().replace(",", ".")) || 0;
  }

  function limpiarFormulario() {
    document.querySelectorAll("input").forEach(i => i.value = "");
    productoInput.dataset.id = "";
    proveedorSelect.selectedIndex = 0;
    inventarioId = null;
  }

  async function cargarPrecioDolar() {
    try {
      const res = await fetch(`${API_URL}/dolar`);
      const data = await res.json();
      precioDolarActual = data?.current?.usd ?? data?.usd ?? null;
      precioDolarLabel.textContent = precioDolarActual ? precioDolarActual.toFixed(2) : "N/D";
    } catch (error) {
      console.error("Error cargando dólar:", error);
      precioDolarLabel.textContent = "Error";
    }
  }

  async function cargarProveedores() {
    try {
      const res = await fetch(`${API_URL}/proveedores`);
      const proveedores = await res.json();
      proveedorSelect.innerHTML = "<option selected>Seleccione proveedor</option>";
      proveedores.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = p.nombre;
        proveedorSelect.appendChild(opt);
      });
    } catch (error) {
      console.error("Error cargando proveedores:", error);
    }
  }

  // --- BUSCAR PRODUCTO Y INVENTARIO ---
  buscarCodigo.addEventListener("click", async () => {
    const codigo = codigoBarra.value.trim();
    if (!codigo) return;

    try {
      // 1. Buscar producto
      const resProd = await fetch(`${API_URL}/productos/codigo/${codigo}`);
      if (!resProd.ok) {
        console.log("Producto no encontrado.");
        inventarioId = null;
        productoInput.value = "";
        return;
      }

      const producto = await resProd.json();
      productoInput.value = producto.descripcion;
      productoInput.dataset.id = producto.id;

      // 2. Buscar inventario existente por producto
      const resInv = await fetch(`${API_URL}/inventario/producto/${producto.id}`);
      if (resInv.ok) {
        const inventario = await resInv.json();
        inventarioId = inventario.id;
        proveedorSelect.value = inventario.proveedor.id;
        cantidadInput.value = inventario.cantidad;
        porcentajeInput.value = inventario.porcentaje_ganancia;
        precioEntradaUsd.value = inventario.precio_entrada_usd;
        precioSalidaUsd.value = inventario.precio_salida_usd;
        precioUnidadUsd.value = inventario.precio_unidad_usd;
        margenGananciaUsd.value = inventario.ganancia_usd;

        if (precioDolarActual) {
          precioEntradaBs.value = (inventario.precio_entrada_usd * precioDolarActual).toFixed(2);
          precioSalidaBs.value = (inventario.precio_salida_usd * precioDolarActual).toFixed(2);
          precioUnidadBs.value = (inventario.precio_unidad_usd * precioDolarActual).toFixed(2);
          margenGananciaBs.value = (inventario.ganancia_usd * precioDolarActual).toFixed(2);
        }
      } else {
        inventarioId = null;
        console.log("No hay inventario existente, se creará uno nuevo.");
      }
    } catch (error) {
      console.error("Error buscando producto/inventario:", error);
    }
  });

  function recalcular() {
    const cantidad = normalizarNumero(cantidadInput.value) || 0;
    const tasa = precioDolarActual || normalizarNumero(inputTasa.value) || 0;

    let pInBs = normalizarNumero(precioEntradaBs.value);
    let pInUsd = normalizarNumero(precioEntradaUsd.value);
    let pOutBs = normalizarNumero(precioSalidaBs.value);
    let pOutUsd = normalizarNumero(precioSalidaUsd.value);
    let margen = normalizarNumero(margenGananciaBs.value);

    if (document.activeElement === precioEntradaBs && tasa > 0) {
      precioEntradaUsd.value = (pInBs / tasa).toFixed(2);
    } else if (document.activeElement === precioEntradaUsd && tasa > 0) {
      precioEntradaBs.value = (pInUsd * tasa).toFixed(2);
    }

    pInBs = normalizarNumero(precioEntradaBs.value);
    pInUsd = normalizarNumero(precioEntradaUsd.value);

    if (document.activeElement === porcentajeInput) {
      const margenDecimal = (normalizarNumero(porcentajeInput.value) || 0) / 100;
      pOutBs = margenDecimal < 1 ? pInBs / (1 - margenDecimal) : 0;
      precioSalidaBs.value = pOutBs.toFixed(2);
      precioSalidaUsd.value = (pOutBs / tasa).toFixed(2);
      margen = pOutBs - pInBs;
      margenGananciaBs.value = margen.toFixed(2);
      margenGananciaUsd.value = (margen / tasa).toFixed(2);
    } else if (document.activeElement === precioSalidaBs) {
      margen = pOutBs - pInBs;
      margenGananciaBs.value = margen.toFixed(2);
      margenGananciaUsd.value = (margen / tasa).toFixed(2);
      precioSalidaUsd.value = (pOutBs / tasa).toFixed(2);
    } else if (document.activeElement === precioSalidaUsd) {
      pOutBs = pOutUsd * tasa;
      precioSalidaBs.value = pOutBs.toFixed(2);
      margen = pOutBs - pInBs;
      margenGananciaBs.value = margen.toFixed(2);
      margenGananciaUsd.value = (margen / tasa).toFixed(2);
    }

    if (cantidad > 0) {
      precioUnidadBs.value = (pOutBs / cantidad).toFixed(2);
      precioUnidadUsd.value = (pOutUsd / cantidad).toFixed(2);
    }
  }

  cantidadInput.addEventListener("input", recalcular);
  precioEntradaBs.addEventListener("input", recalcular);
  precioEntradaUsd.addEventListener("input", recalcular);
  precioSalidaBs.addEventListener("input", recalcular);
  precioSalidaUsd.addEventListener("input", recalcular);
  porcentajeInput.addEventListener("input", recalcular);

  btnGuardar.addEventListener("click", async () => {
    const productos_id = parseInt(productoInput.dataset.id);
    const proveedor_id = parseInt(proveedorSelect.value);
    if (!productos_id || !proveedor_id) return console.log("Producto o proveedor inválidos");

    const cantidad = normalizarNumero(cantidadInput.value);
    const precioEntrada = normalizarNumero(precioEntradaUsd.value);
    const precioSalida = normalizarNumero(precioSalidaUsd.value);
    const porcentaje = normalizarNumero(porcentajeInput.value);
    const precioUnidad = normalizarNumero(precioUnidadUsd.value);
    const margen = normalizarNumero(margenGananciaUsd.value);
    const total = cantidad * precioSalida;

    try {
      let response;
      if (inventarioId) {
        response = await fetch(`${API_URL}/inventario/${inventarioId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            precio_salida_usd: precioSalida,
            precio_unidad_usd: precioUnidad,
            porcentaje_ganancia: porcentaje,
            ganancia_usd: margen,
            total_usd: total,
            proveedor_id
          })
        });
      } else {
        const inventario = {
          productos_id,
          categorias_id: 1,
          proveedor_id,
          cantidad,
          precio_entrada_usd: precioEntrada,
          precio_salida_usd: precioSalida,
          precio_unidad_usd: precioUnidad,
          porcentaje_ganancia: porcentaje,
          ganancia_usd: margen,
          total_usd: total
        };
        response = await fetch(`${API_URL}/inventario`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(inventario)
        });
      }

      if (response.ok) {
        console.log(inventarioId ? "Inventario actualizado" : "Inventario creado");
        limpiarFormulario();
      } else {
        const err = await response.json();
        console.log("Error al guardar:", err.error);
      }
    } catch (error) {
      console.error("Error en guardar:", error);
    }
  });

  btnLimpiar.addEventListener("click", limpiarFormulario);

  (async () => {
    await cargarPrecioDolar();
    await cargarProveedores();
  })();
});
