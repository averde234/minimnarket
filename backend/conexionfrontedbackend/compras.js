document.addEventListener("DOMContentLoaded", () => {
  // const API_URL = "https://minimnarket.onrender.com";
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
      const res = await fetch(`${API_URL}/dolar`);
      const data = await res.json();
      precioDolarActual = data?.current?.usd ?? data?.usd ?? 1;
      precioDolarLabel.textContent = precioDolarActual.toFixed(2);
    } catch (error) {
      console.error("Error cargando dólar:", error);
      precioDolarLabel.textContent = "Error";
      precioDolarActual = 1;
    }
  };

  const cargarProveedores = async () => {
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
  };

  const recalcular = () => {
    const cantidad = normalizarNumero(cantidadInput.value);
    const tasa = precioDolarActual || 1;

    let pBs = normalizarNumero(precioEntradaBs.value);
    let pUsd = normalizarNumero(precioEntradaUsd.value);

    if (document.activeElement === precioEntradaBs) {
      precioEntradaUsd.value = (pBs / tasa).toFixed(2);
    } else if (document.activeElement === precioEntradaUsd) {
      precioEntradaBs.value = (pUsd * tasa).toFixed(2);
    }

    pBs = normalizarNumero(precioEntradaBs.value);

    const margenDecimal = normalizarNumero(porcentajeInput.value) / 100;
    const pOutBs = margenDecimal < 1 ? pBs / (1 - margenDecimal) : 0;
    precioSalidaBs.value = pOutBs.toFixed(2);
    precioSalidaUsd.value = (pOutBs / tasa).toFixed(2);

    const margen = pOutBs - pBs;
    margenGananciaBs.value = margen.toFixed(2);
    margenGananciaUsd.value = (margen / tasa).toFixed(2);

    if (cantidad > 0) {
      precioUnidadBs.value = (pOutBs / cantidad).toFixed(2);
      precioUnidadUsd.value = ((pOutBs / tasa) / cantidad).toFixed(2);
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
    if (!productos_id || !proveedor_id || !categoriaId) {
      return mostrarAlerta("error");
    }

    const cantidad = normalizarNumero(cantidadInput.value);
    const precioEntrada = normalizarNumero(precioEntradaUsd.value);
    const precioSalida = normalizarNumero(precioSalidaUsd.value);
    const porcentaje = normalizarNumero(porcentajeInput.value);
    const precioUnidad = normalizarNumero(precioUnidadUsd.value);
    const margen = normalizarNumero(margenGananciaUsd.value);
    const total = precioSalida;

    const bodyData = {
      productos_id,
      categorias_id: categoriaId,
      proveedor_id,
      cantidad,
      precio_entrada_usd: precioEntrada,
      precio_salida_usd: precioSalida,
      precio_unidad_usd: precioUnidad,
      porcentaje_ganancia: porcentaje,
      ganancia_usd: margen,
      total_usd: total
    };

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

  // Buscar producto por código de barra
  btnBuscar.addEventListener("click", async () => {
    const codigo = codigoBarra.value.trim();
    if (!codigo) return mostrarAlerta("error");

    try {
      const res = await fetch(`${API_URL}/productos/codigo/${codigo}`);
      if (!res.ok) throw new Error("Producto no encontrado");

      const data = await res.json();
      const p = data.productos?.[0] || data;

      if (!p) throw new Error("Producto no encontrado");

      productoInput.value = p.descripcion || "";
      productoInput.dataset.id = p.id || "";
      categoriaId = p.categoria_id || null;
      proveedorSelect.selectedIndex = 0;
      precioEntradaBs.value = 0;
      precioEntradaUsd.value = 0;
      porcentajeInput.value = 0;

      recalcular();
    } catch (error) {
      console.error("Error al buscar producto:", error);
      mostrarAlerta("error");
    }
  });

  // Inicializar
  (async () => {
    await cargarPrecioDolar();
    await cargarProveedores();
  })();
});
