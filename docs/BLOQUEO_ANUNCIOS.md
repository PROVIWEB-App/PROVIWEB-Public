# Bloqueo de anuncios en el sitio

PROVIWEB no muestra anuncios de terceros. Así se asegura:

## 1. No hay scripts de publicidad

- No se usa Google AdSense ni ningún script de redes publicitarias.
- El único script de medición es **Firebase Analytics** (estadísticas propias, no anuncios).

## 2. Content-Security-Policy (CSP)

En `firebase.json` → hosting → headers está definida una **CSP** que solo permite orígenes concretos:

- **script-src**: solo `'self'`, gstatic, google.com, googleapis.com, maps (necesarios para Firebase y reCAPTCHA).  
  No se permiten dominios de anuncios (p. ej. `googlesyndication.com`, `doubleclick.net`).
- **frame-src**: solo `https://www.google.com` (reCAPTCHA). No iframes de anuncios.
- **img-src** y **connect-src**: solo los necesarios para la app. No dominios de ads.

Todo lo que no esté en la lista queda **bloqueado** por el navegador. No hace falta añadir una “lista de bloqueo”; con no autorizar redes de anuncios es suficiente.

## 3. Permissions-Policy

En `firebase.json` está configurado el header **Permissions-Policy** con:

- `interest-cohort=()` — desactiva FLoC (Federated Learning of Cohorts).
- `browsing-topics=()` — desactiva la API Topics para publicidad.

Así el navegador no usará estas APIs en tu sitio.

## 4. Hosting

- **Firebase Hosting** no inyecta anuncios. Si el sitio se sirve solo desde Firebase Hosting, no aparecerán anuncios del host.
- Si en el futuro usas otro host que inyecte anuncios, tendrías que desactivar esa opción en su panel o cambiar de plan.

## Resumen

- No incluir scripts ni iframes de redes publicitarias.
- Mantener la CSP actual en `firebase.json` (solo orígenes necesarios).
- Desplegar en Firebase Hosting (o un host que no inyecte ads).

Así el sitio queda sin anuncios de terceros.
