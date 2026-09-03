# Política de Seguridad de PROVIWEB

## Reportar una vulnerabilidad

La seguridad de PROVIWEB es una prioridad.

Si encuentras una vulnerabilidad de seguridad relacionada con PROVIWEB, evita publicarla directamente como un Issue, Pull Request o Discussion.

Las vulnerabilidades deben comunicarse de forma responsable para permitir que puedan ser investigadas y corregidas antes de divulgar detalles públicamente.

## Información que no debe publicarse

Nunca publiques en este repositorio información sensible, incluyendo:

* Claves privadas.
* Contraseñas.
* Tokens de autenticación.
* API keys privadas.
* Credenciales de Firebase.
* Credenciales de servicios externos.
* Archivos de configuración que contengan secretos.
* Keystores o claves de firma de aplicaciones.
* Semillas o claves privadas de wallets.
* Credenciales de producción.
* Información personal o datos privados de usuarios.

Ejemplos de archivos que deben permanecer fuera del repositorio público:

```text
google-services.json
local.properties
*.jks
*.keystore
*.pem
*.key
*.p12
.env
credentials.json
serviceAccount.json
```

## Divulgación responsable

Si descubres una vulnerabilidad:

1. No publiques los detalles técnicos públicamente.
2. No intentes explotar la vulnerabilidad contra usuarios reales.
3. Proporciona información suficiente para reproducir el problema.
4. Indica el impacto potencial.
5. Permite que el equipo pueda investigar y corregir el problema.

## Si un secreto fue publicado accidentalmente

Si una credencial, clave o token fue expuesto accidentalmente:

1. Revoca o rota inmediatamente la credencial.
2. Genera una nueva credencial.
3. Elimina el secreto del proyecto.
4. Revisa los registros de acceso cuando corresponda.
5. Comprueba que el secreto no continúe presente en el historial del repositorio.

Eliminar un archivo mediante un nuevo commit no necesariamente elimina el secreto del historial de Git.

## Seguridad del repositorio público

PROVIWEB-Public está destinado principalmente a presentar información pública sobre el ecosistema PROVIWEB, incluyendo funcionalidades, arquitectura conceptual, documentación, capturas y oportunidades de colaboración.

El código fuente privado de producción y las credenciales de producción no deben publicarse en este repositorio.

## Alcance

Esta política cubre vulnerabilidades relacionadas con:

* Aplicaciones y servicios de PROVIWEB.
* Integraciones utilizadas por PROVIWEB.
* Componentes de autenticación.
* Protección de datos.
* Reglas de acceso.
* Integraciones con Firebase.
* Comunicaciones.
* Procesamiento de información.
* Otros componentes relacionados con la seguridad del ecosistema.

## Gracias

Agradecemos a las personas que ayudan responsablemente a identificar problemas de seguridad y contribuyen a mantener PROVIWEB más seguro.

---

**PROVIWEB**

*Tecnología al servicio de la música.*
