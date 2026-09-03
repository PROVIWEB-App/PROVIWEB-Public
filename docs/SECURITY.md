# 🔐 PROVIWEB — Security

## 🛡️ Seguridad

La seguridad de PROVIWEB y de sus usuarios es una prioridad.

Si encuentras una posible vulnerabilidad de seguridad, evita divulgarla públicamente.

---

## 🚨 ¿Qué se considera una vulnerabilidad?

Entre otros casos:

* Problemas de autenticación
* Acceso no autorizado
* Exposición de información privada
* Vulnerabilidades en permisos
* Problemas relacionados con Firebase
* Exposición de credenciales
* Manipulación de datos
* Problemas de autorización
* Vulnerabilidades en comunicaciones
* Problemas relacionados con pagos o economía digital

---

## ❌ No publiques vulnerabilidades en Issues públicos

Las vulnerabilidades no deben reportarse mediante Issues públicos, Pull Requests públicos ni discusiones públicas.

Esto ayuda a reducir el riesgo de explotación antes de que pueda analizarse y corregirse el problema.

---

## 🔑 Nunca publiques secretos

No publiques:

```text
API keys privadas
Firebase credentials
google-services.json
keystores
private keys
wallet seeds
passwords
authentication tokens
production secrets
```

---

## 📸 Evidencia

Cuando sea necesario proporcionar información para reproducir un problema, utiliza únicamente datos de prueba.

Nunca compartas:

* Contraseñas
* Tokens activos
* Datos personales
* Información financiera
* Credenciales
* Frases de recuperación

---

## 🔄 Divulgación responsable

Cuando se identifique una vulnerabilidad:

```text
🔎 Descubrimiento
      ↓
🔐 Comunicación privada
      ↓
🧪 Evaluación
      ↓
🛠️ Corrección
      ↓
🧪 Verificación
      ↓
✅ Resolución
```

---

## ⚠️ Si publicaste accidentalmente un secreto

Eliminar el archivo del repositorio no necesariamente elimina el secreto del historial de Git.

En caso de exposición accidental:

1. Revoca o rota inmediatamente la credencial.
2. Evalúa el posible impacto.
3. Elimina la información del repositorio.
4. Revisa el historial cuando sea necesario.
5. Notifica al responsable correspondiente.

---

## 🎯 Objetivo

El objetivo de esta política es facilitar la identificación y resolución responsable de problemas de seguridad y proteger a los usuarios del ecosistema PROVIWEB.

> **La seguridad no es una característica adicional. Es parte fundamental del ecosistema.**
