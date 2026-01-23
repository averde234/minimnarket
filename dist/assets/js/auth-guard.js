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

    } catch (e) {
        console.error('Error al leer sesión:', e);
        localStorage.clear();
        window.location.href = '1auth-login.html';
    }

    // 3. Mostrar nombre del usuario en la UI si existe el elemento
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
