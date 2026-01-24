document.addEventListener('DOMContentLoaded', async () => {
    // Verificar sesión
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = 'login.html';
        return;
    }
    const user = JSON.parse(userStr);

    // 1. Cargar Tasa Dolar (Universal)
    try {
        const resp = await fetch('https://minimnarket.onrender.com/dolar');
        const data = await resp.json();

        // La API devuelve structure { current: { usd: 355.55... } }
        const precio = data.current?.usd || data.price || data.promedio || 0;

        if (precio) {
            document.getElementById('vendor-tasa-dolar').innerText = `Bs ${precio.toFixed(2)}`;
        }
    } catch (e) {
        console.error('Error cargando dolar', e);
        document.getElementById('vendor-tasa-dolar').innerText = 'Error';
    }

    // 2. Cargar Mis Ventas (Filtrado por usuario_id)
    try {
        // Asumiendo que el endpoint lista ventas filtra si le pasas usuario_id
        // Si no filtra, tocará filtrar en el cliente (menos optimo pero funcional)
        const resp = await fetch(`https://minimnarket.onrender.com/ventas?usuario_id=${user.id}`);
        const ventas = await resp.json();

        if (!Array.isArray(ventas)) throw new Error('Respuesta inválida de ventas');

        // Calcular Totales
        const hoy = new Date().toISOString().split('T')[0];

        let totalVentasHoy = 0;
        let totalDineroHoy = 0;
        let totalDineroGlobal = 0;

        // Datos para gráfico (Ventas por mes)
        const salesByMonth = Array(12).fill(0);

        ventas.forEach(venta => {
            const fecha = venta.fecha.split('T')[0]; // YYYY-MM-DD
            const monto = parseFloat(venta.total_usd || 0);

            // Total Global
            totalDineroGlobal += monto;

            // Ventas de Hoy
            if (fecha === hoy) {
                totalVentasHoy++;
                totalDineroHoy += monto;
            }

            // Gráfico
            const mes = new Date(venta.fecha).getMonth(); // 0-11
            salesByMonth[mes] += monto;
        });

        // Actualizar UI Cards
        document.getElementById('vendor-ventas-hoy').innerText = `$${totalDineroHoy.toFixed(2)}`;
        document.getElementById('vendor-total-ventas').innerText = `$${totalDineroGlobal.toFixed(2)}`;

        // Renderizar Gráfico
        renderVendorChart(salesByMonth);

        // Calcular totales para la nueva UI (Mes Actual vs Mes Pasado)
        const currentMonthIndex = new Date().getMonth();
        const previousMonthIndex = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1;

        const currentMonthSales = salesByMonth[currentMonthIndex];
        const previousMonthSales = salesByMonth[previousMonthIndex];

        // Llenar datos de la tarjeta grande
        document.getElementById('vendor-sales-header').innerText = `$${currentMonthSales.toFixed(2)}`;

        // Calcular porcentaje
        let percentage = 100;
        if (previousMonthSales > 0) {
            percentage = ((currentMonthSales - previousMonthSales) / previousMonthSales) * 100;
        } else if (currentMonthSales === 0) {
            percentage = 0;
        }

        const percentageEl = document.getElementById('vendor-sales-percentage');
        percentageEl.innerHTML = `<i data-feather="bar-chart" width="15"></i> ${percentage.toFixed(1)}%`;
        percentageEl.className = percentage >= 0 ? "text-green" : "text-red";

        // Reinicializar iconos feather
        if (feather) feather.replace();

    } catch (e) {
        console.error('Error cargando ventas del vendedor:', e);
        document.getElementById('vendor-ventas-hoy').innerText = '$0.00';
        document.getElementById('vendor-total-ventas').innerText = '$0.00';
    }
});

function renderVendorChart(data) {
    const ctx = document.getElementById('vendor-chart').getContext('2d');

    // Nombres de meses en español
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'Mis Ventas ($)',
                data: data,
                backgroundColor: '#5A8DEE', // Azul principal
                borderRadius: 5,
                barThickness: 50 // Mucho más grueso
            }]
        },
        options: {
            responsive: true,
            scales: {
                yAxes: [{
                    gridLines: {
                        display: false,
                        drawBorder: false,
                    },
                    ticks: {
                        stepSize: 10
                    }
                }],
                xAxes: [{
                    gridLines: {
                        color: '#fbfbfb',
                        lineWidth: 2
                    }
                }]
            },
            legend: { display: false } // Para Chart.js v2 (parece que usa v2 por la sintaxis del admin)
        }
    });
}
