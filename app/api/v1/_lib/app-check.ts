import { createRemoteJWKSet, jwtVerify } from "jose";

const appCheckKeys = createRemoteJWKSet(new URL("https://firebaseappcheck.googleapis.com/v1/jwks"));

export async function verifyApiAppCheck(request: Request) {
  const enforced = process.env.FIREBASE_APP_CHECK_ENFORCED === "true";
  const projectNumber = process.env.FIREBASE_PROJECT_NUMBER;
  if (!enforced || !projectNumber) return true;
  const token = request.headers.get("x-firebase-appcheck");
  if (!token) return false;
  try {
    const { payload, protectedHeader } = await jwtVerify(token, appCheckKeys, {
      algorithms: ["RS256"],
      audience: `projects/${projectNumber}`,
      issuer: `https://firebaseappcheck.googleapis.com/${projectNumber}`,
    });
    const expectedAppId = process.env.FIREBASE_WEB_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
    return protectedHeader.alg === "RS256" && protectedHeader.typ === "JWT" && (!expectedAppId || payload.sub === expectedAppId);
  } catch {
    return false;
  }
}
