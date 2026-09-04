const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const crypto = require("crypto");

// Lazy-loaded dependencies to avoid deployment initialization timeouts
let _nodemailer, _speakeasy, _twilio;
function getNodemailer() { if (!_nodemailer) _nodemailer = require("nodemailer"); return _nodemailer; }
function getSpeakeasy() { if (!_speakeasy) _speakeasy = require("speakeasy"); return _speakeasy; }
function getTwilio() { if (!_twilio) _twilio = require("twilio"); return _twilio; }

// Inicializar solo una vez (Realtime Database para códigos y rate limits)
if (!admin.apps.length) {
  admin.initializeApp();
}

let _db;
function getDb() {
  if (!_db) {
    try {
      _db = admin.database();
    } catch (e) {
      _db = null;
    }
  }
  if (!_db) {
    throw new Error("Realtime Database not available in this environment");
  }
  return _db;
}

// --- Clave segura para BD: email no puede tener . # $ [ ] / en keys ---
function emailToKey(email) {
  if (!email || typeof email !== "string") return "";
  return email.trim().toLowerCase().replace(/\./g, "_").replace(/@/g, "__");
}

// --- Teléfono: normalizar a E.164 (+número sin espacios) ---
function normalizePhone(phone) {
  if (!phone || typeof phone !== "string") return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return "";
  if (digits.startsWith("0")) return ""; // evita 0...
  const withPlus = digits.length === 10 && digits.startsWith("3")
    ? "57" + digits
    : digits.length >= 11
      ? digits
      : "57" + digits;
  return "+" + withPlus;
}

function getTwilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    throw new HttpsError(
      "failed-precondition",
      "SMS no configurado. Añade TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN en las Cloud Functions."
    );
  }
  return getTwilio()(sid, token);
}

async function checkRateLimitSms(uid, ip) {
  const ipKey = (ip || "").replace(/[.#$\[\]\/]/g, "_").slice(0, 64) || "unknown";
  const now = Date.now();
  const uidRef = getDb().ref("RateLimitSmsUid").child(uid);
  const ipRef = getDb().ref("RateLimitSmsIP").child(ipKey);
  const [uidSnap, ipSnap] = await Promise.all([uidRef.once("value"), ipRef.once("value")]);
  const uidData = uidSnap.val() || { count: 0, windowStart: now };
  const ipData = ipSnap.val() || { count: 0, windowStart: now };
  if (now - uidData.windowStart > RATE_WINDOW_MS) {
    uidData.count = 0;
    uidData.windowStart = now;
  }
  if (now - ipData.windowStart > RATE_WINDOW_MS) {
    ipData.count = 0;
    ipData.windowStart = now;
  }
  if (uidData.count >= MAX_SEND_PER_EMAIL) {
    throw new HttpsError("resource-exhausted", "Demasiados envíos de código. Espera unos minutos.");
  }
  if (ipData.count >= MAX_SEND_PER_IP) {
    throw new HttpsError("resource-exhausted", "Demasiadas solicitudes. Espera unos minutos.");
  }
  uidData.count += 1;
  ipData.count += 1;
  await Promise.all([uidRef.set(uidData), ipRef.set(ipData)]);
}

// --- Generar código de 6 dígitos ---
function generateCode() {
  return String(crypto.randomInt(100000, 999999));
}

// --- Hash del código (no guardamos el código en claro) ---
function hashCode(code) {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

// --- Ventana de rate limit: 15 minutos ---
const RATE_WINDOW_MS = 15 * 60 * 1000;
const MAX_SEND_PER_EMAIL = 5;
const MAX_SEND_PER_IP = 15;
const MAX_VERIFY_ATTEMPTS = 5;
const CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutos
const PENDING_PHONE_EXPIRY_MS = 10 * 60 * 1000; // 10 min para verificación de teléfono

async function checkRateLimitSend(email, ip) {
  const emailKey = emailToKey(email);
  const ipKey = (ip || "").replace(/[.#$\[\]/]/g, "_").slice(0, 64) || "unknown";
  const now = Date.now();

  const [emailRef, ipRef] = [
    getDb().ref("RateLimitSend").child(emailKey),
    getDb().ref("RateLimitSendIP").child(ipKey),
  ];

  const [emailSnap, ipSnap] = await Promise.all([emailRef.once("value"), ipRef.once("value")]);
  const emailData = emailSnap.val() || { count: 0, windowStart: now };
  const ipData = ipSnap.val() || { count: 0, windowStart: now };

  if (now - emailData.windowStart > RATE_WINDOW_MS) {
    emailData.count = 0;
    emailData.windowStart = now;
  }
  if (now - ipData.windowStart > RATE_WINDOW_MS) {
    ipData.count = 0;
    ipData.windowStart = now;
  }

  if (emailData.count >= MAX_SEND_PER_EMAIL) {
    throw new HttpsError(
      "resource-exhausted",
      "Demasiados envíos de código. Espera unos minutos e intenta de nuevo."
    );
  }
  if (ipData.count >= MAX_SEND_PER_IP) {
    throw new HttpsError(
      "resource-exhausted",
      "Demasiadas solicitudes desde esta red. Espera unos minutos."
    );
  }

  emailData.count += 1;
  ipData.count += 1;
  await Promise.all([
    emailRef.set(emailData),
    ipRef.set(ipData),
  ]);
}

async function getMailerTransporter() {
  const user = process.env.MAILER_USER || process.env.GMAIL_USER;
  const pass = process.env.MAILER_PASS || process.env.GMAIL_APP_PASSWORD;
  // Por defecto: Hostinger (proviwebapp@proviweb.com). Para Gmail usa MAILER_HOST=smtp.gmail.com, MAILER_PORT=587.
  const host = process.env.MAILER_HOST || "smtp.hostinger.com";
  const port = parseInt(process.env.MAILER_PORT || "465", 10);
  const secure = process.env.MAILER_SECURE !== "false";

  if (!user || !pass) {
    throw new HttpsError(
      "failed-precondition",
      "Correo no configurado. El administrador debe configurar MAILER_USER y MAILER_PASS en las funciones (ej. Hostinger: proviwebapp@proviweb.com)."
    );
  }

  return getNodemailer().createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

/**
 * Envía un código de verificación al correo del usuario.
 * Requiere idToken válido (usuario ya autenticado con Firebase).
 * Protección: rate limit por email e IP, código con expiración.
 */
exports.sendLoginCode = onCall({ region: "us-central1" }, async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Debes iniciar sesión primero.");
    }

    const email = (request.auth.token.email || "").trim().toLowerCase();
    if (!email) {
      throw new HttpsError("invalid-argument", "Correo no disponible.");
    }

    const ip = request.rawRequest?.ip || request.rawRequest?.connection?.remoteAddress || "";

    await checkRateLimitSend(email, ip);

    const code = generateCode();
    const codeHash = hashCode(code);
    const now = Date.now();
    const expiresAt = now + CODE_EXPIRY_MS;

    const key = emailToKey(email);
    await getDb().ref("LoginCodes").child(key).set({
      codeHash,
      expiresAt,
      attempts: 0,
      createdAt: now,
    });

    const from = process.env.MAILER_FROM || process.env.MAILER_USER || "proviwebapp@proviweb.com";
    const transporter = await getMailerTransporter();

    await transporter.sendMail({
      from: `PROVIWEB <${from}>`,
      to: email,
      subject: "Tu código de acceso a PROVIWEB",
      text: `Tu código de verificación es: ${code}\n\nVálido por 10 minutos. No compartas este código con nadie.\n\nSi no solicitaste este código, ignora este correo.`,
      html: `
      <p>Tu código de verificación es: <strong>${code}</strong></p>
      <p>Válido por 10 minutos. No compartas este código con nadie.</p>
      <p>Si no solicitaste este código, ignora este correo.</p>
      <p>— PROVIWEB</p>
    `,
    });

    return { success: true, message: "Código enviado a tu correo." };
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    console.error("sendLoginCode error:", err);
    const msg =
      err && err.code === "EAUTH"
        ? "Error al enviar el correo. Revisa usuario y contraseña del servidor de correo."
        : "No se pudo enviar el código. Si no configuraste el correo (Gmail o SMTP), hazlo en las Cloud Functions. Si ya está configurado, intenta más tarde.";
    throw new HttpsError("failed-precondition", msg);
  }
});

/**
 * Verifica el código ingresado por el usuario.
 * Requiere idToken y código de 6 dígitos.
 * Protección: máximo intentos, expiración, código de un solo uso.
 */
exports.verifyLoginCode = onCall({ region: "us-central1" }, async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Debes iniciar sesión primero.");
    }

    const email = (request.auth.token.email || "").trim().toLowerCase();
    const code = typeof request.data?.code === "string" ? request.data.code.trim() : "";

    if (!email) {
      throw new HttpsError("invalid-argument", "Correo no disponible.");
    }
    if (!/^\d{6}$/.test(code)) {
      throw new HttpsError("invalid-argument", "El código debe tener 6 dígitos.");
    }

    const key = emailToKey(email);
    const codeRef = getDb().ref("LoginCodes").child(key);
    const snap = await codeRef.once("value");

    if (!snap.exists()) {
      throw new HttpsError("failed-precondition", "No hay código pendiente. Solicita uno nuevo.");
    }

    const data = snap.val();
    const now = Date.now();

    if (now > data.expiresAt) {
      await codeRef.remove();
      throw new HttpsError("failed-precondition", "El código ha expirado. Solicita uno nuevo.");
    }

    if (data.attempts >= MAX_VERIFY_ATTEMPTS) {
      await codeRef.remove();
      throw new HttpsError(
        "resource-exhausted",
        "Demasiados intentos fallidos. Solicita un nuevo código."
      );
    }

    const codeHash = hashCode(code);
    if (codeHash !== data.codeHash) {
      await codeRef.update({ attempts: (data.attempts || 0) + 1 });
      throw new HttpsError("invalid-argument", "Código incorrecto.");
    }

    await codeRef.remove();
    return { success: true };
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    console.error("verifyLoginCode error:", err);
    throw new HttpsError(
      "failed-precondition",
      err && err.message ? err.message : "Error al verificar el código. Intenta de nuevo."
    );
  }
});

// --- Autenticación en dos pasos con app (Google Authenticator, etc.) ---

/**
 * Inicia la configuración de la app de autenticación. Genera un secreto TOTP y lo guarda como pendiente.
 * Devuelve otpauthUrl para mostrar el QR y el secret en base32 por si el usuario lo escribe a mano.
 */
exports.setupTotp = onCall({ region: "us-central1" }, async (request) => {
  try {
    if (!request.auth) throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
    const uid = request.auth.uid;
    const email = (request.auth.token.email || "").trim() || uid;

    const secret = getSpeakeasy().generateSecret({
      name: "PROVIWEB (" + email + ")",
      issuer: "PROVIWEB",
      length: 20,
    });

    if (!secret.base32 || !secret.otpauth_url) {
      throw new HttpsError("internal", "No se pudo generar el secreto.");
    }

    await getDb().ref("TwoFactorSecrets").child(uid).set({
      pendingSecret: secret.base32,
      pendingAt: Date.now(),
    });

    return {
      secretBase32: secret.base32,
      otpauthUrl: secret.otpauth_url,
    };
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    console.error("setupTotp error:", err);
    throw new HttpsError("failed-precondition", err && err.message ? err.message : "Error al configurar.");
  }
});

/**
 * Verifica el código que el usuario introduce desde la app y activa la autenticación por app.
 */
exports.verifyTotpSetup = onCall({ region: "us-central1" }, async (request) => {
  try {
    if (!request.auth) throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
    const uid = request.auth.uid;
    const code = typeof request.data?.code === "string" ? request.data.code.trim() : "";
    if (!/^\d{6}$/.test(code)) throw new HttpsError("invalid-argument", "El código debe tener 6 dígitos.");

    const snap = await getDb().ref("TwoFactorSecrets").child(uid).once("value");
    if (!snap.exists()) throw new HttpsError("failed-precondition", "Primero inicia la configuración de la app.");
    const data = snap.val();
    const pendingSecret = data.pendingSecret;
    if (!pendingSecret) throw new HttpsError("failed-precondition", "No hay configuración pendiente. Vuelve a empezar.");

    const valid = getSpeakeasy().totp.verify({
      secret: pendingSecret,
      encoding: "base32",
      token: code,
      window: 1,
    });
    if (!valid) throw new HttpsError("invalid-argument", "Código incorrecto. Comprueba la hora del móvil y vuelve a intentar.");

    await getDb().ref("TwoFactorSecrets").child(uid).update({
      totpSecret: pendingSecret,
      pendingSecret: null,
      pendingAt: null,
    });
    await getDb().ref("Users").child(uid).update({ twoFactorMethod: "authenticator", appVerify: "true" });

    return { success: true };
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    console.error("verifyTotpSetup error:", err);
    throw new HttpsError("failed-precondition", err && err.message ? err.message : "Error al verificar.");
  }
});

/**
 * Verifica el código TOTP en el login (cuando el usuario tiene twoFactorMethod === "authenticator").
 */
exports.verifyLoginTotp = onCall({ region: "us-central1" }, async (request) => {
  try {
    if (!request.auth) throw new HttpsError("unauthenticated", "Debes iniciar sesión primero.");
    const uid = request.auth.uid;
    const code = typeof request.data?.code === "string" ? request.data.code.trim() : "";
    if (!/^\d{6}$/.test(code)) throw new HttpsError("invalid-argument", "El código debe tener 6 dígitos.");

    const snap = await getDb().ref("TwoFactorSecrets").child(uid).once("value");
    if (!snap.exists()) throw new HttpsError("failed-precondition", "No tienes app de autenticación configurada. Usa el código por teléfono.");
    const secret = snap.val().totpSecret;
    if (!secret) throw new HttpsError("failed-precondition", "No tienes app de autenticación configurada. Usa el código por teléfono.");

    const valid = getSpeakeasy().totp.verify({
      secret,
      encoding: "base32",
      token: code,
      window: 1,
    });
    if (!valid) throw new HttpsError("invalid-argument", "Código incorrecto. Comprueba la hora del móvil.");

    return { success: true };
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    console.error("verifyLoginTotp error:", err);
    throw new HttpsError("failed-precondition", err && err.message ? err.message : "Error al verificar.");
  }
});

/**
 * Desactiva la app de autenticación y vuelve a usar solo el código por correo.
 */
exports.disableTotp = onCall({ region: "us-central1" }, async (request) => {
  try {
    if (!request.auth) throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
    const uid = request.auth.uid;
    const code = typeof request.data?.code === "string" ? request.data.code.trim() : "";
    if (!/^\d{6}$/.test(code)) throw new HttpsError("invalid-argument", "Introduce el código actual de tu app para desactivarla.");

    const snap = await getDb().ref("TwoFactorSecrets").child(uid).once("value");
    if (!snap.exists() || !snap.val().totpSecret) {
      await getDb().ref("Users").child(uid).update({ twoFactorMethod: "email", appVerify: "false" });
      return { success: true };
    }
    const valid = getSpeakeasy().totp.verify({
      secret: snap.val().totpSecret,
      encoding: "base32",
      token: code,
      window: 1,
    });
    if (!valid) throw new HttpsError("invalid-argument", "Código incorrecto.");

    await getDb().ref("TwoFactorSecrets").child(uid).remove();
    await getDb().ref("Users").child(uid).update({ twoFactorMethod: "email", appVerify: "false" });
    return { success: true };
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    console.error("disableTotp error:", err);
    throw new HttpsError("failed-precondition", err && err.message ? err.message : "Error al desactivar.");
  }
});

// --- Código por SMS (teléfono) ---

/**
 * Envía un código de verificación al teléfono para que el usuario lo registre (Users/{uid}/phone).
 * El usuario debe luego llamar a verifyPhoneAndSave con ese código.
 */
exports.sendPhoneVerificationCode = onCall({ region: "us-central1" }, async (request) => {
  try {
    if (!request.auth) throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
    const uid = request.auth.uid;
    const rawPhone = typeof request.data?.phone === "string" ? request.data.phone.trim() : "";
    const phone = normalizePhone(rawPhone);
    if (!phone) {
      throw new HttpsError("invalid-argument", "Número inválido. Usa formato internacional, ej: +57 300 123 4567.");
    }

    const ip = request.rawRequest?.ip || request.rawRequest?.connection?.remoteAddress || "";
    await checkRateLimitSms(uid, ip);

    const code = generateCode();
    const codeHash = hashCode(code);
    const now = Date.now();
    const expiresAt = now + PENDING_PHONE_EXPIRY_MS;

    await getDb().ref("PendingPhone").child(uid).set({
      phone,
      codeHash,
      expiresAt,
      attempts: 0,
      createdAt: now,
    });

    const client = getTwilioClient();
    const from = process.env.TWILIO_PHONE_NUMBER;
    if (!from) throw new HttpsError("failed-precondition", "Configura TWILIO_PHONE_NUMBER en las funciones.");

    await client.messages.create({
      body: `Tu código PROVIWEB para verificar tu número: ${code}. Válido 10 min.`,
      from,
      to: phone,
    });

    return { success: true, message: "Código enviado al teléfono." };
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    console.error("sendPhoneVerificationCode error:", err);
    throw new HttpsError(
      "failed-precondition",
      err && err.message ? err.message : "No se pudo enviar el SMS. Revisa la configuración de Twilio."
    );
  }
});

/**
 * Verifica el código enviado al teléfono y guarda Users/{uid}/phone. Así el usuario podrá recibir el código de acceso en próximos inicios de sesión.
 */
exports.verifyPhoneAndSave = onCall({ region: "us-central1" }, async (request) => {
  try {
    if (!request.auth) throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
    const uid = request.auth.uid;
    const rawPhone = typeof request.data?.phone === "string" ? request.data.phone.trim() : "";
    const phone = normalizePhone(rawPhone);
    const code = typeof request.data?.code === "string" ? request.data.code.trim() : "";
    if (!phone) throw new HttpsError("invalid-argument", "Número inválido.");
    if (!/^\d{6}$/.test(code)) throw new HttpsError("invalid-argument", "El código debe tener 6 dígitos.");

    const snap = await getDb().ref("PendingPhone").child(uid).once("value");
    if (!snap.exists()) throw new HttpsError("failed-precondition", "Solicita primero un código a tu teléfono.");
    const data = snap.val();
    const now = Date.now();
    if (now > data.expiresAt) {
      await getDb().ref("PendingPhone").child(uid).remove();
      throw new HttpsError("failed-precondition", "El código expiró. Solicita uno nuevo.");
    }
    if ((data.attempts || 0) >= MAX_VERIFY_ATTEMPTS) {
      await getDb().ref("PendingPhone").child(uid).remove();
      throw new HttpsError("resource-exhausted", "Demasiados intentos. Solicita un nuevo código.");
    }
    if (hashCode(code) !== data.codeHash) {
      await getDb().ref("PendingPhone").child(uid).update({ attempts: (data.attempts || 0) + 1 });
      throw new HttpsError("invalid-argument", "Código incorrecto.");
    }
    if (data.phone !== phone) throw new HttpsError("invalid-argument", "El número no coincide con el que recibió el código.");

    await getDb().ref("PendingPhone").child(uid).remove();
    await getDb().ref("Users").child(uid).update({ phone });

    return { success: true, phone };
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    console.error("verifyPhoneAndSave error:", err);
    throw new HttpsError("failed-precondition", err && err.message ? err.message : "Error al verificar.");
  }
});

/**
 * Envía el código de acceso al teléfono guardado en Users/{uid}/phone. Solo si el usuario ya tiene phone registrado.
 */
exports.sendLoginCodeToPhone = onCall({ region: "us-central1" }, async (request) => {
  try {
    if (!request.auth) throw new HttpsError("unauthenticated", "Debes iniciar sesión primero.");
    const uid = request.auth.uid;

    const userSnap = await getDb().ref("Users").child(uid).once("value");
    if (!userSnap.exists()) throw new HttpsError("failed-precondition", "Usuario no encontrado.");
    const phone = (userSnap.val().phone || "").trim();
    if (!phone) {
      throw new HttpsError("failed-precondition", "No tienes número registrado. Regístralo en este paso.");
    }

    const ip = request.rawRequest?.ip || request.rawRequest?.connection?.remoteAddress || "";
    await checkRateLimitSms(uid, ip);

    const code = generateCode();
    const codeHash = hashCode(code);
    const now = Date.now();
    const expiresAt = now + CODE_EXPIRY_MS;

    await getDb().ref("LoginCodesByUid").child(uid).set({
      codeHash,
      expiresAt,
      attempts: 0,
      createdAt: now,
    });

    const client = getTwilioClient();
    const from = process.env.TWILIO_PHONE_NUMBER;
    if (!from) throw new HttpsError("failed-precondition", "Configura TWILIO_PHONE_NUMBER en las funciones.");

    await client.messages.create({
      body: `Tu código de acceso PROVIWEB: ${code}. Válido 10 min. No compartas este código.`,
      from,
      to: phone,
    });

    return { success: true, message: "Código enviado a tu teléfono." };
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    console.error("sendLoginCodeToPhone error:", err);
    throw new HttpsError(
      "failed-precondition",
      err && err.message ? err.message : "No se pudo enviar el SMS."
    );
  }
});

/**
 * Verifica el código de acceso enviado por SMS (cuando el usuario tiene phone en Users).
 */
exports.verifyLoginCodePhone = onCall({ region: "us-central1" }, async (request) => {
  try {
    if (!request.auth) throw new HttpsError("unauthenticated", "Debes iniciar sesión primero.");
    const uid = request.auth.uid;
    const code = typeof request.data?.code === "string" ? request.data.code.trim() : "";
    if (!/^\d{6}$/.test(code)) throw new HttpsError("invalid-argument", "El código debe tener 6 dígitos.");

    const snap = await getDb().ref("LoginCodesByUid").child(uid).once("value");
    if (!snap.exists()) {
      throw new HttpsError("failed-precondition", "No hay código pendiente. Solicita uno nuevo.");
    }
    const data = snap.val();
    const now = Date.now();
    if (now > data.expiresAt) {
      await getDb().ref("LoginCodesByUid").child(uid).remove();
      throw new HttpsError("failed-precondition", "El código expiró. Solicita uno nuevo.");
    }
    if (data.attempts >= MAX_VERIFY_ATTEMPTS) {
      await getDb().ref("LoginCodesByUid").child(uid).remove();
      throw new HttpsError("resource-exhausted", "Demasiados intentos. Solicita un nuevo código.");
    }
    if (hashCode(code) !== data.codeHash) {
      await getDb().ref("LoginCodesByUid").child(uid).update({ attempts: (data.attempts || 0) + 1 });
      throw new HttpsError("invalid-argument", "Código incorrecto.");
    }

    await getDb().ref("LoginCodesByUid").child(uid).remove();
    return { success: true };
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    console.error("verifyLoginCodePhone error:", err);
    throw new HttpsError("failed-precondition", err && err.message ? err.message : "Error al verificar.");
  }
});

// Función mínima para comprobar que las Cloud Functions responden.
exports.health = onCall(() => ({ result: "ok" }));

/**
 * Devuelve estadísticas públicas: total de usuarios en Realtime Database (Users)
 * y desglose por país si los usuarios tienen campo 'country', 'countryCode' o 'pais'.
 * Llamable sin auth para que la web pueda mostrar métricas.
 */
exports.getPublicStats = onCall({ region: "us-central1" }, async () => {
  try {
    const usersRef = getDb().ref("Users");
    const snapshot = await usersRef.once("value");
    if (!snapshot.exists()) {
      return { userCount: 0, byCountry: {} };
    }
    const users = snapshot.val();
    const userIds = Object.keys(users);
    const userCount = userIds.length;
    const byCountry = {};
    for (const uid of userIds) {
      const u = users[uid] || {};
      const country =
        (u.countryCode && String(u.countryCode).trim().toUpperCase()) ||
        (u.country && String(u.country).trim()) ||
        (u.pais && String(u.pais).trim()) ||
        (u.location && String(u.location).trim()) ||
        null;
      if (country) {
        const key = country.length === 2 ? country : country;
        byCountry[key] = (byCountry[key] || 0) + 1;
      }
    }
    return { userCount, byCountry };
  } catch (err) {
    console.error("getPublicStats error:", err);
    throw new HttpsError("internal", "No se pudieron obtener las estadísticas.");
  }
});


// ============================================================================
// PROVIWEB CONNECT / SSO & OAUTH 2.0 TOKEN EXCHANGE
// ============================================================================
exports.oauthTokenExchange = onCall({ region: "us-central1" }, async (req) => {
  try {
    const data = req.data || {};
    const code = data.code;
    const clientId = data.clientId || "com.israviolink.pulso";

    if (!code || typeof code !== "string") {
      throw new HttpsError("invalid-argument", "Falta el código de autorización (code).");
    }

    const codeRef = getDb().ref("OAuthAuthCodes").child(code);
    const codeSnap = await codeRef.once("value");

    if (!codeSnap.exists()) {
      throw new HttpsError("not-found", "Código de autorización inválido o ya utilizado.");
    }

    const authData = codeSnap.val();

    // Check expiration (5 min TTL)
    if (authData.expiresAt && Date.now() > authData.expiresAt) {
      await codeRef.remove();
      throw new HttpsError("deadline-exceeded", "El código de autorización ha expirado.");
    }

    // Delete single-use code immediately
    await codeRef.remove();

    const uid = authData.uid;

    // Fetch user profile and balance
    const [userSnap, balSnap] = await Promise.all([
      getDb().ref("Users").child(uid).once("value"),
      getDb().ref("Balance").child(uid).child("balance").once("value")
    ]);

    const userVal = userSnap.val() || {};
    const balanceQav = balSnap.val() || 0;

    const isAdmin = (userVal.role === 'admin' || userVal.isAdmin === true || authData.email === 'viwebpro@gmail.com' || userVal.email === 'viwebpro@gmail.com');
    const isProfessor = (userVal.verifiedProfessor === true || userVal.verifiedprofesor === 'yes');

    // Generate Firebase Custom Token for cross-app authentication
    const customToken = await admin.auth().createCustomToken(uid, {
      clientId: clientId,
      sso: true,
      role: userVal.role || "user",
      admin: isAdmin,
      professor: isProfessor
    });

    return {
      success: true,
      customToken: customToken,
      user: {
        uid: uid,
        name: userVal.name || authData.name || "Músico",
        username: userVal.username || "",
        email: authData.email || userVal.email || "",
        photo: userVal.photo || userVal.image || authData.photo || "",
        verified: userVal.verified || "no",
        isAdmin: isAdmin,
        isProfessor: isProfessor,
        role: userVal.role || "user",
        balanceQav: balanceQav
      }
    };
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    console.error("oauthTokenExchange error:", err);
    throw new HttpsError("internal", "Error al procesar el inicio de sesión OAuth.");
  }
});
