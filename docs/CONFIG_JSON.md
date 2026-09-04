# Revisión de archivos JSON del proyecto

## Resumen

Todos los JSON de configuración están alineados con el proyecto PROVIWEB (hosting en `public/`, Realtime Database, Cloud Functions, proyecto `proviweb-d8764`).

---

## 1. `firebase.json`

| Sección | Valor | Comentario |
|--------|--------|------------|
| **database.rules** | `database.rules.json` | Reglas de Realtime Database; archivo existe en la raíz. |
| **hosting.public** | `public` | Carpeta que se despliega (index.html, register.html, home.html, assets, etc.). |
| **hosting.ignore** | firebase.json, **/.*, **/node_modules/** | Evita subir config y dependencias. |
| **hosting.headers** | Cache y seguridad | HTML sin cache; /assets con cache largo; CSP para Firebase. |
| **hosting.cleanUrls** | `true` | URLs sin .html cuando aplica. |
| **functions** | source: `functions` | Carpeta de Cloud Functions; existe y tiene index.js. |

**CSP:** Incluye `script-src` y `frame-src` para `https://www.google.com` (p. ej. Maps).  
**connect-src:** Dominios de Firebase (Realtime DB, Auth, APIs) y `https://*.googleapis.com`. El proyecto no usa App Check, reCAPTCHA ni Play Integrity.

No se usa Firestore; no hace falta bloque `firestore` en firebase.json.

---

## 2. `.firebaserc`

```json
"projects": { "default": "proviweb-d8764" }
```

Coincide con `firebaseConfig.projectId` en index.html, register.html, forgotpass.html y home.html. Correcto para deploy y emuladores.

---

## 3. `database.rules.json`

Reglas alineadas con Firebase Console:

- **Root:** `.read` y `.write` requieren `auth != null`.
- **Reels:** Índice en `pTime` para consultas ordenadas.

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "Reels": {
      ".indexOn": ["pTime"]
    }
  }
}
```

---

## 4. `package.json` (raíz)

- **name:** `proviweb-web`
- **scripts:** `serve` (emulador hosting), `build` (vite build), `deploy` (firebase deploy), `deploy:hosting`, `deploy:all` (hosting + database + functions).
- **build:** Salida de Vite en `dist/` (vite.config.js: `outDir: '../dist'`). El deploy actual usa `hosting.public: "public"`, es decir, se despliega la carpeta `public/` estática. Si en el futuro se quiere desplegar el build de Vite, habría que usar `public: "dist"` en firebase.json y desplegar después de `npm run build`.

Todo coherente con un proyecto con Vite en `public/` y deploy por Firebase Hosting desde `public/`.

---

## 5. `functions/package.json`

- **engines:** Node 22 (válido para Firebase Functions).
- **dependencies:** `firebase-admin`, `firebase-functions`, `@google-cloud/recaptcha-enterprise` (usado en functions para password check / reCAPTCHA Enterprise en backend).
- **main:** `index.js` (punto de entrada de las Cloud Functions).

Coherente con el código en `functions/index.js` y con el uso de Realtime Database y Auth desde el cliente.

---

## Comprobaciones rápidas

| Comprobación | Estado |
|--------------|--------|
| Proyecto Firebase en .firebaserc = projectId en la app | OK |
| Hosting apunta a carpeta que existe (`public`) | OK |
| Reglas de DB en archivo existente | OK |
| Functions apunta a carpeta con index.js | OK |
| CSP permite dominios de Firebase | OK |
| Cache: HTML no cacheado, assets sí | OK |

Si cambias de proyecto Firebase o de carpeta de hosting/functions, actualiza a la vez `.firebaserc`, `firebase.json` y el `firebaseConfig` en las páginas (index, register, forgotpass, home).
