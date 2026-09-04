const { onCall, HttpsError } = require("firebase-functions/v2/https");

let _playintegrity;
function getPlayIntegrity() {
  if (!_playintegrity) {
    try {
      _playintegrity = require("@googleapis/playintegrity");
    } catch (e) {
      _playintegrity = null;
    }
  }
  if (!_playintegrity) {
    throw new Error("Play Integrity API client not available");
  }
  return _playintegrity;
}

// Config: package name and accepted SHA-256 fingerprint(s)
const PACKAGE_NAME = process.env.PLAY_PACKAGE_NAME || "com.israviolink.app";
const ALLOWED_SHA256 = [
  // normalized (no colons, uppercase)
  (process.env.PLAY_SHA256 || "C3:5C:C2:8C:4F:5B:EB:32:B4:72:BD:F0:6B:A4:E5:30:79:A3:0B:C5:B1:1E:17:31:D8:70:E4:A4:F6:91:3C:62")
    .replace(/:/g, "").toUpperCase(),
];

function normalizeFingerprint(fp) {
  if (!fp || typeof fp !== "string") return "";
  return fp.replace(/:/g, "").toUpperCase();
}

function checkCertificateSha(payload) {
  const certs = payload?.appIntegrity?.certificateSha256 || payload?.appIntegrity?.certificatesSha256 || payload?.appIntegrity?.signingCertificateSha256 || [];
  if (!Array.isArray(certs)) return false;
  for (const c of certs) {
    if (ALLOWED_SHA256.includes(normalizeFingerprint(c))) return true;
  }
  return false;
}

function checkRequestHashMatches(payload, providedHash) {
  if (!providedHash) return false;
  const r = payload?.requestDetails || {};
  // possible fields
  const candidates = [r.requestHash, r.requestNonce, r.nonce, r.requestedHash].filter(Boolean);
  if (candidates.includes(providedHash)) return true;
  // also try base64 variants
  try {
    const b64 = Buffer.from(providedHash, "utf8").toString("base64");
    if (candidates.includes(b64)) return true;
  } catch (e) {
    // ignore
  }
  return false;
}

exports.verifyPlayIntegrity = onCall({ region: "us-central1" }, async (req) => {
  try {
    const data = req.data || {};
    const integrityToken = data.integrityToken;
    const providedRequestHash = data.requestHash || data.nonce || data.requestNonce;

    if (!integrityToken) {
      throw new HttpsError("invalid-argument", "integrityToken missing");
    }

    // Auth and client
    const { playintegrity } = getPlayIntegrity();
    const auth = new playintegrity.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/playintegrity"],
    });
    const authClient = await auth.getClient();
    const integrityClient = playintegrity({ version: "v1", auth: authClient });

    const response = await integrityClient.v1.decodeIntegrityToken({
      packageName: PACKAGE_NAME,
      requestBody: { integrityToken },
    });

    const payload = response.data?.tokenPayloadExternal;
    if (!payload) {
      return { valid: false, reason: "empty_payload" };
    }

    // package name
    const pkg = payload?.requestDetails?.requestPackageName || payload?.requestDetails?.packageName;
    if (pkg !== PACKAGE_NAME) {
      return { valid: false, reason: "package_mismatch" };
    }

    // certificate SHA-256
    if (!checkCertificateSha(payload)) {
      return { valid: false, reason: "certificate_mismatch" };
    }

    // requestHash / nonce verification
    if (!checkRequestHashMatches(payload, providedRequestHash)) {
      return { valid: false, reason: "request_hash_mismatch" };
    }

    // app recognition verdict
    const appVerdict = payload?.appIntegrity?.appRecognitionVerdict;
    if (appVerdict !== "PLAY_RECOGNIZED") {
      return { valid: false, reason: "app_not_recognized" };
    }

    // device integrity verdicts
    const deviceVerdicts = payload?.deviceIntegrity?.deviceRecognitionVerdict || [];
    const deviceOk = (Array.isArray(deviceVerdicts) && (deviceVerdicts.includes("MEETS_DEVICE_INTEGRITY") || deviceVerdicts.includes("MEETS_STRONG_INTEGRITY")));
    if (!deviceOk) {
      return { valid: false, reason: "device_integrity_failed" };
    }

    return { valid: true };
  } catch (err) {
    console.error("verifyPlayIntegrity error:", err);
    if (err instanceof HttpsError) throw err;
    throw new HttpsError("internal", "Play Integrity verification failed");
  }
});
