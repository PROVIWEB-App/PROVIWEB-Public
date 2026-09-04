# Seguridad propia: código por teléfono (SMS), app de autenticación y anti-phishing

Este documento describe el sistema de seguridad: código de verificación por **SMS al teléfono** (o por **app de autenticación**), y protección anti-phishing.

## 1. Flujo al iniciar sesión

1. El usuario ingresa correo y contraseña (o inicia con Google).
2. Tras validar con Firebase y consentimiento, **no** se le deja entrar aún.
3. **Si tiene app de autenticación activada:** se le pide el código de 6 dígitos de la app (Google Authenticator, etc.).
4. **Si tiene teléfono registrado** (`Users/{uid}/phone`): se envía un **código por SMS** a ese número y el usuario lo ingresa.
5. **Si no tiene teléfono:** se le pide **registrar su número** (código de país + número). Se envía un SMS de verificación, el usuario lo ingresa, se guarda el número y luego se envía el código de acceso por SMS.
6. Si el código es correcto, se muestra la **frase de seguridad** (anti-phishing) y se redirige a la app.

Los **administradores** (nodo `Admin/{uid}` en la base de datos) omiten el paso del código y entran directamente.

## 2. Configuración de SMS (Twilio) – necesaria para el código por teléfono

Para enviar el código por SMS se usa **Twilio**. Configura en **Google Cloud Console** → Cloud Functions → Variables de entorno:

- `TWILIO_ACCOUNT_SID`: Account SID de tu cuenta Twilio (consola.twilio.com).
- `TWILIO_AUTH_TOKEN`: Auth Token de Twilio.
- `TWILIO_PHONE_NUMBER`: Número de teléfono de Twilio desde el que se envían los SMS (ej. +1234567890).

Sin estas variables, las funciones `sendLoginCodeToPhone` y `sendPhoneVerificationCode` devolverán error. Los usuarios que tengan **app de autenticación** activada no dependen de SMS.

## 3. Configuración del correo (opcional, para sendLoginCode por email)

Si en el futuro quieres ofrecer también código por email, configura:

El correo del proyecto es **proviwebapp@proviweb.com** (Hostinger). Para que se envíe el código por email, configura las variables de entorno en las Cloud Functions.

### Cómo configurar (no uses `firebase functions:config:set`)

El comando **`firebase functions:config:set`** está en desuso (desaparece en marzo 2026). Las funciones de este proyecto leen **variables de entorno** (`process.env`). Debes configurarlas en **Google Cloud Console**:

1. Entra en [Google Cloud Console](https://console.cloud.google.com/) y selecciona el proyecto **proviweb-d8764**.
2. Menú ☰ → **Cloud Functions** (o busca "Cloud Functions").
3. Haz clic en la función **sendLoginCode** (o **verifyLoginCode** si también la ves).
4. Arriba → **Editar**.
5. Abre la pestaña **Variables y secretos** (o **Variables de entorno**).
6. En **Variables de entorno** → **Añadir variable**:
   - Nombre: `MAILER_USER` → Valor: `proviwebapp@proviweb.com`
   - Nombre: `MAILER_PASS` → Valor: *(la contraseña del correo en Hostinger)*
7. Guarda y **Despliega** (o solo guarda si ya está desplegada).

Para la contraseña es más seguro usar un **secreto**: en la misma pantalla, en **Secretos** → **Añadir secreto** → crea o vincula un secreto (ej. `MAILER_PASS`) en Secret Manager. Luego hay que exponer ese secreto como variable en la función (en la misma UI suele aparecer como "Referencia a secreto").

### Opción recomendada: Hostinger (proviwebapp@proviweb.com)

El código usa por defecto el SMTP de Hostinger. Solo necesitas las dos variables anteriores (`MAILER_USER` y `MAILER_PASS`) como se indica arriba.

No hace falta configurar `MAILER_HOST` ni `MAILER_PORT`: ya están por defecto (`smtp.hostinger.com`, puerto `465` SSL). El remitente será **PROVIWEB &lt;proviwebapp@proviweb.com&gt;**.

Si en Hostinger usas otro puerto o sin SSL, puedes añadir:
- `MAILER_PORT` = `587` (TLS)
- `MAILER_SECURE` = `false`

### Opción B: Gmail

1. En la cuenta de Gmail, activa “Verificación en 2 pasos”.
2. Crea una **Contraseña de aplicación** (Google Account → Seguridad → Contraseñas de aplicaciones).
3. En Firebase / Google Cloud:
   - **Firebase Console** → Tu proyecto → **Functions** → **Configuración** (o **Google Cloud Console** → Cloud Functions).
   - Añade variables de entorno (o usa Secret Manager si lo prefieres):
     - `GMAIL_USER`: tu correo de Gmail
     - `GMAIL_APP_PASSWORD`: la contraseña de aplicación de 16 caracteres  
   Y para que use Gmail en lugar de Hostinger:
   - `MAILER_HOST` = `smtp.gmail.com`
   - `MAILER_PORT` = `587`
   - `MAILER_SECURE` = `false`

### Opción C: Otro SMTP

- `MAILER_USER`: usuario SMTP (correo completo)
- `MAILER_PASS`: contraseña
- `MAILER_FROM`: remitente (opcional; por defecto `proviwebapp@proviweb.com`)
- `MAILER_HOST`: servidor SMTP (ej: `smtp.tudominio.com`)
- `MAILER_PORT`: puerto (ej: `587` o `465`)
- `MAILER_SECURE`: `true` para SSL (puerto 465), `false` para STARTTLS (puerto 587)

Si no se configuran `MAILER_USER` y `MAILER_PASS` (ni Gmail), la función `sendLoginCode` devolverá un error indicando que hay que configurar el correo.

## 4. Protección anti-phishing (frase de seguridad)

- En el **registro** se pide una **frase de seguridad** opcional (o se deja en blanco).
- Esa frase se guarda en `Users/{uid}.fraseSeguridad`.
- Tras introducir el **código correcto** al iniciar sesión, se muestra esa frase en un modal.
- Si el usuario **no ve** su frase, puede estar en un sitio falso: se le indica que cierre sesión y entre solo desde el dominio oficial (proviweb.com).

Recomendación: indicar a los usuarios que solo entren cuando vean su frase de seguridad después del código.

## 5. Protección frente a ataques (implementación propia)

- **Código**: 6 dígitos aleatorios, válido **10 minutos**, **un solo uso**.
- **Almacenamiento**: en base de datos se guarda solo un **hash** del código (SHA-256), no el código en claro.
- **Límite de envíos**: como máximo **5** envíos de código por correo y **15** por IP en una ventana de **15 minutos**.
- **Verificación**: como máximo **5** intentos fallidos por código; después se invalida y hay que pedir uno nuevo.
- **Reglas de base de datos**: las rutas `LoginCodes`, `RateLimitSend` y `RateLimitSendIP` tienen lectura y escritura en `false` para el cliente; solo las Cloud Functions (admin) pueden leer/escribir.

## 5. Despliegue

```bash
cd functions
npm install
firebase deploy --only functions
```

Luego configura las variables de entorno del correo como en la sección 2.

## 7. Resumen

| Elemento              | Implementación propia                          |
|-----------------------|-----------------------------------------------|
| Código por teléfono   | Cloud Function + Twilio SMS                   |
| App de autenticación  | TOTP (speakeasy), opción en perfil            |
| Anti-phishing         | Frase de seguridad en registro y al entrar   |
| Rate limiting         | Por uid e IP para SMS; por email para email   |
| Código no almacenado  | Solo hash en base de datos                    |
| Expiración e intentos | 10 min, 5 intentos, un solo uso               |

No se usa ningún servicio externo de seguridad (por ejemplo reCAPTCHA); la lógica es propia en backend y frontend.
