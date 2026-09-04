const functions = require("firebase-functions");
const { playintegrity } = require("@googleapis/playintegrity");

exports.verifyPlayIntegrity = functions.https.onCall(async (data, context) => {
  try {
    const integrityToken = data.integrityToken;

    if (!integrityToken) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Integrity token missing"
      );
    }

    const auth = new playintegrity.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/playintegrity"],
    });

    const authClient = await auth.getClient();

    const integrityClient = playintegrity({
      version: "v1",
      auth: authClient,
    });

    const response = await integrityClient.v1.decodeIntegrityToken({
      packageName: "com.israviolink.app", 
      requestBody: {
        integrityToken: integrityToken,
      },
    });

    const payload = response.data.tokenPayloadExternal;

    const appVerdict = payload.appIntegrity?.appRecognitionVerdict;
    const deviceVerdicts =
      payload.deviceIntegrity?.deviceRecognitionVerdict || [];

    const appValid = appVerdict === "PLAY_RECOGNIZED";
    const deviceValid =
      deviceVerdicts.includes("MEETS_DEVICE_INTEGRITY") ||
      deviceVerdicts.includes("MEETS_STRONG_INTEGRITY");

    if (!appValid || !deviceValid) {
      return { valid: false };
    }

    return { valid: true };

  } catch (error) {
    console.error("Play Integrity error:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Play Integrity verification failed"
    );
  }
});