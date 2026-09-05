# PROVIWEB Public

Integración pública de **PROVIWEB Connect** para inicio de sesión federado en apps Android y sitios web de terceros.

## Enlaces de referencia

- Documentación web (hosting): `https://proviweb-d8764-c592e.web.app/docs-sso.html`
- Guía backend OAuth/PKCE: `docs/OAUTH_PKCE_BACKEND.md`
- Pantalla de autorización: `https://proviweb-d8764-c592e.web.app/oauth-authorize.html`
- Token endpoint (HTTP): `https://proviweb-d8764-c592e.web.app/oauth/token`

## Flujo base para terceros

1. Registrar `client_id` y `redirect_uri` en la consola OAuth de PROVIWEB (`public/admin.html`).
2. Abrir `oauth-authorize.html` con `response_type=code`, `scope` y PKCE S256.
3. El usuario inicia sesión en PROVIWEB y autoriza explícitamente.
4. Tu callback recibe `code` y `state`.
5. Canjear el `code` en `POST /oauth/token` con `code_verifier`.
6. Usar `custom_token` para autenticar al usuario en Firebase.

## Redirect URIs oficiales PROVIWEB

- `com.israviolink.app` -> `proviweb://oauth/callback/app`
- `com.israviolink.admin` -> `israviolink-admin://oauth/callback`
- `com.israviolink.nunti` -> `proviweb-nunti://oauth/callback`
- `com.israviolink.pulso` -> `proviweb-pulso://oauth/callback`
