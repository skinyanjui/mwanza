import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { headers } from "next/headers";

export type FirebaseServerUser = {
  uid: string;
  email: string | null;
  name: string | null;
  claims: JWTPayload;
};

const authKeys = createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));
const appCheckKeys = createRemoteJWKSet(new URL("https://firebaseappcheck.googleapis.com/v1/jwks"));

function bearer(value: string | null) {
  if (!value?.startsWith("Bearer ")) return null;
  return value.slice(7).trim() || null;
}

async function authorizationToken(request?: Request) {
  const authorization = request ? request.headers.get("authorization") : (await headers()).get("authorization");
  return bearer(authorization);
}

export async function verifyFirebaseIdToken(token: string): Promise<FirebaseServerUser | null> {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return null;
  try {
    const { payload, protectedHeader } = await jwtVerify(token, authKeys, {
      algorithms: ["RS256"],
      audience: projectId,
      issuer: `https://securetoken.google.com/${projectId}`,
    });
    if (protectedHeader.alg !== "RS256" || !payload.sub) return null;
    return {
      uid: payload.sub,
      email: typeof payload.email === "string" ? payload.email.toLowerCase() : null,
      name: typeof payload.name === "string" ? payload.name : null,
      claims: payload,
    };
  } catch {
    return null;
  }
}

export async function getFirebaseServerUser(request?: Request) {
  const token = await authorizationToken(request);
  return token ? verifyFirebaseIdToken(token) : null;
}

export async function getFirebaseServerRoles(request?: Request) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const token = await authorizationToken(request);
  if (!projectId || !token) return [] as string[];
  const user = await verifyFirebaseIdToken(token);
  if (!user) return [] as string[];
  try {
    const endpoint = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/accounts/${encodeURIComponent(user.uid)}`;
    const appCheckToken = request ? request.headers.get("x-firebase-appcheck") : (await headers()).get("x-firebase-appcheck");
    const requestHeaders = new Headers({ authorization: `Bearer ${token}` });
    if (appCheckToken) requestHeaders.set("x-firebase-appcheck", appCheckToken);
    const response = await fetch(endpoint, { headers: requestHeaders, cache: "no-store" });
    if (!response.ok) return [] as string[];
    const document = await response.json() as { fields?: { roles?: { arrayValue?: { values?: Array<{ stringValue?: string }> } } } };
    return (document.fields?.roles?.arrayValue?.values ?? []).map((value) => value.stringValue).filter((value): value is string => Boolean(value));
  } catch {
    return [] as string[];
  }
}

export async function verifyFirebaseAppCheck(request: Request) {
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
