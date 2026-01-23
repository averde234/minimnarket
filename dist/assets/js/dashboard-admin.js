document.addEventListener("DOMContentLoaded", async () => {
    const API_URL = 'http://localhost:5000';

    const tasaEl = document.getElementById('admin-tasa-dolar');
    const ventasHoyEl = document.getElementById('admin-ventas-hoy');
    const totalProdEl = document.getElementById('admin-total-productos');
    const totalUsuarioEl = document.getElementById('admin-total-usuarios');
    const salesHeaderEl = document.getElementById('admin-sales-header');

    try {
        const res = await fetch(`${API_URL}/dashboard/stats`);
        if (!res.ok) throw new Error("Error fetching stats");

        const data = await res.json();

        // 1. Tasa Dólar
        if (tasaEl) tasaEl.textContent = `Bs ${data.tasa_dolar.toFixed(2)}`;

        // 2. Ventas Hoy
        if (ventasHoyEl) ventasHoyEl.textContent = `$${data.ventas_hoy.total_usd.toFixed(2)} (${data.ventas_hoy.count})`;

        // 3. Total Productos
        if (totalProdEl) totalProdEl.textContent = data.total_productos;

        // 4. Total Usuarios
        if (totalUsuarioEl) totalUsuarioEl.textContent = data.total_usuarios;

        // 5. Sales Header (Ventas del Mes) & Percentage
        if (salesHeaderEl) salesHeaderEl.textContent = `$${data.ventas_mes.total_usd.toFixed(2)}`;

        const percentEl = document.getElementById('admin-sales-percentage');
        if (percentEl && data.ventas_mes.percentage_change !== undefined) {
            const pct = data.ventas_mes.percentage_change;
            console.log("Percentage Change:", pct);
            const isPositive = pct >= 0;
            percentEl.innerHTML = `<i data-feather="${isPositive ? 'arrow-up' : 'arrow-down'}" width="15"></i> ${Math.abs(pct).toFixed(1)}%`;
            percentEl.className = isPositive ? 'text-green' : 'text-danger';
            if (window.feather) feather.replace();
        }

        // 6. Update Chart
        const labelsSpanish = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

        if (typeof myBar !== 'undefined' && data.monthly_sales) {
            myBar.data.labels = labelsSpanish;
            myBar.data.datasets[0].data = data.monthly_sales;
            myBar.data.datasets[0].label = 'Ventas USD';
            myBar.update();
        } else if (window.myBar && data.monthly_sales) {
            window.myBar.data.labels = labelsSpanish;
            window.myBar.data.datasets[0].data = data.monthly_sales;
            window.myBar.data.datasets[0].label = 'Ventas USD';
            window.myBar.update();
        }

        // 7. Low Stock Table
        const lowStockTable = document.getElementById('low-stock-table-body');
        console.log("Dashboard JS: Checking low stock table...", lowStockTable);

        if (lowStockTable && data.low_stock_products) {
            console.log("Dashboard JS: Received low stock products:", data.low_stock_products);
            lowStockTable.innerHTML = '';
            data.low_stock_products.forEach(p => {
                let badgeClass = 'bg-warning';
                let statusText = 'Bajo';

                if (p.stock < 10) {
                    badgeClass = 'bg-danger';
                    statusText = 'Crítico';
                }

                const row = `
                    <tr>
                        <td>${p.codigo_barras || '-'}</td>
                        <td>${p.descripcion}</td>
                        <td class="font-bold">${p.stock}</td>
                        <td>
                            <span class="badge ${badgeClass}">${statusText}</span>
                        </td>
                    </tr>
                `;
                lowStockTable.innerHTML += row;
            });

            if (data.low_stock_products.length === 0) {
                lowStockTable.innerHTML = '<tr><td colspan="4" class="text-center">No hay productos con bajo stock.</td></tr>';
            }
        }

    } catch (error) {
        console.error("Dashboard error:", error);
        if (tasaEl) tasaEl.textContent = "-";
        if (ventasHoyEl) ventasHoyEl.textContent = "-";
        if (totalProdEl) totalProdEl.textContent = "-";
        if (totalUsuarioEl) totalUsuarioEl.textContent = "-";
        if (salesHeaderEl) salesHeaderEl.textContent = "$0.00";
    }

    // Print Low Stock Table Handler
    const btnPrint = document.getElementById('btn-print-low-stock');
    if (btnPrint) {
        btnPrint.addEventListener('click', () => {
            const tableContent = document.querySelector('#table1').outerHTML;
            const printWindow = window.open('', '', 'height=600,width=800');

            printWindow.document.write('<html><head><title>Productos con Bajo Stock</title>');
            printWindow.document.write('<link rel="stylesheet" href="assets/css/bootstrap.css">');
            printWindow.document.write('<style>body{padding:20px;} table{width:100%;} th,td{border:1px solid #ddd; padding:8px; text-align:left;} .badge{padding:5px; border-radius:4px;} .bg-warning{background-color:#ffc107; color:black;} .bg-danger{background-color:#dc3545; color:white;}</style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write('<h2>Reporte de Productos con Bajo Stock</h2>');
            printWindow.document.write(tableContent);
            printWindow.document.write('</body></html>');

            printWindow.document.close();
            printWindow.focus();

            // Wait for styles to load (approx) then print
            setTimeout(() => {
                printWindow.print();
                // printWindow.close(); // Optional: close after print
            }, 500);
        });

        // Re-init feather icons for the new button
        if (window.feather) feather.replace();
    }
});
