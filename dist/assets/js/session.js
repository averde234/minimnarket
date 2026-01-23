// session.js
// Maneja la visualización del usuario y el cierre de sesión

document.addEventListener('DOMContentLoaded', () => {
    // 1. Mostrar nombre de usuario
    const userStr = localStorage.getItem('user');
    const userNameDisplay = document.getElementById('header-user-name');

    if (userStr && userNameDisplay) {
        try {
            const user = JSON.parse(userStr);
            // Priorizamos nombre del metadata, luego email
            const displayName = user.metadata?.nombre
                ? `${user.metadata.nombre} ${user.metadata.apellido || ''}`
                : (user.nombre || user.email);

            userNameDisplay.textContent = displayName;
        } catch (e) {
            console.error("Error al leer datos de usuario:", e);
        }
    } else if (!userStr) {
        // Si no hay usuario, redirigir al login (Protección básica de frontend)
        if (!window.location.pathname.includes('auth-login') && !window.location.pathname.includes('auth-register')) {
            window.location.href = '1auth-login.html';
        }
    }

    // 2. Cerrar Sesión
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            window.location.href = '1auth-login.html';
        });
    }
});
