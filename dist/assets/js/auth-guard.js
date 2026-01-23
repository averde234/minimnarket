// auth-guard.js
// Protege rutas que solo deben ser accesibles por administradores

(function () {
    const userJson = localStorage.getItem('user');

    // 1. Verificar si hay usuario logueado
    if (!userJson) {
        // Ocultar todo el contenido inmediatamente para que no se vea nada
        document.documentElement.style.display = 'none';
        window.stop(); // Detener carga de recursos
        window.location.href = '1auth-login.html';
        return;
    }

    try {
        const user = JSON.parse(userJson);

        // 2. Verificar rol de administrador o vendedor
        if (user.rol !== 'admin' && user.rol !== 'vendedor') {
            console.warn('Acceso denegado: Usuario no es admin ni vendedor.');
            // Si es cliente, mándalo a su dashboard
            window.location.href = 'dashboard-cliente.html';
            return;
        }

        // Si es admin o vendedor, dejamos que cargue la página
        console.log('Acceso concedido:', user.rol);

        // 3. Filtrar Sidebar para Vendedores (Ejecutar cuando el DOM esté listo)
        if (user.rol === 'vendedor') {
            document.addEventListener('DOMContentLoaded', function () {
                const sidebarMenu = document.querySelector('.sidebar-menu .menu');
                if (sidebarMenu) {
                    const items = sidebarMenu.querySelectorAll('.sidebar-item');
                    items.forEach(item => {
                        const link = item.querySelector('a');
                        if (!link) return;

                        const href = link.getAttribute('href');
                        const text = link.innerText.trim().toLowerCase();

                        // Lista blanca de lo que PUEDE ver el vendedor
                        const allowed = [
                            'dashboard',
                            'ventas',
                            'registrar ventas',
                            'historial de ventas',
                            'mis compras'
                        ];

                        // Verificar si el texto o el href coincide con lo permitido
                        let isAllowed = false;

                        // Permitir Dashboard (y corregir link si es necesario)
                        if (text.includes('dashboard')) {
                            isAllowed = true;
                            link.setAttribute('href', 'dashboard-vendedor.html');
                        }

                        // Permitir Ventas
                        if (text.includes('venta')) {
                            isAllowed = true;
                        }

                        // Ocultar todo lo demás (Productos, Inventario, Compras, Proveedores, Usuarios)
                        if (!isAllowed) {
                            item.style.display = 'none';
                        }
                    });
                }
            });
        }

    } catch (e) {
        console.error('Error al leer sesión:', e);
        localStorage.clear();
        window.location.href = '1auth-login.html';
    }

    // 4. Mostrar nombre del usuario en la UI si existe el elemento
    // Esperamos a que el DOM cargue por si el script se ejecuta en head
    // 3. Mostrar nombre del usuario en la UI si existe el elemento
    // Esperamos a que el DOM cargue por si el script se ejecuta en head
    document.addEventListener('DOMContentLoaded', function () {
        const userJson = localStorage.getItem('user'); // Re-leer para asegurar alcance
        if (!userJson) return;

        try {
            const user = JSON.parse(userJson);
            const userNameDisplay = document.getElementById('user-name-display');
            if (userNameDisplay) {
                // Usar nombre directo del objeto user (según authController)
                if (user.nombre) {
                    userNameDisplay.textContent = `Hola, ${user.nombre}`;
                } else {
                    userNameDisplay.textContent = `Hola, ${user.email}`;
                }
            }
        } catch (e) {
            console.error("Error parsing user for display", e);
        }
    });

})();

// Función global de logout
window.logout = function () {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '1auth-login.html';
};
