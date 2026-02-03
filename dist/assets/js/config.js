// CONFIGURACIÓN GLOBAL
// Cambiar esta variable cuando subas el backend a producción (ej: Render, Railway)
// En local: "http://localhost:5000"
// En producción: "https://tu-api-en-render.com"

const SERVER_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : 'https://minimnarket.onrender.com';
