/**
 * PROVIWEB - Social Area Authentication Guard
 * Protege las páginas del área social para que solo usuarios registrados/autenticados puedan acceder.
 * Redirige a index.html?needAuth=1 si no hay sesión activa.
 */
(function() {
    const cachedUid = localStorage.getItem('id');
    const currentPage = window.location.pathname.split('/').pop() || 'social';
    
    function redirectToAuth() {
        // Redirigir a index indicando que se requiere registro o inicio de sesión
        window.location.replace('index.html?needAuth=1&from=' + encodeURIComponent(currentPage));
    }

    // 1. Verificación instantánea síncrona
    if (!cachedUid || cachedUid === 'null' || cachedUid === 'undefined' || cachedUid.trim() === '') {
        redirectToAuth();
        return;
    }

    // 2. Verificación asíncrona complementaria con Firebase si está cargado
    if (typeof firebase !== 'undefined' && firebase.auth) {
        try {
            firebase.auth().onAuthStateChanged(function(user) {
                if (!user && !localStorage.getItem('id')) {
                    redirectToAuth();
                }
            });
        } catch(e) {}
    }
})();
