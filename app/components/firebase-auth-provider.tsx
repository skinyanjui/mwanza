"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { getFirebaseServices, isFirebaseConfigured } from "../lib/firebase-client";
import { createOrganization, saveAccount, watchAccount } from "../lib/firebase-data";
import type { AccountType, FirebaseAccount } from "../lib/firebase-types";

type RegistrationInput = {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  serviceArea: string;
  accountType: AccountType;
  businessName?: string;
};

type FirebaseAuthContextValue = {
  configured: boolean;
  loading: boolean;
  user: User | null;
  profile: FirebaseAccount | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  register: (input: RegistrationInput) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  updateAccount: (input: Omit<RegistrationInput, "email" | "password">) => Promise<FirebaseAccount>;
};

const FirebaseAuthContext = createContext<FirebaseAuthContextValue | null>(null);

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured();
  const [loading, setLoading] = useState(configured);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<FirebaseAccount | null>(null);

  useEffect(() => {
    const services = getFirebaseServices();
    if (!services) return;
    let stopProfile: (() => void) | undefined;
    return onAuthStateChanged(services.auth, (nextUser) => {
      stopProfile?.();
      setUser(nextUser);
      if (!nextUser) { setProfile(null); setLoading(false); return; }
      stopProfile = watchAccount(nextUser.uid, (nextProfile) => { setProfile(nextProfile); setLoading(false); });
    });
  }, []);

  const value = useMemo<FirebaseAuthContextValue>(() => ({
    configured,
    loading,
    user,
    profile,
    async signInWithEmail(email, password) {
      const services = getFirebaseServices();
      if (!services) throw new Error("Firebase Authentication is not configured.");
      await signInWithEmailAndPassword(services.auth, email.trim(), password);
    },
    async signInWithGoogle() {
      const services = getFirebaseServices();
      if (!services) throw new Error("Firebase Authentication is not configured.");
      const result = await signInWithPopup(services.auth, new GoogleAuthProvider());
      const current = await import("../lib/firebase-data").then(({ getAccount }) => getAccount(result.user.uid));
      if (!current) await saveAccount({ uid: result.user.uid, email: result.user.email ?? "", fullName: result.user.displayName ?? "Mwenza customer", phone: "", serviceArea: "Nairobi", accountType: "Home" }, null);
    },
    async register(input) {
      const services = getFirebaseServices();
      if (!services) throw new Error("Firebase Authentication is not configured.");
      const credential = await createUserWithEmailAndPassword(services.auth, input.email.trim(), input.password);
      await updateProfile(credential.user, { displayName: input.fullName.trim() });
      await sendEmailVerification(credential.user);
      const account = await saveAccount({ ...input, uid: credential.user.uid, email: credential.user.email ?? input.email }, null);
      if (input.accountType !== "Home" && input.businessName) await createOrganization({ ownerUid: credential.user.uid, name: input.businessName, type: input.accountType === "Government" ? "government" : "business" });
      setProfile(account);
    },
    async resetPassword(email) {
      const services = getFirebaseServices();
      if (!services) throw new Error("Firebase Authentication is not configured.");
      await sendPasswordResetEmail(services.auth, email.trim());
    },
    async signOutUser() {
      const services = getFirebaseServices();
      if (services) await signOut(services.auth);
    },
    async updateAccount(input) {
      if (!user) throw new Error("Sign in before updating your account.");
      const next = await saveAccount({ ...input, uid: user.uid, email: user.email ?? profile?.email ?? "" }, profile);
      setProfile(next);
      return next;
    },
  }), [configured, loading, profile, user]);

  return <FirebaseAuthContext.Provider value={value}>{children}</FirebaseAuthContext.Provider>;
}

export function useFirebaseAuth() {
  const value = useContext(FirebaseAuthContext);
  if (!value) throw new Error("useFirebaseAuth must be used inside FirebaseAuthProvider.");
  return value;
}
