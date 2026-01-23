
// auth-api.js
// Maneja la comunicación con el backend (Node.js + Supabase)

const API_URL = 'https://minimnarket.onrender.com'; // URL del backend

document.addEventListener('DOMContentLoaded', function () {

    // -------------------------------------------------------------------------
    // LOGIN
    // -------------------------------------------------------------------------
    const loginForm = document.querySelector('form[action="index.html"]'); // Selector genérico si no tiene ID, o usa ID si le pones uno
    // Mejora: Vamos a identificar por contexto. Si estamos en login (inputs: username, password)
    // Actualizado a español según las traducciones recientes
    const isLoginPage = document.querySelector('h3') && document.querySelector('h3').innerText.includes('Iniciar Sesión');
    const isRegisterPage = document.querySelector('h3') && document.querySelector('h3').innerText.includes('Registrarse');
    const isForgotPage = document.querySelector('h3') && document.querySelector('h3').innerText.includes('Recuperar Contraseña');
    const isResetPage = document.querySelector('h3') && document.querySelector('h3').innerText.includes('Restablecer Contraseña');

    if (isLoginPage) {
        const form = document.querySelector('form');
        if (form) {
            form.addEventListener('submit', async function (e) {
                e.preventDefault();

                // Limpiar alertas previas
                clearAlerts();

                const emailInput = document.getElementById('username') || document.getElementById('email'); // Ajustar según el HTML
                const passwordInput = document.getElementById('password');

                const email = emailInput.value;
                const password = passwordInput.value;

                try {
                    const response = await fetch(`${API_URL}/auth/signin`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password })
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.error || 'Error al iniciar sesión');
                    }

                    // Guardar sesión
                    localStorage.setItem('access_token', data.access_token);
                    localStorage.setItem('refresh_token', data.refresh_token);
                    localStorage.setItem('user', JSON.stringify(data.user));

                    // Redirigir según rol
                    // Redirigir según rol
                    if (data.user.rol === 'admin') {
                        window.location.href = 'Dashboiard-admin.html';
                    } else if (data.user.rol === 'vendedor') {
                        window.location.href = 'dashboard-vendedor.html';
                    } else {
                        // Redirigir a dashboard por defecto o mostrar error
                        window.location.href = 'index.html';
                    }

                } catch (error) {
                    showAlert(error.message, 'danger');
                }
            });
        }
    }

    // -------------------------------------------------------------------------
    // REGISTER
    // -------------------------------------------------------------------------
    if (isRegisterPage) {
        const form = document.querySelector('form');
        if (form) {
            form.addEventListener('submit', async function (e) {
                e.preventDefault();
                clearAlerts();

                // Obtener valores usando los IDs correctos definidos en auth-register.html
                const nombre = document.getElementById('first-name-column').value;
                const apellido = document.getElementById('last-name-column').value;
                const email = document.getElementById('email-column').value;
                const telefono = document.getElementById('phone-column').value;
                const cedula = document.getElementById('cedula-column').value;
                const rol = document.getElementById('role-column').value;
                const password = document.getElementById('password-column').value;
                const confirmPassword = document.getElementById('confirm-password-column').value; // Added for validation if needed

                if (password !== confirmPassword) {
                    showAlert('Las contraseñas no coinciden', 'danger');
                    return;
                }

                // Validación de seguridad de contraseña
                // Min 8 caracteres, 1 mayúscula, 1 número, 1 caracter especial
                const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
                if (!passwordRegex.test(password)) {
                    showAlert('La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un caracter especial.', 'danger');
                    return;
                }

                try {
                    // Detectar si es Admin creando usuario
                    const token = localStorage.getItem('access_token');
                    const userStr = localStorage.getItem('user');
                    let isAdmin = false;

                    if (token && userStr) {
                        try {
                            const userObj = JSON.parse(userStr);
                            if (userObj.rol === 'admin' || userObj.role === 'admin') {
                                isAdmin = true;
                            }
                        } catch (e) { console.error(e); }
                    }

                    if (isAdmin) {
                        // Flujo Admin: Crear usuario sin salir de sesión
                        const response = await fetch(`${API_URL}/usuarios/nuevo`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                email,
                                password,
                                nombre,
                                apellido,
                                cedula,
                                phone: telefono, // Controller espera 'phone'
                                role: rol       // Controller espera 'role'
                            })
                        });

                        const data = await response.json();

                        if (!response.ok) {
                            throw new Error(data.error || 'Error creando usuario');
                        }

                        alert('Usuario creado correctamente');
                        window.location.href = '1usuarios.html';

                    } else {
                        // Flujo Publico: Registro normal
                        const response = await fetch(`${API_URL}/auth/signup`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                email,
                                password,
                                nombre,
                                apellido,
                                cedula,
                                telefono,
                                rol
                            })
                        });

                        const data = await response.json();

                        if (!response.ok) {
                            throw new Error(data.error || 'Error en el registro');
                        }

                        showAlert('Registro exitoso. Redirigiendo...', 'success');
                        setTimeout(() => {
                            window.location.href = '1auth-login.html';
                        }, 2000);
                    }

                } catch (error) {
                    showAlert(error.message, 'danger');
                }
            });
        }
    }

    // -------------------------------------------------------------------------
    // FORGOT PASSWORD
    // -------------------------------------------------------------------------
    if (isForgotPage) {
        const form = document.querySelector('form');
        if (form) {
            form.addEventListener('submit', async function (e) {
                e.preventDefault();
                clearAlerts();

                const email = document.getElementById('email-forgot').value;

                try {
                    const response = await fetch(`${API_URL}/auth/forgot-password`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email })
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.error || 'Error al solicitar recuperación');
                    }

                    showAlert(data.message, 'success');

                } catch (error) {
                    showAlert(error.message, 'danger');
                }
            });
        }
    }

    // -------------------------------------------------------------------------
    // RESET PASSWORD
    // -------------------------------------------------------------------------
    if (isResetPage) {
        // Obtener tokens del hash de la URL
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');

        if (!accessToken) {
            showAlert('No se encontró el token de seguridad. Vuelve a solicitar el cambio de contraseña.', 'danger');
        }

        const form = document.querySelector('form');
        if (form) {
            form.addEventListener('submit', async function (e) {
                e.preventDefault();
                clearAlerts();

                const password = document.getElementById('password').value;

                // Validación de seguridad de contraseña
                const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
                if (!passwordRegex.test(password)) {
                    showAlert('La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un caracter especial.', 'danger');
                    return;
                }

                try {
                    const response = await fetch(`${API_URL}/auth/update-password`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            password,
                            access_token: accessToken,
                            refresh_token: refreshToken
                        })
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.error || 'Error al actualizar contraseña');
                    }

                    showAlert('Contraseña actualizada. Redirigiendo al login...', 'success');
                    setTimeout(() => {
                        window.location.href = '1auth-login.html';
                    }, 2000);

                } catch (error) {
                    showAlert(error.message, 'danger');
                }
            });
        }
    }

    function showAlert(msg, type) {
        const msgDiv = document.getElementById('auth-message');
        if (msgDiv) {
            msgDiv.style.display = 'block';
            msgDiv.className = `alert alert-${type}`;
            msgDiv.textContent = msg;
        } else {
            console.warn('No auth-message container found:', msg);
            // Fallback por si acaso
            alert(msg);
        }
    }

    function clearAlerts() {
        const msgDiv = document.getElementById('auth-message');
        if (msgDiv) {
            msgDiv.style.display = 'none';
            msgDiv.textContent = '';
            msgDiv.className = 'alert';
        }
    }

});
