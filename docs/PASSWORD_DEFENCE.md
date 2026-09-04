# Configurar Password Defence (política de contraseñas)

Password Defence en Firebase/Google Cloud se configura como **política de contraseñas** de Identity Platform. Sirve para exigir longitud mínima, mayúsculas, minúsculas, números y caracteres especiales.

---

## 1. Dónde se configura

- **Google Cloud Console** → [Identity Platform](https://console.cloud.google.com/customer-identity) (o **Firebase Console** si tu proyecto usa Identity Platform).
- Si no ves “Password policy” / “Política de contraseñas”, comprueba que **Identity Platform** esté habilitado en el proyecto.

---

## 2. Pasos en consola

1. Abre **Google Cloud Console**: https://console.cloud.google.com/
2. Elige el proyecto **proviweb-d8764** (o el que uses).
3. Menú ☰ → **Seguridad** → **Identity Platform** (o busca “Identity Platform”).
4. En el menú lateral, entra en **Configuración** (o **Settings**).
5. Busca la sección **Password policy** / **Política de contraseñas**.
6. Configura:
   - **Estado**: **Activada** (Enforce) para que se aplique en registro e inicio de sesión.
   - **Longitud mínima**: por ejemplo **8** o **10** (mínimo 6, máximo 30).
   - **Requisitos** (si los ofrece la consola):
     - Incluir letra minúscula
     - Incluir letra mayúscula
     - Incluir número
     - Incluir carácter no alfanumérico (símbolo)
7. Opcional:
   - **Forzar actualización al iniciar sesión**: si lo activas, los usuarios con contraseña antigua tendrán que cambiarla al entrar.
8. Guarda los cambios.

---

## 3. Modos de aplicación

- **Require (Enforce)**: el registro/inicio de sesión **falla** hasta que la contraseña cumpla la política. Es el modo recomendado para “Password Defence”.
- **Notify**: el registro puede seguir, pero se devuelven avisos (por ejemplo “falta mayúscula”). Útil para no bloquear a usuarios ya existentes al activar la política.

---

## 4. En la app web (register.html)

En el registro ya se hace:

- Validación local mínima (longitud ≥ 6).
- Si Identity Platform tiene política configurada y el cliente puede obtenerla (`getPasswordPolicy`), se valida la contraseña contra esa política **antes** de llamar a `createUserWithEmailAndPassword`, y se muestran mensajes claros (longitud, mayúscula, número, símbolo).
- Si el backend rechaza la contraseña (`auth/weak-password`), se muestra un mensaje amigable.

Así, aunque la consola no ofrezca una opción llamada exactamente “Password Defence”, al configurar la **política de contraseñas** de Identity Platform estás activando el comportamiento de “Password Defence” (contraseñas más fuertes y coherentes con la política).

---

## 5. Referencias

- [Habilitar y usar políticas de contraseñas (Identity Platform)](https://cloud.google.com/identity-platform/docs/password-policy)
- [PasswordPolicy (Firebase JS)](https://firebase.google.com/docs/reference/js/auth.passwordpolicy)
- [PasswordValidationStatus (Firebase JS)](https://firebase.google.com/docs/reference/js/auth.passwordvalidationstatus)
