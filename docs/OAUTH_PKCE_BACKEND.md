# PROVIWEB Connect: OAuth 2.0 + PKCE

## Endpoints

- Authorization: `https://proviweb-d8764-c592e.web.app/oauth-authorize.html`
- Token exchange (POST): `https://proviweb-d8764-c592e.web.app/oauth/token`
- Direct Cloud Function alternative: `https://us-central1-proviweb-d8764.cloudfunctions.net/oauthToken`

The token endpoint accepts `application/x-www-form-urlencoded` or
`application/json`. It requires an RFC 7636 S256 verifier and accepts the
standard OAuth parameter names:

```http
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code={authorization_code}&code_verifier={verifier}&client_id=com.israviolink.admin
```

A successful response contains `custom_token` (and the compatibility alias
`customToken`). Use that value only with Firebase Auth
`signInWithCustomToken`; it is not a bearer access token.

```json
{
  "custom_token": "<Firebase Custom Token>",
  "token_type": "Firebase",
  "scope": "profile email qav"
}
```

## Registered admin redirect URI

For client ID `com.israviolink.admin`, the only accepted redirect URI is:

```
israviolink-admin://oauth/callback
```

It must be sent exactly in the authorization request, including the scheme,
host, and path.

## Official mobile redirect URIs

- `com.israviolink.app` -> `proviweb://oauth/callback/app`
- `com.israviolink.admin` -> `israviolink-admin://oauth/callback`
- `com.israviolink.nunti` -> `proviweb-nunti://oauth/callback`
- `com.israviolink.pulso` -> `proviweb-pulso://oauth/callback`

## Third-party onboarding (apps and websites)

Third parties can integrate PROVIWEB Connect as long as they register
their `client_id` and `redirect_uri` first in the OAuth admin console
(`public/admin.html`, section "Clientes OAuth & SSO").

Recommended flow:

1. Register `client_id` + redirect URI.
2. Start authorization code flow with PKCE S256 at
   `.../oauth-authorize.html`.
3. User signs in and explicitly grants consent.
4. Receive `code` in third-party callback.
5. Exchange the code at `POST /oauth/token` with `code_verifier`.
6. Authenticate against Firebase using returned `custom_token`.

## Required production secret and diagnostics

Before deploying, configure the signing secret and deploy Functions plus
Hosting (the latter publishes `/oauth/token`):

```powershell
firebase functions:secrets:set OAUTH_CODE_SECRET
firebase deploy --only functions,hosting
```

Use a long, random value for the secret. A missing or inaccessible secret
causes authorization-code issuance to fail; the function now reports this as a
configuration error rather than an opaque success.

Immediately after reproducing an authorization failure, inspect the structured
entries without logging authorization codes, verifiers, or challenges:

```powershell
firebase functions:log --only oauthAuthorize,oauthTokenExchange,oauthToken --limit 100
```

The relevant events are `oauthAuthorize request` and `oauthAuthorize failed`.
They include the client ID, whether a challenge was received, its method, and
the server error code/message. PKCE material itself is never logged.
