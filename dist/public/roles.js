// dist/js/roles.js
export function requireRole(allowedRoles = []) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user || !allowedRoles.includes(user.role)) {
    // Si no tiene rol permitido, redirige a una página de error o login
    window.location.href = '/unauthorized.html';
  }
}

export function showRoleSections() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user || !user.role) return;

  // Ejemplo: mostrar/ocultar secciones según rol
  if (user.role === 'admin') {
    document.getElementById('admin-section')?.classList.remove('hidden');
  } else {
    document.getElementById('admin-section')?.classList.add('hidden');
  }

  if (user.role === 'seller') {
    document.getElementById('seller-section')?.classList.remove('hidden');
  } else {
    document.getElementById('seller-section')?.classList.add('hidden');
  }
}