import type { App, ServiceAccount } from "firebase-admin/app";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import type { Storage } from "firebase-admin/storage";

export type FirebaseAdminServices = {
  app: App;
  auth: Auth;
  db: Firestore;
  storage: Storage;
  fieldValue: typeof import("firebase-admin/firestore").FieldValue;
  projectId: string;
  storageBucket: string;
};

let servicesPromise: Promise<FirebaseAdminServices> | null = null;

async function loadAdminModule<T>(specifier: string) {
  return import(/* @vite-ignore */ specifier) as Promise<T>;
}

function firebaseRuntimeConfig() {
  try { return JSON.parse(process.env.FIREBASE_CONFIG ?? "{}") as { projectId?: string; storageBucket?: string }; } catch { return {} as { projectId?: string; storageBucket?: string }; }
}

function serviceAccountFromEnvironment(): ServiceAccount | null {
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (encoded) {
    try {
      const raw = encoded.startsWith("{") ? encoded : Buffer.from(encoded, "base64").toString("utf8");
      const parsed = JSON.parse(raw) as { project_id?: string; client_email?: string; private_key?: string };
      if (parsed.project_id && parsed.client_email && parsed.private_key) {
        return { projectId: parsed.project_id, clientEmail: parsed.client_email, privateKey: parsed.private_key.replaceAll("\\n", "\n") };
      }
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON or base64-encoded JSON.");
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replaceAll("\\n", "\n");
  return projectId && clientEmail && privateKey ? { projectId, clientEmail, privateKey } : null;
}

async function initializeServices(): Promise<FirebaseAdminServices> {
  const [appModule, authModule, firestoreModule, storageModule] = await Promise.all([
    loadAdminModule<typeof import("firebase-admin/app")>("firebase-admin/app"),
    loadAdminModule<typeof import("firebase-admin/auth")>("firebase-admin/auth"),
    loadAdminModule<typeof import("firebase-admin/firestore")>("firebase-admin/firestore"),
    loadAdminModule<typeof import("firebase-admin/storage")>("firebase-admin/storage"),
  ]);
  const runtimeConfig = firebaseRuntimeConfig();
  const serviceAccount = serviceAccountFromEnvironment();
  const projectId = serviceAccount?.projectId || process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || runtimeConfig.projectId;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || runtimeConfig.storageBucket;
  if (!projectId || !storageBucket) {
    throw new Error("Firebase Admin requires FIREBASE_PROJECT_ID and FIREBASE_STORAGE_BUCKET.");
  }

  const existing = appModule.getApps()[0];
  const app = existing ?? appModule.initializeApp({
    projectId,
    storageBucket,
    credential: serviceAccount ? appModule.cert(serviceAccount) : appModule.applicationDefault(),
  });
  const db = firestoreModule.getFirestore(app);
  db.settings({ ignoreUndefinedProperties: true, preferRest: true });
  return { app, auth: authModule.getAuth(app), db, storage: storageModule.getStorage(app), fieldValue: firestoreModule.FieldValue, projectId, storageBucket };
}

export function getFirebaseAdmin() {
  servicesPromise ??= initializeServices();
  return servicesPromise;
}
