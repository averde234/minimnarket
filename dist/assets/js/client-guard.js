// client-guard.js
(function () {
    const userJson = localStorage.getItem('user');
    if (!userJson) {
        window.location.href = '1auth-login.html';
        return;
    }
    // Opcional: Verificar que NO sea admin para evitar confusiones, 
    // pero generalmente no es crítico si un admin ve la vista de cliente.
    // Actualizar UI con nombre
    document.addEventListener('DOMContentLoaded', function () {
        try {
            const user = JSON.parse(userJson);
            const userNameDisplay = document.getElementById('user-name-display');
            if (userNameDisplay) {
                if (user.nombre) {
                    userNameDisplay.textContent = `Hola, ${user.nombre}`;
                } else {
                    userNameDisplay.textContent = `Hola, ${user.email}`;
                }
            }
        } catch (e) { }
    });
})();

function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '1auth-login.html';
}
