# Cache y despliegue en Firebase Hosting

## Resumen

El deploy en Firebase Hosting es correcto. Si no se ven los cambios, la causa suele ser **caché en el CDN o en el navegador**, no el despliegue. Este documento describe la configuración de caché y cómo invalidarla.

---

## 1. Service Worker (PWA)

**Estado actual:** El proyecto **no** usa service worker ni PWA (no hay `vite-plugin-pwa`, ni `sw.js`, ni registro de `navigator.serviceWorker` en el código).

- Si en el futuro se añade PWA:
  - Versionar el service worker (p. ej. nombre con hash o query `?v=...`) para que cada deploy registre una versión nueva.
  - O desregistrar el SW en cada carga si quieres evitar caché durante pruebas: en DevTools → Application → Service Workers → Unregister.

---

## 2. Configuración de caché en Firebase (`firebase.json`)

En este proyecto está configurado así (el **orden** de las reglas importa; la primera que coincide se aplica):

| Recurso | Cache-Control | Motivo |
|--------|----------------|--------|
| `/` y `/index.html` | `no-cache, no-store, must-revalidate` | La entrada no debe cachearse; siempre se pide la última versión al servidor. |
| `**/*.html` | `no-cache, no-store, must-revalidate` | Resto de páginas HTML sin caché largo. |
| `/assets/**` y `/dist/assets/**` | `public, max-age=31536000, immutable` | Assets con hash en el nombre (p. ej. `index-19c8cfc0.js`) pueden cachearse 1 año. |
| `**/*.js`, `.css`, imágenes, fuentes | `public, max-age=31536000, immutable` | Recursos versionados por nombre (hash); caché largo seguro. |

**Buenas prácticas aplicadas:**

- **HTML:** sin caché largo para que cada carga pueda obtener la versión nueva.
- **Assets con hash:** caché largo (1 año, `immutable`) para mejor rendimiento; al cambiar código el build genera un nombre nuevo y el navegador pide el nuevo archivo.

---

## 3. Comprobar que se usa el canal correcto

- Usar la **URL en producción**: `https://proviweb.com` o `https://<project>.web.app`.
- No confiar en URLs de **preview** antiguas ni en enlaces guardados de despliegues previos.

---

## 4. Pruebas obligatorias tras un deploy

Para ver los cambios de inmediato:

1. **Ventana de incógnito** (Ctrl+Shift+N en Chrome): evita caché y extensiones.
2. **Hard reload:**  
   - Con DevTools abierto (F12): clic derecho en el botón de recargar → **Vaciar caché y volver a cargar de manera forzada**.  
   - O en DevTools → pestaña **Network** → marcar **Disable cache** y recargar.
3. **Borrar almacenamiento y service worker (si aplica):**  
   - DevTools → **Application** → **Storage** → **Clear site data**.  
   - **Application** → **Service Workers** → **Unregister** si aparece alguno.

Solo después de estas comprobaciones tiene sentido asumir que un “no se actualiza” es un problema de backend o de configuración, no de caché.

---

## 5. Invalidación de caché tras un deploy

- **Firebase Hosting (CDN):** no hace falta invalidar manualmente; al hacer `firebase deploy` se sirve el contenido nuevo. Las cabeceras `Cache-Control` que tenemos hacen que el HTML no se cachee de forma agresiva.
- **Navegador:**  
  - Para usuarios finales: incógnito o “vaciar caché y recargar” cuando reporten que no ven cambios.  
  - Para desarrollo: usar **Disable cache** en DevTools o incógnito de forma habitual.

---

## 6. Versionado de assets (Vite)

El build de Vite genera nombres con hash (p. ej. `index-19c8cfc0.js`). Eso hace que:

- Cada nuevo deploy tenga URLs de JS/CSS nuevas.
- El navegador no use una versión antigua en caché para el nuevo código.

Mantener esta configuración (assets con hash) y no desactivar el hashing en producción.

---

## Conclusión

- El problema de “no se ve el update” suele ser **caché en cliente o CDN**, no un fallo de deploy.
- Con la configuración actual:
  - **index.html** y el resto de HTML **no** se cachean de forma prolongada.
  - **Assets** (incluido `/assets/*` y `/dist/assets/*`) **sí** se cachean con hash.
- Para validar un deploy: usar incógnito, hard reload y, si aplica, borrar storage y desregistrar el service worker.
