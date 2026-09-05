# PROVIWEB Public

Sitio público y backend de **PROVIWEB Connect**, el servicio de identidad para
iniciar sesión con cuenta PROVIWEB en aplicaciones móviles y sitios web de
terceros usando **OAuth 2.0 Authorization Code + PKCE (S256)**.

## Qué incluye este proyecto

- Landing y documentación pública en `public/`
- Pantalla de autorización/consentimiento en `public/oauth-authorize.html`
- Panel de registro de clientes OAuth en `public/admin.html`
- Endpoints de canje de código en Cloud Functions (`functions/index.js`)

## Endpoints públicos

- Authorization endpoint:  
  `https://proviweb-d8764-c592e.web.app/oauth-authorize.html`
- Token endpoint (HTTP POST):  
  `https://proviweb-d8764-c592e.web.app/oauth/token`
- Token endpoint (Callable, Firebase SDK):  
  `oauthTokenExchange` (región `us-central1`)
- Documentación web:  
  `https://proviweb-d8764-c592e.web.app/docs-sso.html`

## Requisitos para terceros

1. Registrar su `client_id` y `redirect_uri` en la consola OAuth de PROVIWEB.
2. Usar PKCE **S256** (obligatorio).
3. Solicitar `response_type=code`.
4. Usar solo scopes permitidos: `profile`, `email`, `qav`.
5. Validar `state` en el callback.

## Flujo de integración (apps o sitios web)

1. **Registrar cliente**
   - Alta en `OAuthClients` desde panel admin.
   - El `redirect_uri` debe coincidir exactamente con el usado en producción.
2. **Redirigir al usuario**
   - Abrir `/oauth-authorize.html` con `client_id`, `redirect_uri`, `scope`,
     `response_type=code`, `code_challenge`, `code_challenge_method=S256`,
     `state`.
3. **Autenticación y consentimiento**
   - El usuario inicia sesión o se registra en la página OAuth.
   - Autoriza explícitamente el acceso solicitado.
4. **Recibir callback**
   - PROVIWEB redirige a `redirect_uri?code=...&state=...`.
5. **Canjear código**
   - Hacer `POST /oauth/token` con `grant_type=authorization_code`, `code`,
     `client_id`, `code_verifier`.
6. **Iniciar sesión local**
   - Usar `custom_token` para autenticar al usuario con Firebase Auth.

## Ejemplo de autorización

```text
https://proviweb-d8764-c592e.web.app/oauth-authorize.html
?client_id=mi.app.tercero
&redirect_uri=https%3A%2F%2Fmi-dominio.com%2Foauth%2Fcallback
&response_type=code
&scope=profile+email+qav
&code_challenge=BASE64URL_SHA256_VERIFIER
&code_challenge_method=S256
&state=RANDOM_CSRF_TOKEN
```

## Ejemplo de canje de código

```bash
curl -X POST "https://proviweb-d8764-c592e.web.app/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "client_id=mi.app.tercero" \
  -d "code=AUTH_CODE" \
  -d "code_verifier=ORIGINAL_PKCE_VERIFIER"
```

Respuesta esperada (resumen):

```json
{
  "success": true,
  "custom_token": "....",
  "token_type": "Bearer",
  "scope": "profile email qav",
  "user": {
    "uid": "...",
    "email": "..."
  }
}
```

## Redirect URIs oficiales PROVIWEB

- `com.israviolink.app` -> `proviweb://oauth/callback/app`
- `com.israviolink.admin` -> `israviolink-admin://oauth/callback`
- `com.israviolink.nunti` -> `proviweb-nunti://oauth/callback`
- `com.israviolink.pulso` -> `proviweb-pulso://oauth/callback`

## Seguridad aplicada

- PKCE S256 obligatorio
- Validación estricta de `client_id` y `redirect_uri`
- Código de autorización firmado, con TTL y un solo uso
- Validación de coherencia `client_id` en token exchange
- Rechazo de scopes no admitidos

## Documentación técnica adicional

- `docs/OAUTH_PKCE_BACKEND.md`
