// auth-guard.js
// Protege rutas que solo deben ser accesibles por administradores

(function () {
    const userJson = localStorage.getItem('user');

    // 1. Verificar si hay usuario logueado
    if (!userJson) {
        // Ocultar todo el contenido inmediatamente para que no se vea nada
        document.documentElement.style.display = 'none';
        window.stop(); // Detener carga de recursos
        window.location.href = 'login.html';
        return;
    }

    try {
        const user = JSON.parse(userJson);
        const userRol = (user.rol || user.role || '').toLowerCase().trim();

        // 2. Verificar rol de administrador o vendedor
        if (userRol !== 'admin' && userRol !== 'vendedor' && userRol !== 'administrador') {
            console.warn('Acceso denegado: Usuario no es admin ni vendedor.', userRol);
            window.location.href = 'dashboard-cliente.html';
            return;
        }

        // Si es admin o vendedor, dejamos que cargue la página
        console.log('Acceso concedido para rol:', userRol);

        // 3. Filtrar Sidebar para Vendedores
        if (userRol === 'vendedor') {
            const filterSidebar = () => {
                console.log('Iniciando filtrado de sidebar para vendedor...');
                const sidebarMenu = document.querySelector('.sidebar-menu .menu');
                if (sidebarMenu) {
                    const items = sidebarMenu.querySelectorAll('.sidebar-item');
                    items.forEach(item => {
                        const link = item.querySelector('a');
                        if (!link) return;

                        const text = link.innerText.trim().toLowerCase();
                        console.log('Evaluando item:', text);

                        // Lógica permitida
                        let isAllowed = false;
                        if (text.includes('dashboard') ||
                            text.includes('ventas') ||
                            text.includes('mis compras') ||
                            text.includes('cerrar')) {
                            isAllowed = true;
                        }

                        // Acción específica
                        if (text.includes('dashboard')) {
                            link.setAttribute('href', 'dashboard-vendedor.html');
                        }

                        // Ocultar lo prohibido
                        if (!isAllowed) {
                            console.log('Ocultando item:', text);
                            item.style.display = 'none';
                            item.classList.add('d-none'); // Bootstrap class just in case
                        }
                    });
                }
            };

            // Ejecutar inmediatamente si el DOM ya está listo, o esperar
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', filterSidebar);
            } else {
                filterSidebar();
            }
        }

    } catch (e) {
        console.error('Error al leer sesión:', e);
        localStorage.clear();
        window.location.href = 'login.html';
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
    window.location.href = 'login.html';
};
