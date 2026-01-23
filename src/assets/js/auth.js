
import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('error-message');

    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Limpiar errores
            errorMessage.classList.add('d-none');
            errorMessage.textContent = '';

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                // Login directo con Supabase
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password,
                });

                if (error) throw error;

                // Éxito
                if (data.session) {
                    localStorage.setItem('access_token', data.session.access_token);
                    localStorage.setItem('refresh_token', data.session.refresh_token);
                    localStorage.setItem('user', JSON.stringify(data.user));

                    // Redirigir
                    window.location.href = 'index.html';
                }

            } catch (error) {
                console.error('Login error:', error);
                errorMessage.textContent = error.message || 'Error al iniciar sesión';
                errorMessage.classList.remove('d-none');
            }
        });
    }
});
