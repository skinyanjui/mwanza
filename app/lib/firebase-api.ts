"use client";

import { getToken as getAppCheckToken } from "firebase/app-check";
import { getFirebaseServices } from "./firebase-client";

export async function firebaseFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const services = getFirebaseServices();
  if (!services) return fetch(input, init);
  const headers = new Headers(init.headers);
  const user = services.auth.currentUser;
  if (user) headers.set("authorization", `Bearer ${await user.getIdToken()}`);
  if (services.appCheck) {
    try { headers.set("x-firebase-appcheck", (await getAppCheckToken(services.appCheck, false)).token); } catch { /* Firebase enforcement remains the server-side authority. */ }
  }
  return fetch(input, { ...init, headers });
}
